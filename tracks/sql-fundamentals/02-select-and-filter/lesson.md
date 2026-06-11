---
title: SELECT, WHERE, and the NULL trap
---
## Your environment

Start the environment (button on the right). You get a real PostgreSQL database
for **SupportCo**, a fictional SaaS. Type `psql` to connect, then orient
yourself the way you would on day one:

```text
\dt                              -- list tables
\d customers                     -- describe the customers table
SELECT * FROM customers LIMIT 5; -- look at real rows
```

Exit psql with `\q`. Your scratch directory is `/work` — that's where you'll
save answers (use `nano` or `vim`).

## Filtering rows

`WHERE` keeps rows where the condition is true:

```sql
SELECT name, email, region
FROM customers
WHERE region = 'EU' AND status = 'active';
```

Useful operators you'll use daily in support work:

| Operator | Example | Notes |
|---|---|---|
| `=`, `<>` | `status <> 'canceled'` | `<>` is "not equal" (`!=` also works) |
| `IN` | `region IN ('EU','UK')` | cleaner than chained ORs |
| `LIKE` / `ILIKE` | `email ILIKE '%@gmail.com'` | `ILIKE` is case-insensitive (Postgres) |
| `BETWEEN` | `created_at BETWEEN '2026-01-01' AND '2026-02-01'` | inclusive on both ends |

> **Tip:** For "find this customer" tickets, `ILIKE` with wildcards is your
> friend — customers misspell their own email domains surprisingly often.

## The NULL trap (this causes real tickets)

`NULL` means *unknown*, and comparing anything to unknown yields unknown — not
true, not false. Three consequences that bite in production:

**1. `= NULL` never matches.** This query returns zero rows, always:

```sql
SELECT * FROM customers WHERE email = NULL;   -- wrong, silently
```

You must write `WHERE email IS NULL` (or `IS NOT NULL`).

**2. `<>` filters out NULLs too.** This is the sneaky one. If you write
`WHERE status <> 'canceled'`, rows where `status` is NULL are **excluded** —
because `NULL <> 'canceled'` is unknown, and WHERE only keeps *true*. A
"customers who aren't canceled" report silently drops every customer with a
missing status. If you remember one thing from this track, remember this.

```sql
-- correct version when NULLs should be included:
WHERE status <> 'canceled' OR status IS NULL
-- or in Postgres:
WHERE status IS DISTINCT FROM 'canceled'
```

**3. NOT IN with a NULL in the list returns nothing.** `WHERE id NOT IN
(SELECT customer_id FROM orders)` returns zero rows if any `customer_id` is
NULL. Use `NOT EXISTS` instead (covered in the joins lesson).

```quiz
{ "questions": [
  { "q": "`SELECT count(*) FROM customers WHERE status <> 'canceled'` — a customer with status NULL is:",
    "options": [
      "Excluded — NULL compared to anything is unknown, and WHERE keeps only true",
      "Included — NULL is not equal to 'canceled'",
      "It depends on the database vendor"
    ],
    "answer": 0,
    "explain": "Three-valued logic: NULL <> 'canceled' evaluates to unknown, not true. This silent row loss is one of the most common real-world report bugs." },
  { "q": "What's the right way to find customers with no email on file?",
    "options": [
      "WHERE email IS NULL",
      "WHERE email = NULL",
      "WHERE email = ''"
    ],
    "answer": 0,
    "explain": "= NULL is always unknown and matches nothing. Also note '' (empty string) and NULL are different things — sloppy data often contains both, so on real tickets check for both." }
] }
```

## Exercises

Work in the terminal. Save each answer as a `.sql` file in `/work` (one query
per file), then hit **Check my work**. Edit files with `nano /work/task1.sql`,
or write them from inside psql practice first.

**Task 1 — a support ticket:** *"How many active customers do we have in the
EU region?"* Save a query returning the customer `id`, `name`, and `email` of
every customer whose `status` is `'active'` and `region` is `'EU'`, to
`/work/task1.sql`.

**Task 2 — data hygiene:** Marketing complains their email campaign bounced.
Save a query to `/work/task2.sql` returning the `id` and `name` of every
customer with **no email address on file**.

**Task 3 — the trap, live:** The previous engineer's "non-canceled customers"
report used `WHERE status <> 'canceled'` and the numbers look low. Save a
**corrected** query to `/work/task3.sql` returning the `id` and `status` of all
customers who are *not known to be canceled* — i.e. every customer except those
whose status is exactly `'canceled'`, including ones with a NULL status.

## Explain it

Out loud, under a minute: *"A customer's 'active users' report shows 240 users
but their dashboard shows 312. The report filters `WHERE plan <> 'trial'`. What
would you check first, and why?"*

Strong answer: check whether `plan` contains NULLs — `<>` silently excludes
them; verify with `SELECT count(*) FROM users WHERE plan IS NULL;` and explain
three-valued logic in plain words.
