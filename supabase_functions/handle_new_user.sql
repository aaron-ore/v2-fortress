-- This function creates a public.profiles entry for new users.
-- It should NOT attempt to get organization_id from auth.jwt() directly,
-- as auth.jwt() for a newly signed-up user won't have it.
-- The organization_id will be set by the inviting admin in the app.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, organization_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'viewer', -- Default role for new users
    NULL      -- organization_id will be set by the inviting admin in the app
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;