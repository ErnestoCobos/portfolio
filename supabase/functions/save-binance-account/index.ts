import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { api_key, api_secret } = await req.json();

    if (!api_key || !api_secret) {
      throw new Error("Missing API key or secret");
    }

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Simple encryption (base64 encoding)
    // In production, use proper encryption like AES
    const encrypted_key = btoa(JSON.stringify({ api_key, api_secret }));

    // Save account
    const { data, error } = await supabase
      .from("crypto_accounts")
      .insert({
        user_id: user.id,
        exchange: "binance",
        api_key_encrypted: encrypted_key,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        account_id: data.id,
        message: "Binance account connected successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
