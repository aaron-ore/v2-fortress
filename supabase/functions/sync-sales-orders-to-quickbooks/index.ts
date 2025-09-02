import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

// Inlined corsHeaders to avoid module resolution issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    console.log('Edge Function received Authorization header:', authHeader);

    if (!authHeader) {
      console.error('Edge Function: Authorization header missing. Returning 401.');
      return new Response(JSON.stringify({ error: 'Unauthorized: Authorization header missing.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('Edge Function: JWT token missing from Authorization header. Returning 401.');
      return new Response(JSON.stringify({ error: 'Unauthorized: JWT token missing.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Edge Function user from auth.getUser:', user);

    if (userError) {
      console.error('Edge Function: Error getting user from token:', userError);
      return new Response(JSON.stringify({ error: `Unauthorized: ${userError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    if (!user) {
      console.error('Edge Function: User not authenticated from token. Returning 401.');
      return new Response(JSON.stringify({ error: 'Unauthorized: User not authenticated.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('quickbooks_access_token, quickbooks_refresh_token, quickbooks_realm_id')
      .eq('id', user.id)
      .single();

    console.log('Edge Function: Fetched profile for user:', user.id, 'Profile data:', profile);

    if (profileError || !profile?.quickbooks_access_token || !profile?.quickbooks_refresh_token || !profile?.quickbooks_realm_id) {
      console.error('QuickBooks credentials missing for user:', user.id, profileError);
      // NEW: More specific error message if realmId is missing
      const errorMessage = !profile?.quickbooks_realm_id 
        ? 'QuickBooks company (realmId) is missing. Please re-connect QuickBooks and ensure you select a company during authorization.'
        : 'QuickBooks integration not fully set up for this user (tokens or realmId missing).';
      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let accessToken = profile.quickbooks_access_token;
    let refreshToken = profile.quickbooks_refresh_token;
    const realmId = profile.quickbooks_realm_id;

    const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');

    if (!QUICKBOOKS_CLIENT_ID || !QUICKBOOKS_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: 'QuickBooks API credentials (Client ID/Secret) are missing in Supabase secrets.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const refreshQuickBooksToken = async () => {
      console.log('Refreshing QuickBooks token...');
      const refreshResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
      });

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        console.error('Error refreshing QuickBooks token:', errorData);
        throw new Error(`Failed to refresh QuickBooks token: ${errorData.error_description || 'Unknown error'}`);
      }

      const newTokens = await refreshResponse.json();
      accessToken = newTokens.access_token;
      refreshToken = newTokens.refresh_token;

      const { error: updateTokenError } = await supabaseAdmin
        .from('profiles')
        .update({
          quickbooks_access_token: accessToken,
          quickbooks_refresh_token: refreshToken,
        })
        .eq('id', user.id);

      if (updateTokenError) {
        console.error('Error saving new QuickBooks tokens to profile:', updateTokenError);
        throw new Error('Failed to save new QuickBooks tokens.');
      }
      console.log('QuickBooks token refreshed and saved.');
    };

    const { data: ordersToSync, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('type', 'Sales')
      .eq('status', 'Shipped')
      .is('quickbooks_synced', false);

    if (ordersError) {
      console.error('Error fetching orders to sync:', ordersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch sales orders.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!ordersToSync || ordersToSync.length === 0) {
      return new Response(JSON.stringify({ message: 'No new shipped sales orders to sync to QuickBooks.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const syncResults = [];

    for (const order of ordersToSync) {
      try {
        const salesReceipt = {
          CustomerRef: {
            name: order.customer_supplier,
          },
          Line: order.items.map((item: any) => ({
            DetailType: 'SalesItemLineDetail',
            SalesItemLineDetail: {
              ItemRef: {
                name: item.itemName,
              },
              UnitPrice: item.unitPrice,
              Qty: item.quantity,
            },
            Amount: item.quantity * item.unitPrice,
          })),
          TxnDate: order.date,
          PrivateNote: `Fortress Order ID: ${order.id}. Notes: ${order.notes || ''}`,
          TotalAmt: order.total_amount,
        };

        let qbResponse;
        try {
          qbResponse = await fetch(`${QUICKBOOKS_API_BASE_URL}/${realmId}/salesreceipt?minorversion=69`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(salesReceipt),
          });
        } catch (fetchError) {
          if (fetchError instanceof Response && fetchError.status === 401) {
            console.log('QuickBooks API call failed with 401, attempting token refresh...');
            await refreshQuickBooksToken();
            qbResponse = await fetch(`${QUICKBOOKS_API_BASE_URL}/${realmId}/salesreceipt?minorversion=69`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(salesReceipt),
            });
          } else {
            throw fetchError;
          }
        }

        if (!qbResponse.ok) {
          const errorData = await qbResponse.json();
          console.error(`QuickBooks API error for order ${order.id}:`, errorData);
          throw new Error(`QuickBooks API error: ${errorData.Fault?.Error?.[0]?.Detail || qbResponse.statusText}`);
        }

        const qbData = await qbResponse.json();
        const quickbooksId = qbData.SalesReceipt.Id;

        const { error: updateOrderError } = await supabaseAdmin
          .from('orders')
          .update({
            quickbooks_synced: true,
            quickbooks_id: quickbooksId,
          })
          .eq('id', order.id);

        if (updateOrderError) {
          console.error(`Error updating Supabase order ${order.id} after QuickBooks sync:`, updateOrderError);
          throw new Error('Failed to update order sync status in Supabase.');
        }

        syncResults.push({ orderId: order.id, status: 'success', quickbooksId });

      } catch (syncError: any) {
        console.error(`Error syncing order ${order.id}:`, syncError);
        syncResults.push({ orderId: order.id, status: 'failed', error: syncError.message });
      }
    }

    return new Response(JSON.stringify({ message: 'Sales order synchronization complete.', results: syncResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});