-- ============================================================
-- SNR Naturals — Fix guest checkout RLS
--
-- Problem: the `orders` table only had an "authenticated"
-- policy, so guest customers (anon role) could NEVER insert an
-- order. Checkout was blocked before reaching payment.
--
-- Fixes:
--   1. Allow anon users to INSERT orders (guest checkout).
--   2. Add SECURITY DEFINER lookup functions so anon users can
--      read ONLY their own order via the unguessable token or
--      phone + order number (tracking / order history).
-- Orders stay "pending" until a verified Razorpay payment.
-- ============================================================

-- ---------- 1) Public order creation (guest checkout) ----------
DROP POLICY IF EXISTS "public create orders" ON public.orders;
CREATE POLICY "public create orders" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- ---------- 2) Secure order lookups (SECURITY DEFINER) ----------
-- Read an order by its unguessable tracking token.
DROP FUNCTION IF EXISTS public.get_order_by_token(text);
CREATE OR REPLACE FUNCTION public.get_order_by_token(p_token text)
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders WHERE order_token = p_token LIMIT 1;
$$;

-- Read an order by phone number + order number (order history lookup).
DROP FUNCTION IF EXISTS public.get_order_by_phone_no(text, bigint);
CREATE OR REPLACE FUNCTION public.get_order_by_phone_no(p_phone text, p_order_no bigint)
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE customer_phone = p_phone AND order_no = p_order_no
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_by_phone_no(text, bigint) TO anon, authenticated;