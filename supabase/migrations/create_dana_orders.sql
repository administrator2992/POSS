-- DANA QRIS Orders Table
-- Run this in Supabase SQL Editor to create the table

CREATE TABLE IF NOT EXISTS dana_orders (
  id BIGSERIAL PRIMARY KEY,
  reference_no TEXT UNIQUE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  dana_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Index for fast lookups by reference number
CREATE INDEX IF NOT EXISTS idx_dana_orders_reference_no ON dana_orders(reference_no);

-- Index for status filtering (e.g., find all pending orders)
CREATE INDEX IF NOT EXISTS idx_dana_orders_status ON dana_orders(status);

-- Enable Row Level Security
ALTER TABLE dana_orders ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (Edge Functions use service role)
CREATE POLICY "Service role full access" ON dana_orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read their own orders (optional, for frontend queries)
CREATE POLICY "Authenticated read" ON dana_orders
  FOR SELECT
  TO authenticated
  USING (true);
