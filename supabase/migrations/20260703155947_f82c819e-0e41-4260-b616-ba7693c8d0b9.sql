
create table if not exists public.brand_kit_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('strategy','brand-kit','brand-audit')),
  source_id uuid not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

grant select, insert, update, delete on public.brand_kit_shares to authenticated;
grant select on public.brand_kit_shares to anon;
grant all on public.brand_kit_shares to service_role;

alter table public.brand_kit_shares enable row level security;

create policy "Owners manage own share tokens"
  on public.brand_kit_shares
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can read active shares by token"
  on public.brand_kit_shares
  for select
  to anon, authenticated
  using (revoked_at is null);

create index if not exists brand_kit_shares_token_idx on public.brand_kit_shares (token);
create index if not exists brand_kit_shares_user_idx on public.brand_kit_shares (user_id);

create trigger brand_kit_shares_touch_updated_at
  before update on public.brand_kit_shares
  for each row execute function public.touch_updated_at();
