-- Delete all existing policies on the profiles table to ensure a clean slate
-- This is a safety measure to remove any potentially recursive policies.
DROP POLICY IF EXISTS "Admins can update profiles within their organization." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles within their organization." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;

-- Policy 1: Allow authenticated users to view their own profile
-- This is essential for the application to fetch the current user's profile without recursion.
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Allow authenticated users to update their own profile
-- This is essential for the application to update the current user's profile (e.g., during onboarding).
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);