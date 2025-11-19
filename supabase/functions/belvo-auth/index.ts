import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const secretId = Deno.env.get('BELVO_SECRET_ID');
    const secretPassword = Deno.env.get('BELVO_SECRET_PASSWORD');
    const env = Deno.env.get('BELVO_ENV') || 'sandbox';
    const baseUrl = env === 'production' ? 'https://api.belvo.com' : 'https://sandbox.belvo.com';

    if (!secretId || !secretPassword) {
      throw new Error('Missing Belvo credentials');
    }

    // Belvo requires Basic Auth for getting the token
    const auth = btoa(`${secretId}:${secretPassword}`);

    const response = await fetch(`${baseUrl}/api/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        id: secretId,
        password: secretPassword,
        scopes: 'read_institutions,read_links,read_accounts,read_transactions',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Belvo Auth Error:', error);
      throw new Error(`Failed to authenticate with Belvo: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
