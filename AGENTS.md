# Supercharger — agent contract

Supercharger is a local-first technical readiness platform where **you, the AI
coding assistant, are the curriculum engine**. It turns technical
documentation and knowledge gaps into realistic, validated practice for
technical practitioners: support engineers, solutions engineers, SREs,
technical account managers, DevRel, and junior engineers. Content stays
technical — troubleshooting, operational fluency, realistic scenarios — not
generic soft-skill or non-technical training. (Professional communication
*around* technical work — escalation writing, customer replies, internal
summaries — is in scope.) The app (a lesson UI with an integrated
Docker-sandboxed terminal) renders content; it never generates it. Your job is
to generate tracks (skill curricula) and preps (job-specific study plans) that
meet the quality bar below.

This file is tool-agnostic: it works with Claude Code, Codex, Gemini CLI, or
any coding assistant that can read a repo and write files.

## Architecture (for orientation — you rarely touch the app)

- `server/` — Node/Express (port 4400): tracks/preps/progress APIs + Docker
  sandbox runner (build/run/exec per lesson, pty over WebSocket at `/term`).
- `web/` — Vite + React (port 4401, proxies to server): markdown lessons, JSON
  quiz blocks, optional xterm.js terminal pane, "Check my work" button.
- `tracks/`, `preps/` — pure content. **Read SPEC.md before writing any
  content; it is the format contract.**
- Run with `npm run dev` from the repo root. Docker is required only for
  sandbox lessons.
- `progress.json` is the user's personal state — never overwrite it when
  editing content.

## Slash commands

`prompts/` holds tool-neutral entry-point prompts for the common workflows:
`track.md` (generate a track), `prep.md` (generate a job prep),
`audit-track.md` (check a track against the quality bar), and `next-track.md`
(generate the highest-priority pending track request). `.claude/commands/`
contains thin Claude Code wrappers (`/track`, `/prep`, `/audit-track`,
`/next-track`) that delegate to them; other CLIs can wire the same prompt
files into their own command convention. The prompts reference this file and
SPEC.md — they never duplicate the contract.

## Generating a track (e.g. "build me a Go track")

Follow SPEC.md exactly. Quality bar — every track must include:

1. **Concept lessons with real depth** — explain the *why* interviewers probe
   (not surface syntax). End conceptual sections with an "Explain it" verbal
   prompt. No fluff, no unnecessary jargon. Quizzes test understanding, not
   recall.
   For beginner tracks, define necessary jargon in plain language before using
   it. Do not assume the learner already knows acronyms, CLI conventions,
   auth-flow vocabulary, or infrastructure terms.
   When a lesson uses a tool it doesn't teach, add a one-line survival hint
   at first mention (editors especially: how to save and exit); link only
   official references, only for concept-sized topics, per the SPEC.md tool-
   mention convention.
   Add non-terminal practice where it strengthens the skill: diagnosis-before-
   action prompts, compare-and-explain drills, incident timelines, recall
   cards, or other `practice` blocks from SPEC.md. Use them selectively; do not
   pad lessons with every method.
2. **Scenario lessons framed as realistic support tickets / incidents /
   on-the-job tasks**, with deliberately messy environments (NULLs, timezones,
   expired certs — whatever bites in production for that topic). Where the
   role demands it, include communication exercises around the technical work:
   escalation writing, customer replies, internal summaries — validated
   against a rubric (reproduction steps, impact, expected vs actual), not
   vibes.
3. **`interview-prep.md`** — question bank with model answers and the
   follow-up chains interviewers typically use; both verbal and live-exercise
   styles.
4. **`resources.md`** — honestly tiered third-party resources: the one book
   worth buying, the best free resource, and what to skip.
5. **A final closed-book assessment lesson** (no hints in the lesson body)
   mirroring a real screen. Closed-book is end-to-end: check `hint` strings
   must not reveal the diagnosis or solution, and the assessment must test
   transfer — vary the bug/scenario details from earlier lessons rather than
   reusing an earlier exercise verbatim.

Set `level` in `track.yaml` (`beginner`, `intermediate`, or `advanced`) and
match depth to that level. Six lessons is not a universal target: compact
primers can be 4-6 lessons, standard tracks are usually 6-8, and deep dives can
be 8-10. Use the fewest lessons that honestly build the skill; do not skip
foundations for beginner tracks or pad advanced tracks with basics.

