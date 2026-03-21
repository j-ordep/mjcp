-- Migration: 016 - Create database functions and triggers
--
-- PRINCIPLE: Business logic belongs in the application layer (services/).
-- SQL functions and triggers should only be used when there is NO viable
-- alternative at the application level (e.g. reacting to internal Supabase
-- events, enforcing constraints that SQL handles natively).

-- ────────────────────────────────────────────────────────
-- Auto-create profile when a new auth user signs up
-- Required: reacts to auth.users (internal table, not reachable via SDK)
-- ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
VALUES (
  NEW.id,
  COALESCE(NEW.raw_user_meta_data->>'full_name', 'user'),
  NEW.email
) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();