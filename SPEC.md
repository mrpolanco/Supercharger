# Supercharger Content Spec (v1)

This is the contract between content and app. Tracks and preps are plain
markdown/YAML with **zero references to the runtime**, so all content ports
unchanged to any future implementation (e.g. a Laravel SaaS).

## Track layout

```
tracks/<track-id>/
├── track.yaml            # required
├── <lesson-id>/
│   ├── lesson.md         # required
│   └── sandbox/          # optional — presence of Dockerfile enables the terminal
│       ├── Dockerfile
│       └── ...           # seed data, scripts, etc.
├── interview-prep.md     # recommended
└── resources.md          # recommended
```

IDs are kebab-case directory names; lessons are conventionally numbered
(`01-…`, `02-…`) for readability, but order comes from `track.yaml`.

## track.yaml

```yaml
title: SQL Fundamentals for Support Engineers
description: One-paragraph pitch shown on the track card.
level: beginner      # beginner | intermediate | advanced
depth: standard      # primer | standard | deep-dive
icon: disk            # optional: icon shown on the track card (see list below)
author: Rich Polanco  # optional: person/team that maintains the track
license: CC BY 4.0    # optional but recommended for shared tracks
version: 1.0.0        # optional track content version
sourceUrl: https://github.com/example/team-tracks # optional canonical source
tags: [sql, support, data-investigation] # optional discovery/sharing tags
createdBy: Codex      # optional: tool/agent that created the track
sourcePrep: acme-tse  # optional: prep that requested this track
parentTrack: sql-fundamentals  # optional: advanced follow-up source
modifiedFor: [acme-tse]  # optional: preps this track was later tuned for
modifiedBy: Codex     # optional: tool/agent that applied the latest modification
lessons:            # ordered list of lesson directory names
  - 01-relational-basics
  - 02-filtering
```

`icon` picks the duotone icon shown on the track card and headers. Choose the
most specific match for the track's subject; omit it and the app falls back to
a keyword guess. Allowed values:

`alert`, `app`, `award`, `book`, `briefcase`, `bug`, `certificate`, `chart`,
`chip`, `clipboard`, `clock`, `compass`, `creditcard`, `dashboard`, `disk`,
`file`, `fire`, `folder`, `info`, `message`, `palette`, `rocket`, `settings`,
`smartphone`, `target`, `translation`, `upload`, `user`, `world`.

Examples: SQL/databases → `disk`, APIs/HTTP → `world`, debugging → `bug`,
CLI/terminal → `chip`, support communication → `message`, billing →
`creditcard`, observability/logs → `dashboard`, auth/security → `settings`.

Sharing metadata is optional for private local tracks, but strongly
recommended before exporting a track to another person or team:

- `author`: the person, team, or organization responsible for the track.
- `license`: the reuse terms for the track content and sandbox files.
- `version`: the track content version, independent of the Supercharger app.
- `sourceUrl`: the canonical private or public source for updates.
- `tags`: short labels for topic, role, or stack.

Without an explicit license, recipients should treat a shared track as
view-only unless they have separate permission to reuse or modify it.

Track levels are learner-targeting hints:

- `beginner`: define necessary jargon before using it; assume motivation and
  job context, not prior tool fluency.
- `intermediate`: assume the learner knows basic vocabulary; focus on messy
  support tickets, debugging patterns, and judgment.
- `advanced`: skip basics; focus on edge cases, tradeoffs, failures under
  pressure, and harder closed-book screens.

Use as many lessons as the skill needs. Four to six lessons is fine for a
compact primer, six to eight for a standard track, and eight to ten for a
deep-dive. Do not pad, but do not compress a broad skill into six lessons just
because the reference track has six.

## lesson.md

Frontmatter + GitHub-flavored markdown body:

```markdown
---
title: Filtering and the NULL trap
---
Body…
```

Conventions inside the body:

- `> **Tip:** …` blockquotes render as highlighted callouts.
- "Explain it" prompts: end conceptual sections with a short verbal-articulation
  exercise (interview muscle).
- Use structured `practice` blocks for non-terminal practice that should feel
  first-class: case files, written responses, diagnosis-before-action prompts,
  timeline drills, compare-and-explain drills, and recall cards. Not every
  lesson needs one. Choose the practice shape that matches the job skill.
