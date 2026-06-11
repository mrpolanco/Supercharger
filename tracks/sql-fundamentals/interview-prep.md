# SQL data investigation drills — support engineer roles

Drill these out loud. The same prompts work for interviews, customer
explanations, and internal escalations; each question lists likely follow-ups.

## Verbal questions

**1. What's the difference between WHERE and HAVING?**
Model answer: *WHERE filters individual rows before grouping; HAVING filters
groups after aggregation. "Orders from 2026" is WHERE; "customers with 5+
orders" is HAVING, because the count only exists after GROUP BY.*
Follow-up chain: "Can you use an aggregate in WHERE?" (No — rows haven't been
grouped yet.) "Which runs first?" (WHERE.)

**2. Explain the difference between INNER JOIN and LEFT JOIN.**
Model answer: *INNER keeps only rows that match on both sides; LEFT keeps every
row from the left table, filling right-side columns with NULL when there's no
match. I use LEFT + `WHERE right.id IS NULL` to find things that* don't *have a
counterpart — customers with no orders, users who never logged in.*
Follow-up chain: "What happens if you put a right-table condition in WHERE
instead of ON?" (It silently becomes an inner join — unmatched NULL rows get
filtered.) This follow-up separates candidates.

**3. Why does `WHERE status != 'canceled'` miss rows?**
Model answer: *NULL. Comparing NULL to anything yields unknown, and WHERE only
keeps true — so rows with NULL status are silently dropped. Fix with
`OR status IS NULL` or Postgres's `IS DISTINCT FROM`.*
Follow-up: "What does count(column) do with NULLs?" (Skips them — count(*)
counts rows.)

**4. What's the difference between count(*), count(col), count(DISTINCT col)?**
(Rows / non-NULL values / unique values.) Follow-up: "When would a joined
report double-count?" — explain row inflation from one-to-many joins and the
count(DISTINCT) fix.

**5. A customer says the report is wrong. Walk me through your process.**
This is the core support-data question. Model structure:
*Reproduce with their exact query and parameters → quantify the discrepancy
(which rows differ?) → inspect what the missing/extra rows have in common
(NULLs, timezones, status values, join duplication) → state root cause in plain
language → propose the fix and a prevention step.* Use the lesson-5 ticket as
your concrete war story.

**6. What's an index and when does it help?**
Model answer: *A sorted lookup structure that lets the database find matching
rows without scanning the whole table. Helps WHERE/JOIN/ORDER BY on the indexed
column; doesn't help (and slightly costs) on writes or low-selectivity columns.
For "why is this query slow," my first steps are EXPLAIN and checking whether
the filter column is indexed.* (Enough depth for support investigations; say
"I'd EXPLAIN it" rather than bluffing optimizer internals.)

**7. NULL vs empty string vs zero?**
(Unknown vs known-empty vs known-zero; real datasets mix them, so a "missing
email" check often needs `email IS NULL OR email = ''`.)

## Live-exercise questions (write these cold, in psql)

1. Each customer's most recent order. (Pattern: subquery with ORDER BY/LIMIT 1,
   or `DISTINCT ON` in Postgres, or a window function.)
2. Second-highest order amount. (`ORDER BY amount DESC LIMIT 1 OFFSET 1` — and
   be ready to discuss ties.)
3. Customers with no orders. (Anti-join — lesson 3.)
4. Duplicate emails in a table. (`GROUP BY email HAVING count(*) > 1`.)
5. Monthly revenue totals. (`date_trunc('month', created_at)` + GROUP BY.)

## Talking points that signal seniority

- "I always check how the data treats NULLs before trusting a filter."
- "When counts disagree between two reports, my first suspects are join row
  inflation and NULL-excluding filters."
- "I don't rely on implicit ordering — exports get an explicit ORDER BY."
