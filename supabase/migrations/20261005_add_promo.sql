-- Run this once in Supabase SQL Editor to enable the product promotion switch.
alter table public.products
  add column if not exists is_promo boolean not null default false;
