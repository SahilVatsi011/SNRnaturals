-- ============================================================
-- SNR Naturals — Add customer_whatsapp to orders
--
-- Checkout collects two numbers: the customer's regular phone
-- (customer_phone, used as the order identity for tracking) and a
-- WhatsApp number (customer_whatsapp) where the customer wants to
-- receive order updates. Both are mandatory, valid Indian mobiles.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_whatsapp text;

CREATE INDEX IF NOT EXISTS idx_orders_whatsapp ON public.orders (customer_whatsapp);