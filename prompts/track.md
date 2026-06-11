# Generate a track

Arguments: a topic, optionally a level (`beginner`, `intermediate`, `advanced`)
and a depth preference. Example: "Go beginner" or "Kubernetes troubleshooting,
advanced, deep dive".

Read `AGENTS.md` (section "Generating a track") and `SPEC.md` in full before
writing anything. Use `tracks/sql-fundamentals/` as the reference
implementation for tone, depth, and sandbox/check patterns.

Then generate the track under `tracks/<id>/`. Before finishing, verify every
item on this checklist — these are the points most often skipped:

- [ ] `track.yaml` has `level` set, and depth matches it (no skipped
      foundations for beginner, no padded basics for advanced).
- [ ] `track.yaml` has `icon` set to the most relevant name from the SPEC.md
      icon list (e.g. `disk` for SQL, `world` for APIs, `bug` for debugging).
- [ ] If the track is intended for sharing, `track.yaml` includes `author`,
      `license`, `version`, optional `sourceUrl`, and useful `tags`.
- [ ] Lesson count is honest for the scope (4-6 compact primer, 6-8 standard,
      8-10 deep dive) — not a default six.
- [ ] Concept lessons explain the *why*, end with an "Explain it" prompt, and
      define jargon first for beginner tracks.
- [ ] Tools used but not taught get a one-line survival hint at first mention
      (editors: how to save/exit); links only to official references, only
      for concept-sized topics, calibrated to the track level.
- [ ] Scenario lessons are framed as realistic tickets/incidents with
      deliberately messy environments.
- [ ] Lessons use structured `practice` blocks where useful: incident packets,
      diagnosis-before-action prompts, written responses, compare/explain
      drills, timelines, or recall cards. Do not force every method into every
      track.
- [ ] `interview-prep.md` includes follow-up chains, verbal and live-exercise
      styles.
- [ ] `resources.md` is honestly tiered (one book worth buying, best free
      resource, what to skip).
- [ ] Final lesson is a closed-book assessment with no hints in the body.
- [ ] Quiz blocks are JSON (not YAML) inside ```quiz fences.
- [ ] No content references the runtime (no app URLs, React, or host paths).
- [ ] Sandbox images (if any): `bash`, `/work`, `nano`+`vim`,
      `/usr/local/bin/check` printing the SPEC.md JSON checkpoint contract,
      small base image, first build under ~2 minutes, check logic entirely
      inside the container.
- [ ] Sandbox UX verified by actually building and running each image:
      `LABEL supercharger.workdir` points the terminal at the exercise's
      files (unless navigation is the skill — then the lesson says where they
      are); every command in the lesson body ran verbatim from that
      directory; lesson warns where a correct command prints nothing; check
      verified both ways (fresh container fails the right checkpoints, the
      intended solution passes all).
- [ ] `progress.json` untouched.

If the topic, level, or scope is ambiguous, ask before generating.
