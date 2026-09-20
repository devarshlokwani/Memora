-- Waitlist for the pre-launch landing page.
--
-- The only table in the schema with no user_id: nobody is signed in when they
-- join, so the usual `auth.uid() = user_id` policy has nothing to match on.
-- It is protected the other way instead, by what it will and will not allow:
-- anyone may add a row, and nobody may read one back. Without a select policy
-- RLS denies every read, so the list cannot be pulled out through the anon key
-- that ships to the browser. Reading it is a job for the dashboard or the
-- service role.

create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  -- Which part of the page they signed up from, so the copy can be judged.
  source text,
  created_at timestamptz not null default now()
);

-- Case and spacing are not a different person. Stored normalised so the
-- constraint does the de-duplicating rather than the application.
create unique index waitlist_email_key on waitlist (lower(trim(email)));

alter table waitlist enable row level security;

-- A policy decides which rows a role may touch; it does not hand the role the
-- privilege to touch the table at all. Both are needed, and the second one is
-- normally supplied by the project's "automatically expose new tables"
-- setting rather than by the schema. Spelling it out here means the waitlist
-- keeps working with that setting turned off, which is what Supabase itself
-- recommends, and it says in the schema exactly what the anonymous visitor is
-- allowed to do: add a row, and nothing else. No select, so the list still
-- cannot be read back through the key that ships to the browser.
grant insert on table waitlist to anon, authenticated;

create policy "anyone may join" on waitlist
  for insert to anon, authenticated
  with check (
    email is not null
    and length(trim(email)) between 3 and 254
    and position('@' in email) > 1
  );
