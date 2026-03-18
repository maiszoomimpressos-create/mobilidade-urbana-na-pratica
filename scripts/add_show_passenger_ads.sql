alter table public.app_brands
  add column if not exists "showPassengerAds" boolean not null default false;

alter table public.tenants
  add column if not exists "showPassengerAds" boolean not null default false;
