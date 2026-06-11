# Third-party resources — honestly tiered

**The one book worth buying:** *SQL Practice Problems* by Sylvia Moestl Vasilik
(~$30). 57 problems on a realistic dataset, beginner → advanced, no filler.
It's drilling, not reading: exactly what converts syntax familiarity into
support-data reflexes.

**Best free interactive practice:**
- [Mode SQL Tutorial](https://mode.com/sql-tutorial) — well-written,
  analyst-flavored, free, runs in the browser. Do "Intermediate" end to end.
- [pgexercises.com](https://pgexercises.com) — Postgres-specific drills with
  instant feedback; the joins and aggregates sections map 1:1 to this track.

**For the depth that separates "knows SQL" from "conversant":**
- [Use The Index, Luke](https://use-the-index-luke.com) — free online book on
  how indexes actually work. Read just chapters 1–2; that's enough to answer
  common support-level performance questions credibly.
- Postgres docs: the [`EXPLAIN` page](https://www.postgresql.org/docs/current/using-explain.html)
  — skim once so EXPLAIN output is less intimidating when a query is slow.

**Skip:**
- Full database-design textbooks (normalization theory beyond 3NF) — too deep
  for this track's support-investigation goal.
- SQL video courses — slower than drilling problems, and you already have the
  concepts from this track.
- LeetCode "Hard" SQL — window-function golf; do pgexercises instead unless a
  specific posting demands analytics-level SQL.
