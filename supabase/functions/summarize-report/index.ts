import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
// Inlined corsHeaders to avoid module resolution issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let rawRequestBody = '';

  try {
    console.log('Edge Function: Incoming request method:', req.method);
    console.log('Edge Function: Content-Type header:', req.headers.get('Content-Type'));
    console.log('Edge Function: Content-Length header:', req.headers.get('Content-Length'));

    // Log all headers for debugging
    console.log('Edge Function: All incoming headers:');
    for (const [key, value] of req.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    // Attempt to read the raw request body as text
    console.log('Edge Function: Attempting to read raw request body as text...');
    rawRequestBody = await req.text();
    console.log('Edge Function: Successfully read raw request body. Length:', rawRequestBody.length);
    console.log('Edge Function: Raw request body content (first 500 chars):', `"${rawRequestBody.substring(0, 500)}..."`);

    // For debugging, return the raw body directly
    return new Response(JSON.stringify({
      message: 'Raw body received for debugging.',
      rawBody: rawRequestBody,
      rawBodyLength: rawRequestBody.length,
      contentType: req.headers.get('Content-Type'),
      contentLength: req.headers.get('Content-Length'),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function error during request processing:', error);
    return new Response(JSON.stringify({ error: `Failed to process request: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});