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
    // REMOVED: const realmIdFromUrl = url.searchParams.get('realmId'); // No longer getting from URL

    // Log all search parameters for debugging
    console.log('QuickBooks OAuth Callback: All URL search parameters:', JSON.stringify(Object.fromEntries(url.searchParams.entries()), null, 2));

    // NEW: Decode the state parameter to get userId and redirectToFrontend
    let userId: string | null = null;
    let redirectToFrontend: string | null = null;
    const FALLBACK_CLIENT_APP_BASE_URL = 'https://dyad-generated-app.vercel.app';

    if (state) {
      try {
        const decodedState = JSON.parse(atob(state)); // Base64 decode and parse JSON
        userId = decodedState.userId;
        redirectToFrontend = decodedState.redirectToFrontend;
        console.log('QuickBooks OAuth Callback: Decoded state - userId:', userId, 'redirectToFrontend:', redirectToFrontend);
      } catch (e) {
        console.error('Error decoding state parameter:', e);
      }
    }
    const finalRedirectBase = redirectToFrontend || FALLBACK_CLIENT_APP_BASE_URL;


    if (error) {
      console.error('QuickBooks OAuth Error:', error, errorDescription);
      return Response.redirect(`${finalRedirectBase}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent(errorDescription || error)}`, 302);
    }

    if (!code || !userId) { // Use decoded userId
      console.error('Missing authorization code or userId in QuickBooks OAuth callback.');
      return Response.redirect(`${finalRedirectBase}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent('Missing authorization code or user ID.')}`, 302);
    }

    const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!QUICKBOOKS_CLIENT_ID || !QUICKBOOKS_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase or QuickBooks environment variables.');
      return Response.redirect(`${finalRedirectBase}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent('Server configuration error: Missing environment variables.')}`, 302);
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
      return Response.redirect(`${finalRedirectBase}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent(errorData.error_description || 'Failed to get QuickBooks tokens.')}`, 302);
    }

    const tokens = await tokenResponse.json();
    console.log('QuickBooks OAuth Callback: Full tokens object received:', JSON.stringify(tokens, null, 2));

    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    // NEW: Extract realmId from id_token
    let realmIdFromIdToken: string | null = null;
    if (tokens.id_token) {
      try {
        const idTokenParts = tokens.id_token.split('.');
        if (idTokenParts.length === 3) {
          const idTokenPayloadBase64 = idTokenParts[1];
          const idTokenPayload = JSON.parse(atob(idTokenPayloadBase64));
          realmIdFromIdToken = idTokenPayload.realmId || null;
        }
      } catch (e) {
        console.error('Error decoding id_token or extracting realmId:', e);
      }
    }
    console.log('QuickBooks OAuth Callback: Extracted Realm ID from id_token:', realmIdFromIdToken || 'null (missing from id_token)');

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        quickbooks_access_token: accessToken,
        quickbooks_refresh_token: refreshToken,
        quickbooks_realm_id: realmIdFromIdToken, // Use realmId extracted from id_token
      })
      .eq('id', userId); // Use decoded userId

    if (updateError) {
      console.error('Error updating user profile with QuickBooks tokens:', updateError);
      return Response.redirect(`${finalRedirectBase}/quickbooks-oauth-callback?quickbooks_error=${encodeURIComponent('Failed to save QuickBooks tokens.')}`, 302);
    }

    console.log('QuickBooks tokens and Realm ID successfully stored for user:', userId);
    // Redirect back to client app's handler, including realmId status
    return Response.redirect(`${finalRedirectBase}/quickbooks-oauth-callback?quickbooks_success=true&realmId_present=${!!realmIdFromIdToken}`, 302);
  } catch (error) {
    console.error('QuickBooks OAuth callback Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});