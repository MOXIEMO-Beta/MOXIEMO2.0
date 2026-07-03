
-- These always-false policies are redundant: with RLS on and no INSERT/UPDATE/DELETE
-- policy for clients, Postgres already denies those actions. Drop them to clear
-- linter warnings without changing effective security.
DROP POLICY IF EXISTS "clients cannot insert audits" ON public.audits;
DROP POLICY IF EXISTS "clients cannot update audits" ON public.audits;
DROP POLICY IF EXISTS "clients cannot delete audits" ON public.audits;
