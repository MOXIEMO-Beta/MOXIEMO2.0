
-- Part H: Fix share token exposure, usage_tracking read leak, and beta20 founding public insert.

-- 1. brand_kit_shares: remove permissive anon SELECT; keep only owner reads.
--    Public /shared/:token route goes through the get-shared-document service-role edge function.
drop policy if exists "Anyone can read active shares by token" on public.brand_kit_shares;
create policy "Users can view own share tokens"
  on public.brand_kit_shares
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 2. usage_tracking: add missing owner-only SELECT.
create policy "Users can view own usage records"
  on public.usage_tracking
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 3. beta20_founding: allow public signups + sanitize admin-only fields.
create policy "Public can insert founding signups"
  on public.beta20_founding
  for insert
  to anon, authenticated
  with check (true);

create or replace function public.sanitize_beta20_founding_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.status := 'waitlisted';
  new.source := coalesce(new.source, 'pricing_page');
  new.tier_interest := coalesce(new.tier_interest, 'unsure');
  new.user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists sanitize_beta20_founding_insert on public.beta20_founding;
create trigger sanitize_beta20_founding_insert
  before insert on public.beta20_founding
  for each row execute function public.sanitize_beta20_founding_insert();

grant insert on public.beta20_founding to anon, authenticated;
