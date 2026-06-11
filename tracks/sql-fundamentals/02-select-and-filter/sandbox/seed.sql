CREATE TABLE customers (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  email      text,
  region     text NOT NULL,
  status     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO customers (name, email, region, status, created_at) VALUES
  ('Maya Chen',        'maya@chenco.com',      'US', 'active',   '2025-03-12'),
  ('Tomás Silva',      'tomas@silvatech.eu',   'EU', 'active',   '2025-04-02'),
  ('Priya Sharma',     NULL,                   'EU', 'active',   '2025-04-15'),
  ('Jonas Weber',      'jonas@weberhaus.de',   'EU', 'canceled', '2025-01-20'),
  ('Aisha Bello',      'aisha@bello.ng',       'US', 'active',   '2025-05-01'),
  ('Lars Nilsen',      'lars@nilsen.no',       'EU', NULL,       '2025-05-09'),
  ('Grace Kim',        NULL,                   'US', 'trialing', '2025-06-11'),
  ('Diego Ramos',      'diego@ramosllc.mx',    'US', 'canceled', '2025-02-14'),
  ('Emma Laurent',     'emma@laurent.fr',      'EU', 'active',   '2025-06-20'),
  ('Olu Adeyemi',      'olu@adeyemi.com',      'UK', 'active',   '2025-07-03'),
  ('Hana Yoshida',     'hana@yoshida.jp',      'APAC', 'active', '2025-07-18'),
  ('Marco Ricci',      NULL,                   'EU', 'canceled', '2025-03-30'),
  ('Sofia Petrova',    'sofia@petrova.bg',     'EU', 'trialing', '2025-08-02'),
  ('Liam O''Brien',    'liam@obrien.ie',       'EU', 'active',   '2025-08-15'),
  ('Nadia Haddad',     'nadia@haddad.com',     'US', NULL,       '2025-09-01'),
  ('Wei Zhang',        'wei@zhangco.cn',       'APAC', 'active', '2025-09-12'),
  ('Ana Costa',        'ana@costa.br',         'US', 'active',   '2025-10-05'),
  ('Felix Braun',      NULL,                   'EU', 'active',   '2025-10-22'),
  ('Ingrid Svensson',  'ingrid@svensson.se',   'EU', 'canceled', '2025-05-25'),
  ('Omar Farouk',      'omar@farouk.eg',       'EU', 'active',   '2025-11-08');
