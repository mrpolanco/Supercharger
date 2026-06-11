# Contributing

## Tracks (most wanted)

A track is just a spec-compliant folder — no app code required. Read
`SPEC.md` (format) and `AGENTS.md` (quality bar), match the depth of the
bundled `tracks/sql-fundamentals/`, and open a PR. Generated, hand-written,
or hybrid content is all welcome; you're responsible for the substance either
way.

Checklist before submitting:

- Every sandbox builds in under ~2 minutes and its `check` script passes when
  the exercises are solved correctly (and fails helpfully when they aren't).
- Quiz blocks are valid JSON.
- `interview-prep.md` and `resources.md` are present and honest.
- No references to the runtime (URLs, paths, app internals) in content.

## App changes

Keep the app thin. `SPEC.md` and the runner API are the stable surfaces —
changes to either need strong justification, since all existing content
depends on them.
