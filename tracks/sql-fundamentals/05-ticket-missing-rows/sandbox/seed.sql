CREATE TABLE orders (
  id            serial PRIMARY KEY,
  acme_ref      text NOT NULL,
  amount        numeric(8,2) NOT NULL,
  source        text,          -- 'live' for real orders, 'test' for internal test orders
  created_at    timestamptz NOT NULL
);

-- Before June 3rd the API wrote source='live' for real orders.
-- A June 3rd deploy started leaving source NULL for real orders.
INSERT INTO orders (acme_ref, amount, source, created_at) VALUES
  ('ACME-1001', 120.00, 'live', '2026-05-28 09:14:00+00'),
  ('ACME-1002',  85.50, 'live', '2026-05-29 11:02:00+00'),
  ('ACME-1003', 240.00, 'live', '2026-05-30 16:45:00+00'),
  ('ACME-1004',  19.99, 'test', '2026-05-30 17:00:00+00'),
  ('ACME-1005', 310.25, 'live', '2026-05-31 08:30:00+00'),
  ('ACME-1006',  75.00, 'live', '2026-06-01 10:12:00+00'),
  ('ACME-1007', 199.00, 'live', '2026-06-02 14:55:00+00'),
  ('ACME-1008',  19.99, 'test', '2026-06-02 15:10:00+00'),
  ('ACME-1009', 410.00, NULL,   '2026-06-03 09:01:00+00'),
  ('ACME-1010',  66.40, NULL,   '2026-06-03 13:27:00+00'),
  ('ACME-1011', 128.00, NULL,   '2026-06-04 10:40:00+00'),
  ('ACME-1012',  19.99, 'test', '2026-06-04 11:00:00+00'),
  ('ACME-1013', 350.75, NULL,   '2026-06-05 15:22:00+00'),
  ('ACME-1014',  92.10, NULL,   '2026-06-06 09:48:00+00'),
  ('ACME-1015', 275.00, NULL,   '2026-06-07 12:05:00+00');
