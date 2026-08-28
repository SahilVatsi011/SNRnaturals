-- ============================================================
-- Placeholder seed data for SNR Naturals (Phase 0)
-- Replace names/prices/images with client-supplied real data later.
-- Images below are Unsplash placeholders; swap for Supabase Storage URLs.
-- ============================================================

-- --- Delivery slabs (weight-based; admin-editable in Settings) ---
insert into public.delivery_slabs (min_weight_grams, max_weight_grams, price, description, active) values
  (0,     500,   40, 'Up to 500g', true),
  (500,   1000,  60, '500g - 1kg', true),
  (1000,  2000,  90, '1kg - 2kg', true),
  (2000,  5000,  140, '2kg - 5kg', true),
  (5000,  null,  200, 'Above 5kg', true)
on conflict do nothing;

-- --- Placeholder products ---
insert into public.products (name, slug, description, mrp, price, weight_grams, stock_qty, category, images, active) values
  ('Wild Forest Honey 500g', 'wild-forest-honey-500g',
   'Pure, raw, unprocessed wild honey harvested from the forests around Sundarnagar. Rich in natural enzymes and antioxidants.',
   550, 499, 520, 25, 'Honey', array['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800'], true),
  ('Organic Turmeric Powder 250g', 'organic-turmeric-powder-250g',
   'High-curcumin organic turmeric, stone-ground from locally grown roots. Ideal for cooking and wellness.',
   220, 199, 260, 40, 'Spices', array['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800'], true),
  ('Cold-Pressed Mustard Oil 1L', 'cold-pressed-mustard-oil-1l',
   'Kachi Ghani (cold-pressed) mustard oil from pure Himachali mustard seeds. Traditional, aromatic, and preservative-free.',
   320, 289, 1020, 15, 'Oils', array['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800'], true),
  ('Himalayan Pink Salt 1kg', 'himalayan-pink-salt-1kg',
   'Naturally pink, mineral-rich rock salt from the Himalayan ranges. Perfect for cooking and bath uses.',
   150, 129, 1010, 60, 'Pantry', array['https://images.unsplash.com/photo-1626197031507-c17099753214?w=800'], true),
  ('Organic Ashwagandha Powder 200g', 'organic-ashwagandha-powder-200g',
   'Pure root powder of ashwagandha, ethically sourced and gently dried to preserve active withanolides.',
   380, 349, 210, 30, 'Herbs', array['https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800'], true),
  ('Almonds (Badam) 500g', 'almonds-badam-500g',
   'Premium whole almonds, naturally grown in the valleys. Crunchy, sweet, and high in healthy fats.',
   700, 649, 505, 20, 'Dry Fruits', array['https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800'], true)
on conflict (slug) do nothing;
