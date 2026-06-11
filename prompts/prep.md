# Generate a job prep

Arguments: a prep id (a directory under `preps/`). If omitted, list the
directories under `preps/` that contain a `job-posting.md` but no `plan.md`
and ask which to run.

Read `AGENTS.md` (section "Generating a prep") and `SPEC.md` (section "Preps")
in full before writing anything.

Input is `preps/<id>/job-posting.md`, plus `preps/<id>/resume.md` and
`preps/<id>/onboarding-requests.json` if present. Produce `analysis.md`,
`plan.md`, and `interview-prep.md` per SPEC.md. Before finishing, verify:

- [ ] Every requirement in the posting is mapped to existing tracks/lessons
      or flagged as a gap.
- [ ] If `resume.md` exists: each requirement marked covered / partially
      covered / gap with resume citations; plan prioritized by gap severity;
      interview-prep turns covered experience into talking points and flags
      claims an interviewer will probe.
- [ ] Genuine gaps written to `track-requests.json` (`id`, `title`, `level`,
      `depth`, `priority`, `reason`, `status`, `createdBy`) and ordered in
      `curriculum.json` alongside existing tracks. No deeper track suggested
      where the topic is already advanced.
- [ ] Asked before generating more than one large new track.
- [ ] Product/company fluency handled via a `docs-onboarding` curriculum item
      (using only approved sources from `onboarding-requests.json`), never by
      guessing product details.
- [ ] Inferred requirements flagged explicitly, not guessed silently.
- [ ] `interview-prep.md` is role-specific: likely tooling named, talking
      points and model answers included.
- [ ] No existing `preps/` content or `progress.json` modified beyond the
      files above for this prep.
