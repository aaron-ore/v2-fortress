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
  let requestBody = '';

  try {
    console.log('Edge Function: Incoming request method:', req.method);
    console.log('Edge Function: Content-Type header:', req.headers.get('Content-Type'));
    console.log('Edge Function: Content-Length header:', req.headers.get('Content-Length'));

    // Check if the request has a body and it's readable
    if (req.body) {
      requestBody = await req.text(); // Read raw body once
      console.log('Edge Function: Raw request body:', requestBody);
    } else {
      console.log('Edge Function: Request body is null or not readable.');
      return new Response(JSON.stringify({ error: 'Request body is empty or unreadable.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!requestBody.trim()) {
      console.error('Edge Function: requestBody is empty after reading. This means the client sent an empty body or it was stripped.');
      return new Response(JSON.stringify({ error: 'Received empty request body. Please ensure content is sent.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const jsonBody = JSON.parse(requestBody);
    textToSummarize = jsonBody.textToSummarize;

    console.log('Edge Function: Parsed textToSummarize:', textToSummarize);

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
    console.log('Edge Function: Authorization header:', authHeader);
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
      console.error('Edge Function: Gemini API key not configured.');
      return new Response(JSON.stringify({ error: 'Gemini API key not configured.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${geminiApiKey}`;

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
      console.error('Gemini API error:', errorData);
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
    console.error('Edge Function error during request parsing or processing:', error);
    console.error('Problematic request body:', requestBody);
    return new Response(JSON.stringify({ error: `Failed to parse request body: ${error.message}. Raw body: ${requestBody}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});