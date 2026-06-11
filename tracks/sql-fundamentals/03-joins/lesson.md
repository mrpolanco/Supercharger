---
title: Joins — stitching tables together
---
## The setup

SupportCo's database now has three tables: `customers`, `plans`, and `orders`
(`orders.customer_id → customers.id`, `customers.plan_id → plans.id`). Start
the environment, open `psql`, and run `\d orders` and `\d customers` to see the
join points.

## INNER JOIN: rows that match on both sides

"Show me orders *with* customer names" — two tables, one result:

```sql
SELECT o.id, c.name, o.amount, o.status
FROM orders o
JOIN customers c ON c.id = o.customer_id;
```

Mental model: for each order row, find the customer row(s) where the `ON`
condition is true, and output the combined row. Orders whose customer doesn't
exist — and customers with no orders — simply don't appear. That's what
*inner* means: matches only.

> **Tip:** Always alias tables (`orders o`) and qualify columns (`o.id`,
> `c.name`). The moment two tables share a column name (and they will — `id`,
> `status`, `created_at`), unqualified columns are bugs waiting to happen.

## LEFT JOIN: keep everything from the left side

"Show me **all** customers, with their orders if any":

```sql
SELECT c.name, o.id AS order_id, o.amount
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;
```

Customers with no orders still appear — with NULL in every `o.` column. That
NULL is a *signal*, and it powers the single most useful support query pattern:

**"Which customers have never ordered?"**

```sql
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
```

Left join, then keep only the rows where the right side came back empty. This
pattern (the "anti-join") answers a huge family of tickets: users who never
logged in, accounts with no payment method, webhooks that never fired.

> **Tip:** A classic bug — putting a right-table condition in `WHERE` instead
> of `ON`. `LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = 'paid'`
> silently turns your LEFT JOIN back into an INNER JOIN, because unmatched rows
> have `o.status = NULL` which WHERE filters out. Conditions that should
> tolerate "no match" belong in the `ON` clause:
> `LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid'`.

## Row inflation: the join bug that breaks counts

Joins multiply matching rows. One customer with three orders becomes three rows
in a customer⋈orders join. Forget that, and:

```sql
SELECT count(*) FROM customers c JOIN orders o ON o.customer_id = c.id;
```

…counts *orders*, not customers — and a "how many customers bought something"
report comes back inflated. Fix with `count(DISTINCT c.id)`. When a customer
reports "the dashboard says 1,200 but the export has 3,400 rows," duplicate
rows from a one-to-many join are suspect number one.

```quiz
{ "questions": [
  { "q": "A LEFT JOIN from customers to orders, with `WHERE o.status = 'paid'` — what happens to customers with no orders?",
    "options": [
      "They disappear — the WHERE filters out their NULL o.status, making it effectively an INNER JOIN",
      "They appear with NULL order columns",
      "The query errors because o.status can be NULL"
    ],
    "answer": 0,
    "explain": "Unmatched left-join rows have NULL in right-table columns. WHERE o.status = 'paid' is unknown for them, so they're dropped. Move the condition into ON to keep them." },
  { "q": "Joining customers (1 row each) to their orders (avg 3 each) and doing count(*) gives you:",
    "options": [
      "The number of orders — joins multiply rows, so count customers with count(DISTINCT c.id)",
      "The number of customers",
      "An error — you must GROUP BY first"
    ],
    "answer": 0,
    "explain": "Row inflation: each customer row is repeated once per matching order. This is the most common cause of 'the numbers don't match' tickets involving joined reports." }
] }
```

## Exercises

Save each query in `/work`, then **Check my work**.

**Task 1 — enrich an export:** *"Finance wants the orders list with customer
names."* Save to `/work/task1.sql`: every order's `id`, the customer's `name`,
the `amount`, and the order `status`. Orders only — customers without orders
shouldn't appear.

**Task 2 — the anti-join:** *"Sales wants to call every customer who has never
placed an order."* Save to `/work/task2.sql`: the `id` and `name` of every
customer with **zero** orders.

**Task 3 — left join done right:** *"For all **active** customers, show their
paid order amounts — and include active customers with no paid orders."* Save
to `/work/task3.sql`: customer `name` and the order `amount` for paid orders
(`o.amount` should be NULL for active customers without any paid order).
Careful where you put the `status = 'paid'` condition.

## Explain it

Out loud: *"Explain to a non-technical account manager why their customer list
export has the same customer appearing four times."* Strong answer: the export
joins customers to orders; a join outputs one row per match, so a customer with
four orders appears four times; the fix is either removing the join or
aggregating (one row per customer with an order count).
