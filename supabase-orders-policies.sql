-- Run this in Supabase: SQL Editor → New query → paste → Run
-- This lets the app (using anon key) read and update orders so the Kitchen buttons work.

-- Option A: Disable RLS on orders (simplest for demo)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Option B: Keep RLS on but allow anon to read and update (use this OR Option A, not both)
-- Uncomment the lines below and comment out Option A if you prefer policies:

-- CREATE POLICY "Allow anon read orders"
--   ON orders FOR SELECT
--   TO anon
--   USING (true);

-- CREATE POLICY "Allow anon update orders"
--   ON orders FOR UPDATE
--   TO anon
--   USING (true)
--   WITH CHECK (true);

-- CREATE POLICY "Allow anon insert orders"
--   ON orders FOR INSERT
--   TO anon
--   WITH CHECK (true);
