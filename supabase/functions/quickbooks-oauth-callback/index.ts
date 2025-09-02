import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

// Inlined corsHeaders to avoid module resolution issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // NEW LOGGING: Log the full incoming request URL
  console.log('Full incoming request URL:', req.url);
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // This should now be the user.id
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Define the client application's base URL for redirection
    // This should be the URL where your frontend app is hosted, e.g., on Vercel
    const CLIENT_APP_BASE_URL = 'https://dyad-generated-app.vercel.app'; // Hardcode for robustness

    if (error) {
      console.error('QuickBooks OAuth Error:', error, errorDescription);
      // Redirect back to the client-side callback handler with an error message
      return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent(errorDescription || error)}`, 302);
    }

    if (!code || !state) {
      console.error('Missing code or state in QuickBooks OAuth callback.');
      return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent('Missing authorization code or state.')}`, 302);
    }

    const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!QUICKBOOKS_CLIENT_ID) {
      console.error('Missing QUICKBOOKS_CLIENT_ID environment variable.');
      return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent('QuickBooks Client ID is missing in Supabase secrets.')}`, 302);
    }
    if (!QUICKBOOKS_CLIENT_SECRET) {
      console.error('Missing QUICKBOOKS_CLIENT_SECRET environment variable.');
      return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent('QuickBooks Client Secret is missing in Supabase secrets.')}`, 302);
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables.');
      return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent('Server configuration error: Supabase URL or Service Role Key missing.')}`, 302);
    }

    // Construct the redirectUri explicitly using the full function path
    const redirectUri = `https://nojumocxivfjsbqnnkqe.supabase.co/functions/v1/quickbooks-oauth-callback`;
    console.log('Using redirectUri for token exchange:', redirectUri);

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
      return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent(errorData.error_description || 'Failed to get QuickBooks tokens.')}`, 302);
    }

    const tokens = await tokenResponse.json();
    console.log('QuickBooks OAuth Callback: Full tokens object received:', JSON.stringify(tokens, null, 2)); // NEW LOG

    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const realmId = tokens.realmId; // This is the QuickBooks company ID

    console.log('QuickBooks OAuth Callback: Received Access Token (first 10 chars):', accessToken ? accessToken.substring(0, 10) : 'N/A');
    console.log('QuickBooks OAuth Callback: Received Refresh Token (first 10 chars):', refreshToken ? refreshToken.substring(0, 10) : 'N/A');
    console.log('QuickBooks OAuth Callback: Received Realm ID:', realmId);

    // Use the 'state' parameter (which is the user.id) to update the profile
    const userId = state;
    console.log('QuickBooks OAuth Callback: Attempting to update profile for userId:', userId); // NEW LOG
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Store tokens and realmId in the user's profile in Supabase
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        quickbooks_access_token: accessToken,
        quickbooks_refresh_token: refreshToken,
        quickbooks_realm_id: realmId, // Store the realmId
      })
      .eq('id', userId); // Update the profile for the user who initiated the OAuth flow

    if (updateError) {
      console.error('Error updating user profile with QuickBooks tokens:', updateError);
      console.error('Full updateError object:', JSON.stringify(updateError, null, 2)); // NEW LOG
      return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent('Failed to save QuickBooks tokens.')}`, 302);
    }

    console.log('QuickBooks tokens and Realm ID successfully stored for user:', userId);
    return Response.redirect(`${CLIENT_APP_BASE_URL}/quickbooks-oauth-callback?quickbooks_success=true`, 302); // Redirect back to client app's handler
  } catch (error) {
    console.error('QuickBooks OAuth callback Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});