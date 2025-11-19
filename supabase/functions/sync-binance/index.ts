import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

// Binance API helper
async function signedRequest(
  apiKey: string,
  apiSecret: string,
  endpoint: string,
  params: Record<string, string | number> = {}
) {
  const baseUrl = 'https://api.binance.us'; // Changed to Binance.US
  const timestamp = Date.now();

  // Add timestamp to params
  const queryParams = { ...params, timestamp };

  // Create query string
  const queryString = Object.keys(queryParams)
    .map(key => `${key}=${queryParams[key]}`)
    .join('&');

  // Create signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(queryString));

  const hexSignature = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Make request
  const url = `${baseUrl}${endpoint}?${queryString}&signature=${hexSignature}`;
  const response = await fetch(url, {
    headers: { 'X-MBX-APIKEY': apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Binance API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Binance credentials from Supabase secrets
    const apiKey = Deno.env.get('BINANCE_API_KEY');
    const apiSecret = Deno.env.get('BINANCE_SECRET_KEY');

    if (!apiKey || !apiSecret) {
      throw new Error('Binance credentials not configured in Supabase secrets');
    }

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const results = [];

    try {
      // 1. Get account balances
      const balances = await signedRequest(apiKey, apiSecret, '/api/v3/account');

      let balancesUpdated = 0;

      // Get or create crypto account for this user
      const { data: authUser } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      const userId = authUser?.user?.id;

      if (!userId) {
        throw new Error('Could not get user ID');
      }

      // Get or create crypto_account
      let { data: account } = await supabase
        .from('crypto_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('exchange', 'binance')
        .single();

      if (!account) {
        const { data: newAccount } = await supabase
          .from('crypto_accounts')
          .insert({
            user_id: userId,
            exchange: 'binance',
            api_key_encrypted: 'using_env_secrets',
            status: 'active',
          })
          .select()
          .single();
        account = newAccount;
      }

      for (const balance of balances.balances) {
        const total = parseFloat(balance.free) + parseFloat(balance.locked);
        if (total > 0) {
          // Upsert balance
          await supabase.from('crypto_balances').upsert(
            {
              user_id: userId,
              crypto_account_id: account.id,
              asset: balance.asset,
              free: parseFloat(balance.free),
              locked: parseFloat(balance.locked),
              total: total,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'crypto_account_id,asset' }
          );
          balancesUpdated++;
        }
      }

      // 2. Get recent trades (last 7 days)
      const endTime = Date.now();
      const startTime = endTime - 7 * 24 * 60 * 60 * 1000;

      let transactionsAdded = 0;

      // For simplicity, we'll get trades for major pairs (BTC, ETH, USDT, etc.)
      const majorPairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];

      for (const symbol of majorPairs) {
        try {
          const trades = await signedRequest(apiKey, apiSecret, '/api/v3/myTrades', {
            symbol,
            startTime,
            endTime,
            limit: 100,
          });

          for (const trade of trades) {
            // Check if transaction already exists
            const { data: existing } = await supabase
              .from('crypto_transactions')
              .select('id')
              .eq('external_id', `trade_${trade.id}`)
              .from('crypto_transactions')
              .select('id')
              .eq('external_id', `trade_${trade.id}`)
              .single();

            if (!existing) {
              const isBuy = trade.isBuyer;
              const baseAsset = symbol.replace('USDT', '').replace('BUSD', '');

              await supabase.from('crypto_transactions').insert({
                user_id: userId,
                crypto_account_id: account.id,
                external_id: `trade_${trade.id}`,
                type: isBuy ? 'buy' : 'sell',
                asset: baseAsset,
                amount: parseFloat(trade.qty),
                price_usd: parseFloat(trade.price),
                total_usd: parseFloat(trade.quoteQty),
                fee_asset: trade.commissionAsset,
                fee_amount: parseFloat(trade.commission),
                transaction_time: new Date(trade.time).toISOString(),
              });
              transactionsAdded++;
            }
          }
        } catch (err) {
          console.error(`Error fetching trades for ${symbol}:`, err);
        }
      }

      // Update last synced
      await supabase
        .from('crypto_accounts')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', account.id);

      results.push({
        exchange: 'binance',
        balances_updated: balancesUpdated,
        new_transactions: transactionsAdded,
      });
    } catch (err) {
      console.error(`Error syncing Binance:`, err);
      results.push({ error: (err as Error).message });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
