-- Acme Corp nightly orders export (provided to customer 2025-11-02)
-- Excludes internal test orders.
SELECT acme_ref, amount, created_at
FROM orders
WHERE source <> 'test'
ORDER BY created_at;
