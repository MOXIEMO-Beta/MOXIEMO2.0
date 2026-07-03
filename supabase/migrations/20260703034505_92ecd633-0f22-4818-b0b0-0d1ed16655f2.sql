
create table if not exists public.brand_image_cache (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users on delete cascade,
  generated_at timestamptz not null default now(),
  images_json  jsonb not null
);
alter table public.brand_image_cache enable row level security;
grant select, insert, update, delete on public.brand_image_cache to authenticated;
grant all on public.brand_image_cache to service_role;
create policy "Users manage own brand image cache"
  on public.brand_image_cache for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
