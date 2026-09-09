# Memora

Upload your course material. Get back a study structure and cards that drill it.

Memora reads the PDFs, slide decks and notes you upload, works out the themes and the order
you should learn them in, splits each theme into topics worth one sitting, and writes cards for
every topic in five formats: flashcards, multiple choice, fill-in-the-blanks, matching pairs,
and a jargon drill for technical vocabulary. Answers feed a spaced-repetition schedule, so each
card comes back around the day you were about to forget it.

## Stack

- **Next.js (App Router)** + TypeScript + Tailwind CSS v4
- **Supabase** — Postgres, Auth, and Storage for the original files
- **Claude** (`claude-opus-5`) via the Anthropic SDK, with structured outputs for both AI passes
- **unpdf** / **mammoth** for text extraction

## Setup

### 1. Install

```bash
npm install
```

### 2. Create the Supabase project

Make a project at [supabase.com](https://supabase.com), then open the **SQL Editor** and run
`supabase/migrations/0001_init.sql`. That creates every table, the row-level security policies,
the `documents` storage bucket, and the `course_stats` view.

Row-level security is on for every table and each policy is `auth.uid() = user_id`, so a student
can only ever read their own courses, cards and progress.

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API keys |

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000, create an account, and upload something.

> Supabase requires email confirmation on new projects by default. For local testing, either
> confirm via the emailed link or turn confirmation off under **Authentication → Providers →
> Email**.

## How generation works

Generation runs as two separate passes so a failure in one never costs you the other, and so a
long course does not sit behind a single enormous request.

**Pass 1 — structure.** Every uploaded document is extracted to text and split into deterministic
~4,000-character chunks, each labelled `[C0]`, `[C1]`, and so on. Claude sees the labelled corpus
and returns modules, topics, key terms, and — for every topic — the chunk indices its content came
from. Those citations are what make pass 2 cheap and accurate.

**Pass 2 — cards.** One request per topic, sending only that topic's cited chunks plus a chunk of
padding either side. Topics are generated one at a time from the browser with a progress bar, so
you can start studying module 1 while module 4 is still being written.

Both passes use structured outputs (`output_config.format` with a Zod schema), so the response is
schema-valid JSON rather than prose that needs parsing. Card rows are validated again server-side
before they are inserted — an MCQ whose correct index points outside its own options, or a
fill-in-the-blank with no blank in it, is dropped rather than shown to a student.

Very large uploads fall back to per-chunk excerpts for the structure pass, so every chunk stays
citable no matter how long the source is.

## Studying

Pick a format per topic, or mix them. A session is 20 cards, drawn due-first, and the whole
course can be reviewed at once from the course page -- or everything due across every course
from the dashboard.

The keyboard carries a drilling session, because reaching for the mouse between cards is what
makes revision feel slow:

| Key | What it does |
| --- | --- |
| `space` | Turn a flashcard over |
| `1` `2` `3` `4` | Grade a flashcard or jargon card, or pick an option in multiple choice |
| `enter` | Check a fill-in-the-blank, then move to the next card |
| `ctrl`/`cmd` + `enter` | Reveal the source definition in a jargon drill |

Shortcuts are suppressed while you are typing in a field, so answering never grades a card by
accident.

## Managing a course

- **Edit or delete any card.** Generated cards are usually right and occasionally not; a wrong
  one can be fixed in place rather than poisoning your revision. Open a topic from the course
  page to see everything it holds.
- **Rewrite a topic's cards** if a batch came out weak.
- **Add documents later.** The structure is rebuilt around the new material. Topics that keep
  their name keep their cards *and* your review schedule for them; anything renamed or dropped
  is written again.
- **Delete a course**, which takes its cards, progress and uploaded files with it.

## Layout

```
src/
  app/
    api/
      courses/                  create course, extract text
      courses/[id]/outline/     pass 1 — structure
      topics/[id]/cards/        pass 2 — cards for one topic
      reviews/                  record an answer, reschedule the card
    courses/[id]/               course structure
    courses/[id]/study/         review across the whole course
    courses/[id]/topics/[t]/    browse, edit and delete a topic's cards
    review/                     everything due, across every course
    study/[topicId]/            study one topic
  components/study/             the five study modes
  lib/
    ai.ts                       Claude calls, with retry on rate limits
    ai-schema.ts                the output schemas for both passes
    answers.ts                  answer matching for typed responses
    cards.ts                    turns a model response into valid card rows
    chunk.ts                    deterministic chunking and source lookup
    extract.ts                  PDF / DOCX / text extraction
    ingest.ts                   upload validation and text extraction
    prompts.ts                  system prompts for both passes
    rebuild.ts                  what survives a structure rebuild
    srs.ts                      spaced repetition scheduling
supabase/migrations/            schema, RLS, storage bucket, views
```

## Tests

```bash
npm test
```

Covers the logic that fails quietly rather than loudly: the scheduler, deterministic chunking
(pass 2 can only resolve pass 1's citations if chunking is byte-identical between them), answer
matching, the card validator, and the rules deciding which cards survive a structure rebuild.

## Notes

- Scanned PDFs with no text layer cannot be read; they need OCR first. Memora tells you which
  file it could not read rather than failing the whole upload.
- The AI routes set `maxDuration = 300`. On Vercel that needs a plan whose limit is at least
  that; on Hobby the ceiling is lower and a very long structuring pass can be cut short.
- Rate limits and overloaded responses are retried four times with exponential backoff, honouring
  `retry-after` when the API sends it. A bad key or malformed request fails immediately instead.
