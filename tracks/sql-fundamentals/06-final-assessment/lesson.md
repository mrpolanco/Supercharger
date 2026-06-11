---
title: Final assessment (closed book)
---
## Rules

This mirrors a support data investigation: no hints, no peeking at earlier
lessons. Explore the schema yourself (`\dt`, `\d`, sample rows) because
unfamiliar tables are part of the job.

The database is SupportCo's full schema: `plans`, `customers`, `orders`.

## Questions

Save each query to the named file in `/work`, then **Check my work**. Row
order is ignored; columns must match what's asked.

**Q1** (`/work/q1.sql`) — Every customer who is *not known to be canceled*
(including unknown status), with their `id` and `name`.

**Q2** (`/work/q2.sql`) — Each customer's `name` and their **most recent paid
order amount** — customers without any paid order must still appear, with NULL.
Columns: `name`, the amount.

**Q3** (`/work/q3.sql`) — For each plan, the plan `name` and the number of
**distinct customers** who have placed at least one paid order while on that
plan — only plans where that number is at least 2.

When all checkpoints pass, the track is complete. Then go drill
`interview-prep.md` from the track page to practice explaining the same data
judgment out loud.