Set `icon` in `track.yaml` to the most relevant name from the SPEC.md icon
list (e.g. `disk` for SQL, `world` for APIs, `bug` for debugging) so the track
card gets a subject-specific icon instead of the keyword fallback.

When a track is intended to be shared with another person or team, include
sharing metadata in `track.yaml`: `author`, `license`, `version`, `sourceUrl`
when there is a canonical source, and useful `tags`. Do not add a license you
do not have the right to grant, and never include proprietary docs, customer
data, private logs, or real tickets without permission.

Sandbox images: include `bash`, create `/work`, install `nano` and `vim`,
provide `/usr/local/bin/check` printing the JSON checkpoint contract from
SPEC.md. Prefer small base images; keep first-build under ~2 minutes. Check
logic runs entirely inside the container.

Sandbox UX is part of the quality bar — **before shipping a sandbox lesson,
build the image and run every command the lesson shows, verbatim, from the
directory the terminal opens in**:

- Set `LABEL supercharger.workdir=...` so the terminal opens where the
  exercise's files are. Keep the `/work` default only when navigating to the
  files is itself the skill being taught — then the lesson must say where
  they are.
- Tool wrappers must work from anywhere relevant (e.g. a `wp` wrapper should
  pass `--path` so WP-CLI doesn't depend on cwd).
- Where a correct command can print nothing (grep with no match, silent
  exits), the lesson text must warn that silence ≠ broken terminal.
- Verify the check script both ways: fresh container fails the right
  checkpoints, and the intended solution passes all of them.

Use the bundled `tracks/sql-fundamentals/` as the reference implementation for
tone, depth, and sandbox/check patterns.

## Generating a prep ("prepare me for this job")

Input: `preps/<id>/job-posting.md`, plus optional `preps/<id>/resume.md`
(both saved by the app's "New job prep" screen, or dropped in by the user).
Produce `analysis.md`, `plan.md`, `interview-prep.md` per SPEC.md:

- Map each requirement to existing tracks/lessons where coverage exists;
  create new tracks for genuine gaps (ask before generating more than one
  large track).
- **If `resume.md` exists, do a real gap analysis**: mark each requirement
  covered / partially covered / gap, citing the resume for coverage claims;
  prioritize the study plan by gap severity; in interview-prep, turn covered
  experience into talking points ("lead with your X work when they ask Y")
  and flag resume claims an interviewer will probe.
- When the prep identifies genuine gaps that should become tracks, write
  `track-requests.json` with `id`, `title`, `level`, `depth`, `priority`,
  `reason`, `status`, and `createdBy` so the GUI can list suggested tracks
  before they exist. Also write `curriculum.json` to put existing tracks and
  requested tracks in the best study order. Do not suggest a deeper track when
  the existing/requested topic is already advanced.
- For existing tracks in `curriculum.json`, add a one-line `modificationHints`
  string where the posting suggests a useful tuning (e.g. "Posting emphasizes
  WP REST API integrations — consider WordPress-flavored repro scenarios").
  Omit it when the track fits as-is; never pad with generic advice.
- When handling `modify-requested` track requests, honor `mode` per SPEC.md:
  `in-place` updates the track and records `modifiedFor`/`modifiedBy` in its
  `track.yaml`; `fork` copies the track to the request's `forkTo` id, applies
  changes only to the copy, and repoints this prep's `curriculum.json` at it.
  Keep lesson directory ids stable in-place when the learner has progress on
  them (`progress.json` keys by `<track>/<lesson>`).
- When product/company fluency matters, suggest a `docs-onboarding` curriculum
  item instead of guessing product details. If approved docs are provided in
  `onboarding-requests.json`, use only those sources to create product maps,
  glossaries, support scenarios, escalation practice, and any product-specific
  track requests. Flag assumptions and skip irrelevant docs.
- **Flag inferred requirements explicitly** ("posting says 'identity
  providers' — assuming Okta/SAML; confirm if you know their stack") rather
  than guessing silently.
- `interview-prep.md` must be role-specific: read between the lines of the
  posting, name the likely tooling, give talking points and model answers.

## Hard rules

- Content must never reference the runtime (no app URLs, no React, no
  host-machine paths). Content portability is a load-bearing requirement.
- Quiz blocks are **JSON** (not YAML) inside ```quiz fences — the client uses
  `JSON.parse`.
- Never modify or delete the user's `progress.json` or existing `preps/`
  content unless explicitly asked.
