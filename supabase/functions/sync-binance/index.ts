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
  const baseUrl = 'https://api.binance.com';
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

    // Get all active crypto accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('crypto_accounts')
      .select('*')
      .eq('status', 'active')
      .eq('exchange', 'binance');

    if (accountsError) throw accountsError;

    const results = [];

    for (const account of accounts) {
      try {
        // Decrypt API credentials
        const decrypted = JSON.parse(atob(account.api_key_encrypted));
        const { api_key, api_secret } = decrypted;

        // 1. Get account balances
        const balances = await signedRequest(api_key, api_secret, '/api/v3/account');

        let balancesUpdated = 0;
        for (const balance of balances.balances) {
          const total = parseFloat(balance.free) + parseFloat(balance.locked);
          if (total > 0) {
            // Upsert balance
            await supabase.from('crypto_balances').upsert(
              {
                user_id: account.user_id,
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
            const trades = await signedRequest(api_key, api_secret, '/api/v3/myTrades', {
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
                .single();

              if (!existing) {
                const isBuy = trade.isBuyer;
                const baseAsset = symbol.replace('USDT', '').replace('BUSD', '');

                await supabase.from('crypto_transactions').insert({
                  user_id: account.user_id,
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
            console.error(`Error fetching trades for ${symbol}: `, err);
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
        console.error(`Error syncing account ${account.id}: `, err);
        results.push({ account: account.id, error: err.message });
      }
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