- Tool mentions: when a lesson *uses* a tool it doesn't *teach*, give a
  one-line survival hint inline at first mention (e.g. "`nano` — Ctrl+O
  saves, Ctrl+X exits"; "`vim` — `i` to edit, `Esc` `:wq` to save and
  quit"). Link an official reference (man pages, the tool's own docs) only
  for concept-sized topics, first mention only, never blogs or tutorial
  sites. Calibrate to the track's `level` — don't hint tools the level
  already assumes, and never link the lesson's own subject. If a lesson
  needs more than two or three such links, it's assuming too much for its
  level: teach the tool or change the level.

### Quiz blocks

A fenced code block with language `quiz` whose content is **valid JSON**:

````markdown
```quiz
{ "questions": [
  { "q": "What does WHERE filter?",
    "options": ["Rows before grouping", "Groups after aggregation"],
    "answer": 0,
    "explain": "WHERE filters rows; HAVING filters groups." }
] }
```
````

`answer` is the zero-based index of the correct option. `explain` is shown after
submission.

### Practice blocks

A fenced code block with language `practice` contains **valid JSON**. Practice
blocks are for exercises where the learner must reason, compare, summarize, or
write before or after using the terminal.

Supported `type` values:

- `incident`: a case file or handoff packet with evidence, timeline, and a
  deliverable.
- `diagnosis`: a pre-action checkpoint where the learner commits to likely
  hypotheses or next checks before touching the environment.
- `response`: a written customer update, escalation, internal summary, or
  handoff draft.
- `compare`: a compare-and-explain exercise for logs, configs, traces,
  answers, or proposed fixes.
- `timeline`: a causality drill around events and symptoms.
- `recall`: a short review card or interview drill.

Fields are intentionally small and portable:

```json
{
  "type": "response",
  "title": "Write the customer update",
  "prompt": "Draft a concise update after confirming the root cause.",
  "evidence": ["Export query excludes rows where internal_test is NULL."],
  "deliverable": ["Name impact", "Explain root cause", "Give next step"],
  "rubric": ["Cites evidence", "Avoids blame", "Does not overpromise"],
  "modelAnswer": "The missing rows were caused by..."
}
```

`title` and `prompt` are recommended. `evidence`, `timeline`, `options`,
`deliverable`, and `rubric` are optional arrays. `modelAnswer` is optional and
should be a short coaching note, not a replacement for doing the work. For
closed-book final assessments, do not include `modelAnswer` or revealing
rubric items that give away the diagnosis.

## Sandboxes

A lesson with `sandbox/Dockerfile` gets a terminal pane. The runner:

1. `docker build` the sandbox dir (tag `supercharger-<track>-<lesson>`).
2. `docker run -d --rm` with 512 MB / 1 CPU limits.
3. Attaches the terminal via `docker exec -it -w /work <container> bash -l`
   — so the image **must include bash** and should create `/work` as the
   user's scratch directory.
4. "Check my work" runs `docker exec <container> check`.

### check contract

An executable named `check` on the container `PATH` (e.g. installed to
`/usr/local/bin/check`). It must print **JSON on stdout** and exit 0:

```json
{ "checkpoints": [
  { "name": "Table `orders_clean` exists", "pass": true },
  { "name": "Query saved to /work/answer.sql", "pass": false,
    "hint": "Save your final query in /work/answer.sql so it can be verified." }
] }
```

All logic runs inside the container; nothing on the host is trusted or touched.
A lesson is auto-marked complete when every checkpoint passes.

### Terminal working directory

The terminal opens in `/work` by default. If the exercise's files live
elsewhere, the image must declare it so the learner lands where the work is:

```dockerfile
LABEL supercharger.workdir="/var/www/site"
```

Only keep the default when starting away from the files is the point of the
lesson (e.g. filesystem navigation is the skill being taught) — and then the
lesson text must say where the files are.

Every command shown in a lesson body must work verbatim from the directory
the terminal opens in. Commands that can legitimately produce no output on
success or no-match (grep, find, silent exits) need the lesson to say so, or
learners read silence as a broken environment.

Sandbox directories must contain only the files the Docker build needs. Never
commit generated artifacts (`__pycache__/`, `*.pyc`, `node_modules/`, build
output) — they bloat the build context and the repo.

Checkpoint `hint` strings should point at *where* to look (the file, the
relevant part of the contract), not reveal the diagnosis or the fix. In the
final closed-book assessment this is a hard rule: hints must never contain the
answer.

## Preps (job preparation)

```
preps/<prep-id>/
├── job-posting.md        # the pasted posting (written by the app)
├── resume.md             # optional: the user's resume (written by the app)
├── analysis.md           # requirements → skills mapping; flag inferred requirements explicitly
├── plan.md               # ordered study plan linking tracks/lessons; skim vs drill guidance
├── interview-prep.md     # role-specific questions, talking points, model answers
├── curriculum.json       # optional: ordered existing/requested tracks for the app
├── onboarding-requests.json # optional: approved docs sources for product practice
├── onboarding/<id>/source.md # optional: pasted docs/excerpts for an onboarding request
└── track-requests.json   # optional: machine-readable gap tracks for the app to list/create
```

When `resume.md` is present, `analysis.md` must include a gap analysis:
each requirement marked as covered by the user's experience (cite the
resume), partially covered, or a genuine gap — and `plan.md` prioritizes
tracks by gap severity rather than treating all requirements equally.

