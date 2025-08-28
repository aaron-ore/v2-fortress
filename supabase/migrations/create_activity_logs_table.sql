CREATE TABLE public.activity_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    activity_type text NOT NULL,
    description text NOT NULL,
    details jsonb,
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view their activity logs" ON public.activity_logs
FOR SELECT USING (auth.uid() IN (SELECT profiles.id FROM public.profiles WHERE profiles.organization_id = activity_logs.organization_id));

CREATE POLICY "Organization members can insert their activity logs" ON public.activity_logs
FOR INSERT WITH CHECK (auth.uid() IN (SELECT profiles.id FROM public.profiles WHERE profiles.organization_id = activity_logs.organization_id));

-- Optional: Admins can delete logs (e.g., for data retention policies)
CREATE POLICY "Admins can delete activity logs within their organization" ON public.activity_logs
FOR DELETE USING (
  auth.uid() IN (
    SELECT profiles.id
    FROM public.profiles
    WHERE profiles.organization_id = activity_logs.organization_id AND profiles.role = 'admin'
  )
);