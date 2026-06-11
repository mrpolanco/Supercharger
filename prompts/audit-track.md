# Audit a track

Arguments: a track id (a directory under `tracks/`). If omitted, list the
available tracks and ask which to audit.

Read `AGENTS.md` (section "Generating a track", quality bar items 1-5, and
"Hard rules") and `SPEC.md`, then read every file in `tracks/<id>/` and check
it against the contract:

- Format: layout, `track.yaml` fields, lesson frontmatter, quiz blocks parse
  as JSON, sandbox/check contract per SPEC.md.
- Sandbox UX: build and run each sandbox; the terminal's working directory
  (`supercharger.workdir` label, default `/work`) must be where the
  exercise's files are unless navigation is the skill; run the lesson's
  commands verbatim from that directory; flag any correct-but-silent command
  the lesson doesn't warn about.
- Quality bar: concept depth and "Explain it" prompts, realistic messy
  scenarios, `interview-prep.md` with follow-up chains, honestly tiered
  `resources.md`, closed-book final assessment with no hints in the body.
- Practice mix: lessons include appropriate `practice` blocks for job-realistic
  reasoning when useful, such as incident packets, diagnosis-before-action,
  written responses, compare/explain drills, timelines, or recall. Flag gaps
  where the track over-relies on text, quiz, and terminal for skills that need
  communication or judgment practice.
- Level fit: depth matches `level`, lesson count honest for the scope.
- Tool mentions: tools a lesson uses but doesn't teach carry a one-line
  survival hint at first mention; any external links are official references
  only, first mention only, appropriate to the level.
- Hard rules: no runtime references (app URLs, React, host paths).

Report findings as a list ordered by severity, citing file and line. This is
an audit: do **not** edit content unless the user then asks for fixes.
