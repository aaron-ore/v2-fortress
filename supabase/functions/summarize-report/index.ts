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

  let textToSummarize;

  try {
    console.log('Edge Function: Incoming request method:', req.method);
    console.log('Edge Function: Content-Type header:', req.headers.get('Content-Type'));
    console.log('Edge Function: Content-Length header:', req.headers.get('Content-Length'));

    // Log all headers for debugging
    console.log('Edge Function: All incoming headers:');
    for (const [key, value] of req.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    // Attempt to parse the JSON directly from the request body
    console.log('Edge Function: Attempting to parse JSON from request body using req.json()...');
    const jsonBody = await req.json(); // Use req.json() directly
    textToSummarize = jsonBody.textToSummarize;
    console.log('Edge Function: Successfully parsed JSON from body.');
    console.log('Edge Function: Extracted textToSummarize (first 100 chars):', textToSummarize ? textToSummarize.substring(0, 100) + '...' : 'null');
    console.log('Edge Function: Length of textToSummarize:', textToSummarize ? textToSummarize.length : 0);

    if (!textToSummarize) {
      console.error('Edge Function: textToSummarize is empty or null after parsing.');
      return new Response(JSON.stringify({ error: 'No text provided for summarization.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create a Supabase client with the service_role key to access secrets
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user's session (optional, for logging/RLS if needed)
    const authHeader = req.headers.get('Authorization');
    console.log('Edge Function: Authorization header for user auth:', authHeader);
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader);

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

    // Fetch the Gemini API key from Supabase Secrets
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Edge Function: Gemini API key not configured. Please ensure GEMINI_API_KEY is set in Supabase Secrets.');
      return new Response(JSON.stringify({ error: 'Gemini API key not configured.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    console.log('Edge Function: Gemini API key is configured.');

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${geminiApiKey}`;
    console.log('Edge Function: Gemini API URL:', GEMINI_API_URL);

    const prompt = `Summarize the following text concisely and accurately. Focus on the key information and main points. The summary should be suitable for a business report or quick overview:\n\n${textToSummarize}`;

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Edge Function: Gemini API call failed. Status:', geminiResponse.status, 'Status Text:', geminiResponse.statusText);
      console.error('Edge Function: Gemini API error response:', JSON.stringify(errorData, null, 2));
      return new Response(JSON.stringify({ error: `Gemini API error: ${errorData.error?.message || 'Unknown error'}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: geminiResponse.status,
      });
    }

    const geminiData = await geminiResponse.json();
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary generated.';

    return new Response(JSON.stringify({ summary }), {
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