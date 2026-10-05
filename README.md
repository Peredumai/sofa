# Sofa M31 storefront

React + Vite storefront with a product catalog and a small manager area at `/admin`.
The homepage includes a rotating photo carousel, a product catalog, and a manager area at `/admin`.

## Supabase setup

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in the SQL Editor. If the products table already exists, run [`supabase/migrations/20261005_add_promo.sql`](supabase/migrations/20261005_add_promo.sql) to add the promotion field.
2. In Authentication settings, disable public sign-ups. Create a manager account in Authentication → Users.
3. Copy `.env.example` to `.env.local` and fill in the project URL and publishable (anon) key.
4. Add the same two `VITE_` values to the Vercel project environment variables and redeploy.
5. Open `/admin` to sign in and manage products.

To show a promotion, check “Позначити як акцію” and enter the regular price in “Ціна до знижки”. The site calculates the discount percentage from the two prices.

The publishable key is designed to be present in a browser app. Row Level Security protects
product writes and photo uploads; never put a Supabase service-role key in a `VITE_` variable.
Photo uploads accept JPEG, PNG, WebP, and AVIF up to 10 MB each. Newly uploaded images are
added to the product; the current editor does not remove individual existing photos.

## Commands

- `npm run dev` — start local development
- `npm run build` — create the production bundle
- `npm run preview` — preview the production bundle
