CREATE TABLE plans (
  id            serial PRIMARY KEY,
  name          text NOT NULL,
  monthly_price numeric(8,2) NOT NULL
);

CREATE TABLE customers (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  email      text,
  region     text NOT NULL,
  status     text,
  plan_id    int REFERENCES plans(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id          serial PRIMARY KEY,
  customer_id int NOT NULL REFERENCES customers(id),
  amount      numeric(8,2) NOT NULL,
  status      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO plans (name, monthly_price) VALUES
  ('starter', 19.00), ('pro', 49.00), ('enterprise', 199.00);

INSERT INTO customers (name, email, region, status, plan_id, created_at) VALUES
  ('Maya Chen',       'maya@chenco.com',    'US',   'active',   2, '2025-03-12'),
  ('Tomás Silva',     'tomas@silvatech.eu', 'EU',   'active',   1, '2025-04-02'),
  ('Priya Sharma',    NULL,                 'EU',   'active',   3, '2025-04-15'),
  ('Jonas Weber',     'jonas@weberhaus.de', 'EU',   'canceled', 1, '2025-01-20'),
  ('Aisha Bello',     'aisha@bello.ng',     'US',   'active',   2, '2025-05-01'),
  ('Lars Nilsen',     'lars@nilsen.no',     'EU',   NULL,       1, '2025-05-09'),
  ('Grace Kim',       NULL,                 'US',   'trialing', NULL, '2025-06-11'),
  ('Diego Ramos',     'diego@ramosllc.mx',  'US',   'canceled', 1, '2025-02-14'),
  ('Emma Laurent',    'emma@laurent.fr',    'EU',   'active',   2, '2025-06-20'),
  ('Olu Adeyemi',     'olu@adeyemi.com',    'UK',   'active',   3, '2025-07-03'),
  ('Hana Yoshida',    'hana@yoshida.jp',    'APAC', 'active',   1, '2025-07-18'),
  ('Sofia Petrova',   'sofia@petrova.bg',   'EU',   'trialing', NULL, '2025-08-02');

INSERT INTO orders (customer_id, amount, status, created_at) VALUES
  (1,  49.00, 'paid',     '2025-04-01'),
  (1,  49.00, 'paid',     '2025-05-01'),
  (1,  49.00, 'refunded', '2025-06-01'),
  (2,  19.00, 'paid',     '2025-05-02'),
  (3, 199.00, 'paid',     '2025-05-15'),
  (3, 199.00, 'paid',     '2025-06-15'),
  (3, 199.00, 'failed',   '2025-07-15'),
  (4,  19.00, 'paid',     '2025-02-20'),
  (5,  49.00, 'paid',     '2025-06-01'),
  (5,  49.00, 'failed',   '2025-07-01'),
  (8,  19.00, 'refunded', '2025-03-14'),
  (9,  49.00, 'paid',     '2025-07-20'),
  (9,  49.00, 'paid',     '2025-08-20'),
  (10, 199.00, 'paid',    '2025-08-03'),
  (11,  19.00, 'paid',    '2025-08-18');
