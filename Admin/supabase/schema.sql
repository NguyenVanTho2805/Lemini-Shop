-- ============================================================
-- Lemini Webshop — Supabase Schema
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- ============================================================

-- Products
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  category    TEXT,
  price       NUMERIC DEFAULT 0,
  stock       INTEGER DEFAULT 0,
  sold        INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'active',
  featured    BOOLEAN DEFAULT false,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_status   ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug     ON products(slug);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  code            TEXT UNIQUE NOT NULL,
  customer_name   TEXT,
  customer_email  TEXT,
  status          TEXT DEFAULT 'pending',
  total           NUMERIC DEFAULT 0,
  voucher_code    TEXT,
  data            JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_email  ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id           TEXT PRIMARY KEY,
  product_id   TEXT NOT NULL,
  product_slug TEXT,
  author       TEXT,
  rating       INTEGER DEFAULT 5,
  status       TEXT DEFAULT 'pending',
  data         JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status     ON reviews(status);

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id           TEXT PRIMARY KEY,
  code         TEXT UNIQUE NOT NULL,
  status       TEXT DEFAULT 'active',
  usage_count  INTEGER DEFAULT 0,
  usage_limit  INTEGER DEFAULT 100,
  expires_at   TEXT,
  data         JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promotions_code   ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);

-- Inventory Log
CREATE TABLE IF NOT EXISTS inventory_log (
  id           TEXT PRIMARY KEY,
  product_id   TEXT NOT NULL,
  delta        INTEGER DEFAULT 0,
  data         JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_log_product ON inventory_log(product_id);

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  JSONB NOT NULL
);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
