# Supercharger command prompts

Tool-neutral entry points for the common workflows. Each file is a complete
prompt: paste it (or tell your assistant "follow the instructions in
`prompts/<name>.md`") in any AI coding CLI.

| Command | Prompt file | What it does |
| --- | --- | --- |
| `/track <topic> [level]` | `track.md` | Generate a new track per SPEC.md |
| `/prep <id>` | `prep.md` | Generate a job prep from `preps/<id>/job-posting.md` |
| `/audit-track <id>` | `audit-track.md` | Check an existing track against the quality bar (read-only) |
| `/next-track [prep-id]` | `next-track.md` | Generate the highest-priority pending track request |

Wired-up wrappers:

- **Claude Code** — `.claude/commands/` (type `/` in a session to see them).
- **Gemini CLI** — `.gemini/commands/` (type `/` to list).
- **Codex and others** — no per-repo command convention; say
  `Follow the instructions in prompts/track.md: <args>` instead.

The prompts reference `AGENTS.md` and `SPEC.md` — the contract lives there,
never here.
