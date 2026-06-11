---
title: "Ticket: customer export is missing rows"
---
## The ticket

> **Priority: High — Acme Corp (enterprise)**
>
> *"Our nightly orders export is missing data. We reconcile it against our
> payment processor and since June 3rd we're short. Your dashboard shows the
> orders exist! The export query your team gave us is in `/work/export.sql`.
> Please find out what's wrong."*

This is a real-shaped ticket: the customer is right, the data exists, and a
query someone wrote long ago is silently wrong. Your job: **reproduce, diagnose
root cause, and fix** — the same three steps as every data ticket.

```practice
{
  "type": "incident",
  "title": "Read the handoff before touching the database",
  "prompt": "Commit to an investigation plan before you run commands. Good support engineers avoid random querying when a customer is blocked.",
  "evidence": [
    "Customer says the dashboard still shows the missing orders.",
    "The nightly export started coming up short on June 3.",
    "The current export query is saved at /work/export.sql.",
    "The intended business rule is to exclude internal test orders and keep everything else."
  ],
  "timeline": [
    { "time": "02:00", "event": "Nightly export job ran." },
    { "time": "08:15", "event": "Customer reconciliation found fewer exported rows than paid orders." },
    { "time": "09:10", "event": "Support confirmed the orders are visible in the dashboard." }
  ],
  "deliverable": [
    "Write the first two checks you will run.",
    "Name one query behavior that could exclude real rows without throwing an error."
  ],
  "rubric": [
    "Starts by reproducing the export result.",
    "Compares exported rows to source rows.",
    "Considers NULL or tri-state filter behavior before blaming the job scheduler."
  ]
}
```

## How to work it

1. **Reproduce.** Start the environment, look at `/work/export.sql`
   (`cat /work/export.sql`), run it in psql (`\i /work/export.sql`), and count
   what it returns vs. what's actually in the table.
2. **Find the discrepancy.** Which rows are in `orders` but not in the export's
   results? What do those rows have in common? (Lesson 2 is very relevant.
   Look closely at every column the export filters on.)
3. **Fix and document.**
   - Save a corrected query to `/work/export_fixed.sql`. The *intent* of the
     original filter is: exclude orders flagged as internal test orders, keep
     everything else.
   - Write the root cause in one or two sentences to `/work/root-cause.txt` —
     as you would in the ticket reply. Name the actual mechanism, not just
     "the query was wrong."

No more hints in this lesson — the next one is fully closed-book, so treat this
as a warm-up for working without a safety net. **Check my work** validates both
files.

```practice
{
  "type": "response",
  "title": "Draft the customer update",
  "prompt": "After your fixed query passes, write a short customer-safe update. Do this before you move on.",
  "evidence": [
    "The dashboard data was present.",
    "The export query excluded some real orders.",
    "The corrected query keeps non-test orders even when the test flag is unknown."
  ],
  "deliverable": [
    "Acknowledge the discrepancy.",
    "Explain the root cause without dumping SQL syntax on the customer.",
    "State the corrective action and one prevention follow-up."
  ],
  "rubric": [
    "Names impact and scope.",
    "Explains expected vs actual behavior.",
    "Avoids blaming the customer.",
    "Does not promise a permanent fix without evidence."
  ],
  "modelAnswer": "We reproduced the discrepancy and found the export filter was excluding some valid orders when the internal-test flag was unset. The underlying orders were present in the system, but the export logic treated unknown test status as if those rows should be removed. We corrected the query so non-test orders are included and will add a regression check around this export rule."
}
```

## Explain it (after you solve it)

Out loud: how would you explain the root cause *to the customer* — someone who
doesn't know SQL — in two sentences, and what would you say your team is doing
to prevent a recurrence?
