import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

// Inlined corsHeaders to avoid module resolution issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log('Full incoming request URL:', req.url);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    const realmIdFromUrl = url.searchParams.get('realmId'); // Extract realmId from URL params

    // Log all search parameters for debugging
    console.log('QuickBooks OAuth Callback: All URL search parameters:', JSON.stringify(Object.fromEntries(url.searchParams.entries()), null, 2));

    const CLIENT_APP_BASE_URL = 'https://dyad-generated-app.vercel.app';

    if (error) {
      console.error('QuickBooks OAuth Error:', error, errorDescription);
      return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent(errorDescription || error)}`, 302);
    }

    if (!code || !state) {
      console.error('Missing code or state in QuickBooks OAuth callback.');
      return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent('Missing authorization code or state.')}`, 302);
    }

    if (!realmIdFromUrl) {
      console.warn('QuickBooks OAuth Callback: realmId is missing from the URL parameters. This usually indicates an incorrect redirect_uri configuration in Intuit Developer settings.');
      // We will still proceed to exchange tokens, but realmId will be null.
      // The frontend will then display a specific error.
    }

    const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!QUICKBOOKS_CLIENT_ID || !QUICKBOOKS_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase or QuickBooks environment variables.');
      return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent('Server configuration error: Missing environment variables.')}`, 302);
    }

    const redirectUri = `https://nojumocxivfjsbqnnkqe.supabase.co/functions/v1/quickbooks-oauth-callback`;
    console.log('Using redirectUri for token exchange:', redirectUri);

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
      return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent(errorData.error_description || 'Failed to get QuickBooks tokens.')}`, 302);
    }

    const tokens = await tokenResponse.json();
    console.log('QuickBooks OAuth Callback: Full tokens object received:', JSON.stringify(tokens, null, 2));

    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const userId = state;

    console.log('QuickBooks OAuth Callback: Received Access Token (first 10 chars):', accessToken ? accessToken.substring(0, 10) : 'N/A');
    console.log('QuickBooks OAuth Callback: Received Refresh Token (first 10 chars):', refreshToken ? refreshToken.substring(0, 10) : 'N/A');
    console.log('QuickBooks OAuth Callback: Received Realm ID (from URL):', realmIdFromUrl || 'null (missing from URL)');

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        quickbooks_access_token: accessToken,
        quickbooks_refresh_token: refreshToken,
        quickbooks_realm_id: realmIdFromUrl, // Store the realmId (will be null if not in URL)
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user profile with QuickBooks tokens:', updateError);
      return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent('Failed to save QuickBooks tokens.')}`, 302);
    }

    console.log('QuickBooks tokens and Realm ID successfully stored for user:', userId);
    // Redirect back to client app's handler, including realmId status
    return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_success=true&realmId_present=${!!realmIdFromUrl}`, 302);
  } catch (error) {
    console.error('QuickBooks OAuth callback Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});