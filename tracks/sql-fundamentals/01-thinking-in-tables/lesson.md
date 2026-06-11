---
title: Thinking in tables
---
## Why this matters

As a support engineer you'll rarely *design* databases — you'll **interrogate**
them. A customer says "my export is wrong," an engineer says "check the events
table," and you need to turn a vague complaint into a precise query. This track
teaches exactly that skill, on a realistic dataset.

This first lesson is theory only: ten minutes of mental model that makes the
data-investigation work after it easier.

## The relational model in three ideas

**1. A table is a set of rows, and every row has the same shape.**
A `customers` table might have columns `id, name, email, region, status,
created_at`. Each row is one customer. There's no inherent order — if you don't
ask for sorting, you're not promised any.

**2. Tables reference each other by ID, not by containing each other.**
An order doesn't contain a customer; it contains a `customer_id` that points at
one. This is why joins exist: to stitch rows back together at query time.

```
customers                 orders
id | name    | region     id | customer_id | amount | status
---+---------+-------     ---+-------------+--------+--------
 1 | Maya    | US          1 |           1 |  49.00 | paid
 2 | Tomás   | EU          2 |           1 |  49.00 | paid
 3 | Priya   | EU          3 |           3 |  99.00 | refunded
```

**3. A query describes the result you want, not the steps to get it.**
You declare "rows from `orders` where status is `paid`," and the database
figures out how. This is why SQL reads like a sentence:

```sql
SELECT id, amount        -- which columns
FROM orders              -- from which table
WHERE status = 'paid'    -- keeping which rows
ORDER BY amount DESC     -- in what order
LIMIT 10;                -- and how many
```

> **Tip:** Read queries in execution order, not written order: `FROM` →
> `WHERE` → `SELECT` → `ORDER BY` → `LIMIT`. The database picks the table,
> filters rows, *then* chooses columns. This one habit prevents most beginner
> confusion (like trying to use a `SELECT` alias inside `WHERE`).

## How to read a schema you've never seen

On the job you'll be dropped into unfamiliar databases constantly. The routine:

1. **List the tables.** (`\dt` in psql.) Names tell you the domain.
2. **Describe the table you care about.** (`\d customers`.) Note the primary
   key, the `*_id` columns (those are your join points), and timestamp columns.
3. **Look at five real rows.** `SELECT * FROM customers LIMIT 5;` Real data
   beats documentation — you'll spot NULLs, weird statuses, and conventions
   immediately.

```quiz
{ "questions": [
  { "q": "An `orders` table has a `customer_id` column. What does this tell you?",
    "options": [
      "Each order row points at one row in the customers table — join on it to combine them",
      "The orders table contains a full copy of each customer",
      "Orders and customers are automatically kept in sync by SQL"
    ],
    "answer": 0,
    "explain": "Tables reference each other by ID. `orders.customer_id = customers.id` is the join condition that stitches them together at query time." },
  { "q": "Without an ORDER BY, what order do query results come back in?",
    "options": [
      "No guaranteed order at all",
      "Insertion order",
      "Primary key order"
    ],
    "answer": 0,
    "explain": "Results often *look* ordered (by insertion or PK) but that's an implementation accident. The moment you rely on it, a query plan change breaks you. Always ORDER BY when order matters — e.g. for customer exports." },
  { "q": "Why does `SELECT amount * 12 AS yearly FROM plans WHERE yearly > 100` fail?",
    "options": [
      "WHERE runs before SELECT, so the alias `yearly` doesn't exist yet",
      "You can't do math in a SELECT",
      "Aliases need double quotes"
    ],
    "answer": 0,
    "explain": "Execution order: FROM → WHERE → SELECT. The alias is created in SELECT, after WHERE already ran. Repeat the expression in WHERE: `WHERE amount * 12 > 100`." }
] }
```

## Explain it

Support work depends on explaining database behavior without sounding vague or
defensive. Say your answer out loud, in under a minute:

> *"A customer asks why the same query returned rows in a different order today
> than yesterday. What do you tell them?"*

A strong answer covers: SQL doesn't guarantee order without `ORDER BY`; the
previous order was a side effect of how the database executed the query; the
fix is adding an explicit `ORDER BY` to their export.

Next lesson: a live database and your first real support-data queries,
including the NULL behavior that causes genuine production tickets.
