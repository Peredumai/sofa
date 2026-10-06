-- Run once in Supabase Dashboard → SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  old_price integer check (old_price is null or old_price >= 0),
  is_promo boolean not null default false,
  images text[] not null default '{}',
  category_id uuid references public.categories(id) on delete set null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

drop policy if exists "Anyone can view categories" on public.categories;
create policy "Anyone can view categories" on public.categories
  for select to anon, authenticated using (true);
drop policy if exists "Managers can create categories" on public.categories;
create policy "Managers can create categories" on public.categories
  for insert to authenticated with check (true);
drop policy if exists "Managers can update categories" on public.categories;
create policy "Managers can update categories" on public.categories
  for update to authenticated using (true) with check (true);
drop policy if exists "Managers can delete categories" on public.categories;
create policy "Managers can delete categories" on public.categories
  for delete to authenticated using (true);

create index if not exists products_category_id_idx on public.products(category_id);

alter table public.products enable row level security;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "Anyone can view published products" on public.products;
create policy "Anyone can view published products" on public.products
  for select to anon, authenticated using (published = true);
drop policy if exists "Managers can view all products" on public.products;
create policy "Managers can view all products" on public.products
  for select to authenticated using (true);
drop policy if exists "Managers can create products" on public.products;
create policy "Managers can create products" on public.products
  for insert to authenticated with check (true);
drop policy if exists "Managers can update products" on public.products;
create policy "Managers can update products" on public.products
  for update to authenticated using (true) with check (true);
drop policy if exists "Managers can delete products" on public.products;
create policy "Managers can delete products" on public.products
  for delete to authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sofas', 'sofas', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view sofa photos" on storage.objects;
create policy "Public can view sofa photos" on storage.objects
  for select to public using (bucket_id = 'sofas');
drop policy if exists "Managers can upload sofa photos" on storage.objects;
create policy "Managers can upload sofa photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'sofas');
drop policy if exists "Managers can update sofa photos" on storage.objects;
create policy "Managers can update sofa photos" on storage.objects
  for update to authenticated using (bucket_id = 'sofas') with check (bucket_id = 'sofas');
drop policy if exists "Managers can delete sofa photos" on storage.objects;
create policy "Managers can delete sofa photos" on storage.objects
  for delete to authenticated using (bucket_id = 'sofas');

-- Create manager accounts in Authentication → Users. Disable public sign-ups
-- in Authentication settings so only accounts you create can use the admin.
