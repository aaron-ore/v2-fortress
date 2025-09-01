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
    const redirectUri = `https://${url.host}/functions/v1/quickbooks-oauth-callback`;
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
      return Response.redirect(`${url.origin}/settings?quickbooks_error=${encodeURIComponent(errorData.error_description || 'Failed to get QuickBooks tokens.')}`, 302);
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const realmId = tokens.realmId; // This is the QuickBooks company ID

    // Use the 'state' parameter (which is the user.id) to update the profile
    const userId = state;
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
      return Response.redirect(`${url.origin}/settings?quickbooks_error=${encodeURIComponent('Failed to save QuickBooks tokens.')}`, 302);
    }

    console.log('QuickBooks tokens and Realm ID successfully stored for user:', userId);
    return Response.redirect(`https://${url.host}/settings?quickbooks_success=true`, 302);

  } catch (error) {
    console.error('QuickBooks OAuth callback Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

// ... existing imports and corsHeaders ...

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // ... existing error handling for code/state ...

    const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // NEW LOGGING: Verify secrets are loaded
    console.log('QUICKBOOKS_CLIENT_ID:', QUICKBOOKS_CLIENT_ID ? 'Loaded' : 'NOT LOADED');
    console.log('QUICKBOOKS_CLIENT_SECRET:', QUICKBOOKS_CLIENT_SECRET ? 'Loaded' : 'NOT LOADED');
    // If you want to see the actual values (be cautious with sensitive data in logs in production)
    // console.log('QUICKBOOKS_CLIENT_ID_VALUE:', QUICKBOOKS_CLIENT_ID);
    // console.log('QUICKBOOKS_CLIENT_SECRET_VALUE:', QUICKBOOKS_CLIENT_SECRET);


    if (!QUICKBOOKS_CLIENT_ID || !QUICKBOOKS_CLIENT_SECRET) {
      console.error('Missing QuickBooks API credentials in Edge Function.');
      return Response.redirect(`${url.origin}/settings?quickbooks_error=${encodeURIComponent('QuickBooks Client ID or Secret is missing in Supabase secrets.')}`, 302);
    }
    // ... existing checks for SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ...

    const redirectUri = `${url.origin}/functions/v1/quickbooks-oauth-callback`;
    console.log('Using redirectUri for token exchange:', redirectUri);

    // NEW LOGGING: Log the string before Base64 encoding
    const base64String = `${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`;
    console.log('Base64 input string:', base64String);
    const encodedAuth = btoa(base64String);
    console.log('Encoded Authorization header value:', `Basic ${encodedAuth}`);


    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${encodedAuth}`, // Use the logged encodedAuth
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
      // NEW LOGGING: Log the full error response from QuickBooks
      console.error('Full QuickBooks Token Exchange Error Response:', JSON.stringify(errorData, null, 2));
      return Response.redirect(`${url.origin}/settings?quickbooks_error=${encodeURIComponent(errorData.error_description || 'Failed to get QuickBooks tokens.')}`, 302);
    }

    // ... rest of the function ...

  } catch (error) {
    console.error('QuickBooks OAuth callback Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});