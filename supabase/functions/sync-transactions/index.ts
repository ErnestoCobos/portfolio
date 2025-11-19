import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Authenticate with Belvo
    const secretId = Deno.env.get('BELVO_SECRET_ID');
    const secretPassword = Deno.env.get('BELVO_SECRET_PASSWORD');
    const env = Deno.env.get('BELVO_ENV') || 'sandbox';
    const baseUrl = env === 'production' ? 'https://api.belvo.com' : 'https://sandbox.belvo.com';
    const auth = btoa(`${secretId}:${secretPassword}`);

    // 2. Get all active links
    const { data: links, error: linksError } = await supabase
      .from('bank_links')
      .select('*')
      .eq('status', 'active');

    if (linksError) throw linksError;

    const results = [];

    for (const link of links) {
      try {
        // 3. Get accounts for this link
        const accountsRes = await fetch(`${baseUrl}/api/accounts/?link=${link.belvo_link_id}`, {
          headers: { Authorization: `Basic ${auth}` },
        });
        const accounts = await accountsRes.json();

        for (const acc of accounts) {
          // Find or create account in Supabase
          let { data: dbAccount } = await supabase
            .from('accounts')
            .select('id')
            .eq('name', `Belvo - ${acc.name}`)
            .eq('user_id', link.user_id)
            .single();

          if (!dbAccount) {
            const { data: newAccount } = await supabase
              .from('accounts')
              .insert({
                user_id: link.user_id,
                name: `Belvo - ${acc.name}`,
                type: 'credit_card', // Defaulting to credit card for AMEX
                currency: acc.currency,
                balance: acc.balance.current,
              })
              .select()
              .single();
            dbAccount = newAccount;
          }

          // 4. Get transactions (last 30 days)
          const dateFrom = new Date();
          dateFrom.setDate(dateFrom.getDate() - 30);
          const dateFromStr = dateFrom.toISOString().split('T')[0];

          const transRes = await fetch(
            `${baseUrl}/api/transactions/?link=${link.belvo_link_id}&account=${acc.id}&date_from=${dateFromStr}`,
            {
              headers: { Authorization: `Basic ${auth}` },
            }
          );
          const transactions = await transRes.json();

          let count = 0;
          for (const t of transactions) {
            // Check if exists (simple check by description + date + amount)
            // Ideally we should store external_id
            const { data: existing } = await supabase
              .from('transactions')
              .select('id')
              .eq('date', t.value_date)
              .eq('amount', Math.abs(t.amount))
              .eq('description', t.description)
              .single();

            if (!existing) {
              await supabase.from('transactions').insert({
                user_id: link.user_id,
                account_id: dbAccount.id,
                type: t.amount < 0 ? 'expense' : 'income', // Belvo: negative is outflow (expense)
                amount: Math.abs(t.amount),
                category: t.category || 'Uncategorized',
                description: t.description,
                merchant: t.merchant?.name || t.description,
                date: t.value_date,
                status: 'completed',
              });
              count++;
            }
          }
          results.push({ account: acc.name, new_transactions: count });
        }

        // Update last synced
        await supabase
          .from('bank_links')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', link.id);

        // 5. Auto-Reconcile Receipts
        const reconciledCount = await reconcileReceipts(supabase, link.user_id);
        if (reconciledCount > 0) {
          results.push({ account: 'Reconciliation', reconciled_receipts: reconciledCount });
        }
      } catch (err) {
        console.error(`Error syncing link ${link.id}:`, err);
        results.push({ link: link.id, error: err.message });
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

// Helper function to reconcile receipts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function reconcileReceipts(supabase: any, userId: string): Promise<number> {
  let reconciledCount = 0;

  // 1. Get unmatched documents (receipts)
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .is('transaction_id', null);

  if (!documents || documents.length === 0) return 0;

  // 2. Get unmatched bank transactions (last 60 days to be safe)
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - 60);

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('source', 'bank_import') // Only match bank imports
    .is('reconciled_with', null)
    .gte('date', dateLimit.toISOString().split('T')[0]);

  if (!transactions || transactions.length === 0) return 0;

  // 3. Match logic
  for (const doc of documents) {
    if (!doc.extracted_amount || !doc.extracted_date) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match = transactions.find((tx: any) => {
      // Amount match (±1.00 or ±1%)
      const amountDiff = Math.abs(tx.amount - doc.extracted_amount);
      const isAmountClose = amountDiff < 1.0 || amountDiff / tx.amount < 0.01;

      // Date match (±2 days)
      const txDate = new Date(tx.date);
      const docDate = new Date(doc.extracted_date);
      const dateDiffTime = Math.abs(txDate.getTime() - docDate.getTime());
      const dateDiffDays = Math.ceil(dateDiffTime / (1000 * 60 * 60 * 24));
      const isDateClose = dateDiffDays <= 2;

      return isAmountClose && isDateClose;
    });

    if (match) {
      // Link them
      await supabase
        .from('documents')
        .update({
          transaction_id: match.id,
          is_matched: true,
          processed: true,
        })
        .eq('id', doc.id);

      await supabase
        .from('transactions')
        .update({
          reconciled_with: doc.id,
          is_reconciled: true,
          receipt_image_url: doc.file_path, // Ideally use public URL if possible, or path
        })
        .eq('id', match.id);

      reconciledCount++;

      // Remove matched transaction from pool to avoid double matching
      const index = transactions.indexOf(match);
      if (index > -1) {
        transactions.splice(index, 1);
      }
    }
  }

  return reconciledCount;
}
