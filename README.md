# Memora

Upload your course material. Get back a study structure and cards that drill it.

Memora reads the PDFs, slide decks and notes you upload, works out the themes and the order
you should learn them in, splits each theme into topics worth one sitting, and writes cards for
every topic in five formats: flashcards, multiple choice, fill-in-the-blanks, matching pairs,
and a jargon drill for technical vocabulary. Answers feed a spaced-repetition schedule, so each
card comes back around the day you were about to forget it.

## Look

Ink on paper. The whole interface is black and white on a warm off-white ground — no colour
anywhere, including for right and wrong answers, which are told apart by line weight, hatching
and a drawn tick or cross instead. That keeps it readable when printed, dimmed, or by someone
colourblind.

Cards are drawn rather than constructed: every card outline is an SVG path generated at the
card's real pixel size, with corners and edges that drift off true, and each card rests at a
slight angle. The shape and angle come from a hash of the card id, so they are stable across
renders and between server and browser — a card always sits the same way on the desk.

Cards come in a stack, and the stack alternates: ink on paper, then paper on ink, then back. A
pile of identical cards reads as one card redrawn; alternating them is what makes it read as a
pile. The same alternation runs down the formats grid.

There is deliberately no dark mode. The page, the nav and the gap cut into the panel below it are
all the same paper; a second palette would mean keeping two versions of that relationship true,
and the thing being drawn here is paper.

## Footer

One footer, defined in the root layout, so every route gets the same one and no page has to
remember to include it. Every link in it goes somewhere that exists — there is no Legal column
because writing a privacy policy or terms of service is not something to invent; add the pages and
the column follows.

## Motion

GSAP, used only where something needs to be understood as moving rather than replaced.

The landing page is one panel showing one section at a time. Its top edge dips into a **gap**,
and that gap slides along to sit under whichever nav item is selected, sized to match that item.
The edge has to be a drawn path rather than a border, because a gap that changes position and
width is not something a border can describe; the path is rewritten each animation frame, so
nothing re-renders while it moves.

Three things travel together when you change section — the gap, the nav underline beneath the
item, and the height of the panel as the new content turns out to be taller or shorter. Animating
only the first two and letting the height jump would break the illusion that the nav and the panel
are one object.

The nav underline marks what is selected and nothing else. It tracked the pointer at first, which
made it twitch at every passing cursor — a mark that moves when you have not chosen anything is
noise rather than information. Coming from nothing it fades in under the item rather than sliding
in from the edge of the nav, which would read as a stray line.

All of it respects `prefers-reduced-motion`: sections still change and the gap still ends up in
the right place, it just gets there without tweening.

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

Split down the middle: anything that touches a key or a database lives under `server/`,
anything that renders lives under `components/`, and `lib/` is only for code that is genuinely
safe on both sides. `app/` holds routes and nothing else.

```
src/
  app/                        routes only — pages and API handlers
    api/
      courses/                create a course, extract its text
      courses/[id]/outline/   pass 1 — structure
      topics/[id]/cards/      pass 2 — cards for one topic
      reviews/                record an answer, reschedule the card
      cards/[id]/             edit or delete a card
      sessions/               record a finished study session
    courses/[id]/             course structure
    courses/[id]/topics/[t]/  browse, edit and delete a topic's cards
    review/                   everything due, across every course
    study/[topicId]/          study one topic

  server/                     never reaches the browser
    ai/                       Claude calls, prompts, output schemas
    db/                       Supabase server client, session proxy
    documents/                extraction, upload handling, chunking
    courses/                  card validation, structure-rebuild rules
    study/                    spaced repetition scheduling

  lib/                        safe on both sides
    supabase/browser.ts       the browser Supabase client
    supabase/env.ts           which keys are configured
    types.ts                  shared shapes
    answers.ts                answer matching for typed responses
    sketch.ts                 drawn-edge variants, seeded per card
    motion.ts                 shared easing, reduced-motion check

  components/
    layout/                   nav, header, wordmark
    landing/                  the marketing page and its panel
    ui/                       drawn frames, marks, progress
    auth/                     sign in and sign up
    course/                   upload, card manager, course settings
    study/                    the five study modes

  proxy.ts                    Next 16 proxy (formerly middleware)

supabase/migrations/          schema, RLS, storage bucket, views
```

Tests sit next to the code they cover, so `server/study/srs.test.ts` is beside `srs.ts`.

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
