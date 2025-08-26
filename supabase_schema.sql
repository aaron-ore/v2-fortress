-- Add organization_id to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Set organization_id for existing profiles (manual step, as per user's prompt)
-- For new sign-ups, a trigger will set this.

-- RLS for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy for admins to view all profiles within their organization
DROP POLICY IF EXISTS "Admins can view all profiles in their organization." ON public.profiles;
CREATE POLICY "Admins can view all profiles in their organization." ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p_admin
      WHERE p_admin.id = auth.uid() AND p_admin.role = 'admin' AND p_admin.organization_id = public.profiles.organization_id
    )
  );

-- Policy for admins to update roles of users in their organization
DROP POLICY IF EXISTS "Admins can update roles of users in their organization." ON public.profiles;
CREATE POLICY "Admins can update roles of users in their organization." ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p_admin
      WHERE p_admin.id = auth.uid() AND p_admin.role = 'admin' AND p_admin.organization_id = public.profiles.organization_id
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles AS p_admin
      WHERE p_admin.id = auth.uid() AND p_admin.role = 'admin' AND p_admin.organization_id = public.profiles.organization_id
    )
  );


-- Add organization_id to inventory_items table
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- RLS for inventory_items table
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view inventory items in their organization." ON public.inventory_items;
CREATE POLICY "Users can view inventory items in their organization." ON public.inventory_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.inventory_items.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can insert inventory items into their organization." ON public.inventory_items;
CREATE POLICY "Users can insert inventory items into their organization." ON public.inventory_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.inventory_items.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can update inventory items in their organization." ON public.inventory_items;
CREATE POLICY "Users can update inventory items in their organization." ON public.inventory_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.inventory_items.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can delete inventory items from their organization." ON public.inventory_items;
CREATE POLICY "Users can delete inventory items from their organization." ON public.inventory_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.inventory_items.organization_id
    )
  );


-- Add organization_id to categories table
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- RLS for categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view categories in their organization." ON public.categories;
CREATE POLICY "Users can view categories in their organization." ON public.categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.categories.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can insert categories into their organization." ON public.categories;
CREATE POLICY "Users can insert categories into their organization." ON public.categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.categories.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can delete categories from their organization." ON public.categories;
CREATE POLICY "Users can delete categories from their organization." ON public.categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.categories.organization_id
    )
  );


-- Add organization_id to vendors table
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- RLS for vendors table
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view vendors in their organization." ON public.vendors;
CREATE POLICY "Users can view vendors in their organization." ON public.vendors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.vendors.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can insert vendors into their organization." ON public.vendors;
CREATE POLICY "Users can insert vendors into their organization." ON public.vendors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.vendors.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can update vendors in their organization." ON public.vendors;
CREATE POLICY "Users can update vendors in their organization." ON public.vendors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.vendors.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can delete vendors from their organization." ON public.vendors;
CREATE POLICY "Users can delete vendors from their organization." ON public.vendors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.vendors.organization_id
    )
  );


-- Add organization_id to stock_movements table
ALTER TABLE public.stock_movements
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- RLS for stock_movements table
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view stock movements in their organization." ON public.stock_movements;
CREATE POLICY "Users can view stock movements in their organization." ON public.stock_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.stock_movements.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can insert stock movements into their organization." ON public.stock_movements;
CREATE POLICY "Users can insert stock movements into their organization." ON public.stock_movements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.stock_movements.organization_id
    )
  );


-- Add organization_id to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- RLS for orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view orders in their organization." ON public.orders;
CREATE POLICY "Users can view orders in their organization." ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.orders.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can insert orders into their organization." ON public.orders;
CREATE POLICY "Users can insert orders into their organization." ON public.orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.orders.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can update orders in their organization." ON public.orders;
CREATE POLICY "Users can update orders in their organization." ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.orders.organization_id
    )
  );

DROP POLICY IF EXISTS "Users can delete orders from their organization." ON public.orders;
CREATE POLICY "Users can delete orders from their organization." ON public.orders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() AND public.profiles.organization_id = public.orders.organization_id
    )
  );


-- Trigger to set organization_id for new profiles
-- This trigger will set the new user's organization_id to their own user ID upon creation.
CREATE OR REPLACE FUNCTION public.set_new_profile_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_create_set_org_id ON public.profiles;
CREATE TRIGGER on_profile_create_set_org_id
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_new_profile_organization_id();