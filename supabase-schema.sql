-- =============================================================================
-- POSS - Supabase Database Schema
-- Run this in your Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql/new
--
-- Each table stores a single row (id = 1) where the `data` column holds a
-- base64-encoded, zlib-compressed (pako) JSON blob of the full record array.
-- This keeps reads/writes atomic and dramatically reduces payload size.
-- =============================================================================

-- Employees (compressed array of Employee objects)
CREATE TABLE IF NOT EXISTS pos_employees (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  data        TEXT NOT NULL,           -- base64(pako.deflate(JSON.stringify(employees)))
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT  single_row CHECK (id = 1)
);

-- Inventory (compressed array of InventoryItem objects)
CREATE TABLE IF NOT EXISTS pos_inventory (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  data        TEXT NOT NULL,           -- base64(pako.deflate(JSON.stringify(inventory)))
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT  single_row CHECK (id = 1)
);

-- Transactions (compressed array of Transaction objects)
CREATE TABLE IF NOT EXISTS pos_transactions (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  data        TEXT NOT NULL,           -- base64(pako.deflate(JSON.stringify(transactions)))
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT  single_row CHECK (id = 1)
);

-- Settings (compressed settings object)
CREATE TABLE IF NOT EXISTS pos_settings (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  data        TEXT NOT NULL,           -- base64(pako.deflate(JSON.stringify(settings)))
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT  single_row CHECK (id = 1)
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE pos_employees     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_inventory     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_settings      ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (for POS terminals on the local network)
-- Adjust this policy to match your authentication strategy.
CREATE POLICY "Allow anonymous access" ON pos_employees
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access" ON pos_inventory
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access" ON pos_transactions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access" ON pos_settings
  FOR ALL USING (true) WITH CHECK (true);
