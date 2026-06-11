---
title: Aggregation — GROUP BY, HAVING, and counting correctly
---
## From rows to answers

Most support questions are aggregate questions: *how many*, *how much*, *per
what*. The machinery is `GROUP BY` plus aggregate functions:

```sql
SELECT region, count(*) AS customers, avg(monthly_price) AS avg_price
FROM customers c
JOIN plans p ON p.id = c.plan_id
GROUP BY region;
```

Mental model: `GROUP BY region` collapses rows into one row per distinct
region; aggregates (`count`, `sum`, `avg`, `min`, `max`) summarize each group.
Every selected column must be either grouped or aggregated — Postgres enforces
this and the error message (`column must appear in the GROUP BY clause…`) is
one you'll learn to love.

## WHERE vs HAVING in disputed reports

- `WHERE` filters **rows, before** grouping.
- `HAVING` filters **groups, after** aggregation.

*"Which plans have more than 3 active customers?"*

```sql
SELECT p.name, count(*) AS actives
FROM customers c
JOIN plans p ON p.id = c.plan_id
WHERE c.status = 'active'     -- row filter: only active customers count at all
GROUP BY p.name
HAVING count(*) > 3;          -- group filter: only plans clearing the bar
```

This distinction decides whether the report filters raw events or already
summarized groups. Be able to say it in one sentence and give an example like
the one above.

## Counting correctly (where reports go wrong)

Three counts that look interchangeable and aren't:

| Expression | Counts | Gotcha |
|---|---|---|
| `count(*)` | rows in the group | includes everything |
| `count(email)` | rows where `email` is **not NULL** | silently skips NULLs |
| `count(DISTINCT customer_id)` | unique values | the fix for join inflation |

And the matching trap in averages: **`avg()` ignores NULLs entirely.** If 4 of
10 response-time values are NULL, `avg(response_time)` averages the 6 that
exist. Sometimes that's right; sometimes the customer means "treat missing as
zero," which is `avg(coalesce(response_time, 0))`. When numbers are disputed in
a ticket, *which rows count* is usually the entire disagreement.

> **Tip:** `coalesce(x, fallback)` returns the first non-NULL argument. It's
> the everyday tool for "show 0 instead of NULL" in reports:
> `coalesce(sum(amount), 0)`.

```quiz
{ "questions": [
  { "q": "Where do you filter \"only orders from 2026\" vs \"only customers with 5+ orders\"?",
    "options": [
      "Year filter in WHERE (rows, before grouping); 5+ orders in HAVING (groups, after counting)",
      "Both in WHERE",
      "Both in HAVING"
    ],
    "answer": 0,
    "explain": "The year is a property of individual rows; the order count only exists after grouping. WHERE → rows, HAVING → aggregated groups." },
  { "q": "A table has 10 rows; `phone` is NULL in 3. What does count(phone) return?",
    "options": ["7 — count(column) skips NULLs", "10 — it counts rows", "An error"],
    "answer": 0,
    "explain": "count(*) counts rows (10); count(phone) counts non-NULL values (7). Mixing these up is a classic source of 'your report disagrees with mine' tickets." },
  { "q": "avg(score) over values 10, NULL, 20 returns:",
    "options": ["15 — NULLs are ignored by aggregates", "10 — NULL becomes 0", "NULL"],
    "answer": 0,
    "explain": "(10+20)/2 = 15. If the business wants NULL treated as 0, that's avg(coalesce(score,0)) = 10. Knowing to ASK which one is wanted is the support-engineer skill." }
] }
```

```practice
{
  "type": "compare",
  "title": "Which report explanation would you send?",
  "prompt": "A customer says your revenue report is too low because several customers show no paid revenue. Compare these two explanations before writing queries.",
  "options": [
    "A: The database is probably missing the customers' orders, so engineering should restore the data.",
    "B: The report may be filtering to paid orders before grouping, and customers with no paid orders need to stay visible with a zero revenue value. We should verify which rows count and whether NULL totals should display as 0."
  ],
  "deliverable": [
    "Choose A or B.",
    "Name the SQL behavior that makes the safer answer better.",
    "Name what you would verify before claiming data loss."
  ],
  "rubric": [
    "Separates missing data from filtered-out rows.",
    "Mentions LEFT JOIN or NULL-safe aggregation where relevant.",
    "Avoids escalating data loss before reproducing the report logic."
  ],
  "modelAnswer": "B is safer. It treats the report as an investigation instead of assuming data loss. For this class of issue, first verify whether the query keeps customers with no paid orders and whether NULL totals need COALESCE to display as 0."
}
```

## Exercises

Same drill: queries into `/work`, then **Check my work**.

**Task 1 — revenue summary:** *"Finance wants paid revenue per customer."*
Save to `/work/task1.sql`: each customer's `name` and their total **paid**
order amount as a column named `revenue` — only customers who have at least one
paid order, ordered by nothing in particular (the checker ignores row order).

**Task 2 — threshold report:** *"Which regions have more than 2 customers?"*
Save to `/work/task2.sql`: `region` and the customer count (any column name)
for regions with **more than 2** customers.

**Task 3 — everyone on the report:** *"Per-customer paid revenue again — but
this time include every customer, showing 0 (not NULL) for those without paid
orders."* Save to `/work/task3.sql`: every customer's `name` and a NULL-free
revenue column. You'll need a LEFT JOIN with the condition in the right place
(lesson 3!) and `coalesce`.

## Explain it

Out loud, one minute: *"What's the difference between WHERE and HAVING?"* Then
immediately give a one-line example query tied to a customer report.
