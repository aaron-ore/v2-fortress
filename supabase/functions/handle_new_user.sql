CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $function$
declare
    organization_id_from_code uuid;
    company_code_from_meta text;
    full_name_from_meta text;
begin
    -- Extract company_code and full_name from raw_user_meta_data
    company_code_from_meta := new.raw_user_meta_data->>'company_code';
    full_name_from_meta := new.raw_user_meta_data->>'full_name';

    RAISE NOTICE 'handle_new_user triggered for user: %', new.email;
    RAISE NOTICE 'company_code_from_meta: %', company_code_from_meta;
    RAISE NOTICE 'full_name_from_meta: %', full_name_from_meta;

    organization_id_from_code := NULL;

    -- If a company_code is provided, try to find the organization
    if company_code_from_meta is not null and company_code_from_meta != '' then
        select id into organization_id_from_code
        from public.organizations
        where unique_code = company_code_from_meta;
        RAISE NOTICE 'Lookup for company_code % resulted in organization_id: %', company_code_from_meta, organization_id_from_code;
    end if;

    -- Insert into public.profiles
    insert into public.profiles (id, full_name, avatar_url, email, role, organization_id)
    values (
        new.id,
        full_name_from_meta, -- Use full_name from meta_data
        new.raw_user_meta_data->>'avatar_url', -- Can be null
        new.email,
        'viewer', -- Default role for new users
        organization_id_from_code -- Assign organization_id if found, otherwise NULL
    );
    RAISE NOTICE 'Profile created for user % with organization_id: %', new.email, organization_id_from_code;
    return new;
end;
$function$