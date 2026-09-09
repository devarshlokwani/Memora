-- Memora initial schema
-- Every table carries user_id so RLS is a single, fast `auth.uid() = user_id` check.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums

create type card_type as enum ('flashcard', 'mcq', 'fill_blank', 'match', 'jargon');
create type course_status as enum ('draft', 'extracting', 'structuring', 'ready', 'failed');
create type document_status as enum ('uploaded', 'extracted', 'failed');
create type topic_status as enum ('pending', 'generating', 'ready', 'failed');

-- ---------------------------------------------------------------- profiles

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------- courses

create table courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  description text not null default '',
  status course_status not null default 'draft',
  error text,
  created_at timestamptz not null default now()
);

create index courses_user_idx on courses (user_id, created_at desc);

-- ---------------------------------------------------------------- documents

create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  course_id uuid not null references courses on delete cascade,
  filename text not null,
  storage_path text,
  mime_type text not null default '',
  size_bytes bigint not null default 0,
  -- Extracted plain text. Kept inline so card generation never re-parses the PDF.
  content text not null default '',
  char_count integer not null default 0,
  page_count integer,
  status document_status not null default 'uploaded',
  error text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index documents_course_idx on documents (course_id, position);

-- ---------------------------------------------------------------- structure

create table modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  course_id uuid not null references courses on delete cascade,
  title text not null,
  summary text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index modules_course_idx on modules (course_id, position);

create table topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  course_id uuid not null references courses on delete cascade,
  module_id uuid not null references modules on delete cascade,
  title text not null,
  summary text not null default '',
  key_terms jsonb not null default '[]'::jsonb,
  -- Indices into the course's deterministic chunk list; the source text for this topic.
  chunk_refs jsonb not null default '[]'::jsonb,
  status topic_status not null default 'pending',
  error text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index topics_module_idx on topics (module_id, position);
create index topics_course_idx on topics (course_id);

-- ---------------------------------------------------------------- cards

create table cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  course_id uuid not null references courses on delete cascade,
  topic_id uuid not null references topics on delete cascade,
  type card_type not null,
  -- Question / term / sentence-with-blank / match-set instruction.
  prompt text not null,
  -- Canonical answer. Empty for `match` (see pairs).
  answer text not null default '',
  -- mcq: ["a","b","c","d"].  fill_blank: accepted alternative answers.
  options jsonb not null default '[]'::jsonb,
  -- mcq: index into options.
  correct_index integer,
  -- match: [{"left":"...","right":"..."}]
  pairs jsonb not null default '[]'::jsonb,
  explanation text not null default '',
  difficulty smallint not null default 2 check (difficulty between 1 and 3),
  created_at timestamptz not null default now()
);

create index cards_topic_idx on cards (topic_id, type);
create index cards_course_idx on cards (course_id);

-- ---------------------------------------------------------------- spaced repetition

create table card_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  card_id uuid not null references cards on delete cascade,
  course_id uuid not null references courses on delete cascade,
  ease real not null default 2.5,
  interval_days real not null default 0,
  repetitions integer not null default 0,
  lapses integer not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  total_reviews integer not null default 0,
  correct_reviews integer not null default 0,
  unique (user_id, card_id)
);

create index card_progress_due_idx on card_progress (user_id, course_id, due_at);

create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  -- Null for a review drawn from every course at once.
  course_id uuid references courses on delete cascade,
  topic_id uuid references topics on delete cascade,
  mode text not null,
  answered integer not null default 0,
  correct integer not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index study_sessions_user_idx on study_sessions (user_id, started_at desc);

-- ---------------------------------------------------------------- RLS

alter table profiles        enable row level security;
alter table courses         enable row level security;
alter table documents       enable row level security;
alter table modules         enable row level security;
alter table topics          enable row level security;
alter table cards           enable row level security;
alter table card_progress   enable row level security;
alter table study_sessions  enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

do $rls$
declare t text;
begin
  foreach t in array array['courses','documents','modules','topics','cards','card_progress','study_sessions']
  loop
    execute format(
      'create policy "own rows" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end;
$rls$;

-- ---------------------------------------------------------------- storage

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Objects live at `{user_id}/{course_id}/{filename}`.
create policy "own files read" on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files write" on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- stats view

-- Dashboard counters in one round trip. security_invoker keeps RLS applied as
-- the querying user; count(distinct ...) undoes the fan-out from the two joins.
create view course_stats with (security_invoker = on) as
select
  c.id as course_id,
  c.user_id,
  count(distinct t.id) as topic_count,
  count(distinct t.id) filter (where t.status = 'ready') as ready_topic_count,
  count(distinct cd.id) as card_count,
  count(distinct cp.card_id) as seen_count,
  count(distinct cp.card_id) filter (where cp.due_at <= now()) as due_count
from courses c
left join topics t on t.course_id = c.id
left join cards cd on cd.course_id = c.id
left join card_progress cp on cp.card_id = cd.id and cp.user_id = c.user_id
group by c.id, c.user_id;

-- ---------------------------------------------------------------- due queue

-- Everything the student owes right now: cards they have never answered, plus
-- cards whose scheduled date has arrived. security_invoker keeps RLS applied.
create view due_cards with (security_invoker = on) as
select
  c.*,
  p.due_at,
  p.repetitions
from cards c
left join card_progress p on p.card_id = c.id and p.user_id = c.user_id
where p.card_id is null or p.due_at <= now();
