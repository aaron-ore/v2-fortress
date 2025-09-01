import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
// REMOVED: import { corsHeaders } from '../_shared/cors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // This should be the organizationId
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (error) {
      console.error('QuickBooks OAuth Error:', error, errorDescription);
      // Redirect back to settings page with an error message
      return Response.redirect(`${url.origin}/settings?quickbooks_error=${encodeURIComponent(errorDescription || error)}`, 302);
    }

    if (!code || !state) {
      console.error('Missing code or state in QuickBooks OAuth callback.');
      return Response.redirect(`${url.origin}/settings?quickbooks_error=${encodeURIComponent('Missing authorization code or state.')}`, 302);
    }

    const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!QUICKBOOKS_CLIENT_ID) {
      console.error('Missing QUICKBOOKS_CLIENT_ID environment variable.');
      return Response.redirect(`${url.origin}/settings?quickbooks_error=${encodeURIComponent('QuickBooks Client ID is missing in Supabase secrets.')}`, 302);
    }
    if (!QUICKBOOKS_CLIENT_SECRET) {
      console.error('Missing QUICKBOOKS_CLIENT_SECRET environment variable.');
      return Response.redirect(`${url.origin}/settings?quickbooks_error=${encodeURIComponent('QuickBooks Client Secret is missing in Supabase secrets.')}`, 302);
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables.');
      return Response.redirect(`${url.origin}/settings?quickbooks_error=${encodeURIComponent('Server configuration error: Supabase URL or Service Role Key missing.')}`, 302);
    }

    // Construct the redirectUri explicitly using the full function path
    // url.origin is typically https://<project-ref>.supabase.co
    const redirectUri = `${url.origin}/functions/v1/quickbooks-oauth-callback`;
    console.log('Using redirectUri for token exchange:', redirectUri); // Added logging

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Error exchanging QuickBooks code for tokens:', errorData);
      return Response.redirect(`${url.origin}/settings?quickbooks_error=${encodeURIComponent(errorData.error_description || 'Failed to get QuickBooks tokens.')}`, 302);
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const realmId = tokens.realmId; // This is the QuickBooks company ID

    // Get the authenticated user from the request (the one who initiated the OAuth flow)
    const authHeader = req.headers.get('Authorization');
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader);

    if (!user) {
      console.error('User not authenticated during QuickBooks OAuth callback.');
      return Response.redirect(`${url.origin}/settings?quickbooks_error=${encodeURIComponent('User session not found.')}`, 302);
    }

    // Store tokens and realmId in the user's profile in Supabase
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        quickbooks_access_token: accessToken,
        quickbooks_refresh_token: refreshToken,
        // You might also want to store realmId (QuickBooks company ID) if needed
        // quickbooks_realm_id: realmId,
      })
      .eq('id', user.id)
      .eq('organization_id', state); // Ensure we update the correct user within the correct organization

    if (updateError) {
      console.error('Error updating user profile with QuickBooks tokens:', updateError);
      return Response.redirect(`${url.origin}/settings?quickbooks_error=${encodeURIComponent('Failed to save QuickBooks tokens.')}`, 302);
    }

    console.log('QuickBooks tokens successfully stored for user:', user.id);
    return Response.redirect(`${url.origin}/settings?quickbooks_success=true`, 302);

  } catch (error) {
    console.error('QuickBooks OAuth callback Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});