The app renders any `.md` files in a prep as tabs. Generation is performed by
Claude Code against the saved `job-posting.md` (see CLAUDE.md).

If the prep identifies gaps that need new tracks, assistants may write
`track-requests.json` so the GUI can list suggested tracks before they exist:

```json
[
  {
    "id": "api-debugging-ai-support",
    "title": "API Debugging for AI Product Support",
    "level": "beginner",
    "depth": "standard",
    "priority": "high",
    "reason": "Posting emphasizes API troubleshooting and customer reproduction, but resume evidence is partial.",
    "status": "suggested",
    "createdBy": "Codex"
  }
]
```

When an assistant creates a requested track, include `createdBy` and
`sourcePrep` in that track's `track.yaml` so the app can show provenance.

**Standalone track requests** (not tied to any prep) live in a
`track-requests.json` at the repo root, written by the app's home-screen
"Add track" button using the same entry format. Fulfill them exactly like
prep requests — generate the track per the contract and set the entry's
`status` to `created` — but omit `sourcePrep` from the track's `track.yaml`.

Assistants may also write `curriculum.json` to define the best order to study
existing and requested tracks:

```json
[
  { "id": "sql-fundamentals", "kind": "existing", "order": 1,
    "modificationHints": "Posting emphasizes log investigation — consider adding a log-table query scenario." },
  { "id": "readme-product-onboarding", "kind": "docs-onboarding", "level": "beginner", "order": 2 },
  { "id": "api-debugging-ai-support", "kind": "requested", "level": "beginner", "order": 3 }
]
```

`modificationHints` is an optional short string per item, written during prep
generation from the job posting: what this track could be tuned toward for
this specific role. The app surfaces it as a suggestion when the user
requests a track modification.

### Track modification requests

The app marks a track request `modify-requested` when the user asks for
changes to an existing track, with `modificationNotes` (what to change), an
optional `level` (target level), and a `mode`:

- `mode: "in-place"` — update the track where it is. Add the prep's id to
  `modifiedFor` (and set `modifiedBy`) in the track's `track.yaml`.
- `mode: "fork"` — leave the original untouched. Copy it to the new id in the
  request's `forkTo`, apply changes there, set `parentTrack`, `sourcePrep`,
  `createdBy`, and `modifiedFor` on the fork, and repoint this prep's
  `curriculum.json` entry at the fork.

When done, set the request's `status` back to `created`.

## Product docs onboarding

When a prep depends on company/product fluency, the app or assistant may write
`onboarding-requests.json`:

```json
[
  {
    "id": "readme-product-onboarding",
    "title": "ReadMe Product Onboarding",
    "kind": "docs-onboarding",
    "goal": "support-product",
    "level": "beginner",
    "docsUrl": "https://docs.example.com",
    "sourcePath": "onboarding/readme-product-onboarding/source.md",
    "notes": "Focus on API references, auth setup, and common support issues.",
    "status": "suggested",
    "createdBy": "User"
  }
]
```

Docs onboarding should produce product-specific practice, not a generic summary:

- product map
- glossary with plain-English definitions
- relevant workflows
- common support failure modes
- mock support tickets
- customer reply and escalation-writing exercises
- final readiness assessment
- suggested tracks only for gaps that remain after considering the job posting
  and resume

Use only approved source docs. If a scenario or concept is inferred rather than
directly supported by the sources, flag it as an assumption.

## Progress

`progress.json` at repo root:

```json
{ "lessons": { "<track>/<lesson>": true },
  "quizzes": { "<track>/<lesson>#<blockIndex>": { "answers": {}, "submitted": true } } }
```
