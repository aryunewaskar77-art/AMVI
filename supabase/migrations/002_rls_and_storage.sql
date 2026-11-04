-- ==============================================================================
-- Migration: 002_rls_and_storage.sql
-- Description: Row-Level Security (RLS) policies for tables and
--              Supabase Storage buckets & policies for artworks and payment receipts.
-- ==============================================================================

-- 1. Enable Row-Level Security
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Artworks RLS Policies
DROP POLICY IF EXISTS "Public can view available artworks" ON public.artworks;
CREATE POLICY "Public can view available artworks"
ON public.artworks
FOR SELECT
USING (
  is_available = true
  OR (auth.role() = 'authenticated')
);

DROP POLICY IF EXISTS "Admin can insert artworks" ON public.artworks;
CREATE POLICY "Admin can insert artworks"
ON public.artworks
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can update artworks" ON public.artworks;
CREATE POLICY "Admin can update artworks"
ON public.artworks
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can delete artworks" ON public.artworks;
CREATE POLICY "Admin can delete artworks"
ON public.artworks
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- 3. Orders RLS Policies
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can view orders" ON public.orders;
CREATE POLICY "Admin can view orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;
CREATE POLICY "Admin can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 4. Order Items RLS Policies
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
CREATE POLICY "Public can create order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can view order items" ON public.order_items;
CREATE POLICY "Admin can view order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- ==============================================================================
-- Storage Configuration: Buckets & Storage RLS
-- ==============================================================================

-- Create buckets idempotently
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'artworks',
    'artworks',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'payment-receipts',
    'payment-receipts',
    false,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for 'artworks' bucket
DROP POLICY IF EXISTS "Public can view artwork images" ON storage.objects;
CREATE POLICY "Public can view artwork images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'artworks');

DROP POLICY IF EXISTS "Admin can upload artwork images" ON storage.objects;
CREATE POLICY "Admin can upload artwork images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artworks' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can update artwork images" ON storage.objects;
CREATE POLICY "Admin can update artwork images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'artworks' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can delete artwork images" ON storage.objects;
CREATE POLICY "Admin can delete artwork images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'artworks' AND auth.role() = 'authenticated');

-- Storage Policies for 'payment-receipts' bucket
DROP POLICY IF EXISTS "Public can upload payment receipts" ON storage.objects;
CREATE POLICY "Public can upload payment receipts"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "Admin can view payment receipts" ON storage.objects;
CREATE POLICY "Admin can view payment receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'payment-receipts' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can delete payment receipts" ON storage.objects;
CREATE POLICY "Admin can delete payment receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'payment-receipts' AND auth.role() = 'authenticated');
