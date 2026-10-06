-- Run once in Supabase SQL Editor for an existing store.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
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

alter table public.products
  add column if not exists category_id uuid references public.categories(id) on delete set null;
create index if not exists products_category_id_idx on public.products(category_id);
