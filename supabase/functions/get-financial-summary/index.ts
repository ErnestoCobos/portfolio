// Financial Summary Edge Function
// Returns overall financial status for the user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface FinancialSummaryRequest {
  period?: 'monthly' | 'yearly' | 'all';
}

Deno.serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for bypassing RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Try to get user from JWT first, fallback to DEFAULT_USER_ID
    let userId: string | undefined;

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const anonClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        );
        const {
          data: { user },
        } = await anonClient.auth.getUser();
        if (user) userId = user.id;
      } catch (e) {
        // JWT validation failed, will use DEFAULT_USER_ID
      }
    }

    // Fallback to DEFAULT_USER_ID if no user from JWT
    if (!userId) {
      userId = Deno.env.get('DEFAULT_USER_ID');
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No user ID available' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { period = 'monthly' }: FinancialSummaryRequest = await req.json();

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default: // monthly
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get total balance across all accounts
    const { data: accounts } = await supabaseClient
      .from('accounts')
      .select('balance')
      .eq('user_id', userId);

    const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) ?? 0;

    // Get income and expenses for period
    const { data: transactions } = await supabaseClient
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0]);

    const income =
      transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

    const expenses =
      transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

    // Get active debts
    const { data: debts } = await supabaseClient
      .from('debts')
      .select('remaining_amount')
      .eq('user_id', userId)
      .eq('status', 'active');

    const totalDebt = debts?.reduce((sum, d) => sum + Number(d.remaining_amount), 0) ?? 0;

    // Get budget status
    const { data: budgets } = await supabaseClient
      .from('budgets')
      .select(
        `
        id,
        amount,
        category_id,
        categories (
          name,
          icon
        )
      `
      )
      .eq('user_id', userId)
      .eq('period', period === 'yearly' ? 'yearly' : 'monthly');

    const budgetStatus = await Promise.all(
      (budgets ?? []).map(async budget => {
        const { data: categoryTransactions } = await supabaseClient
          .from('transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('category_id', budget.category_id)
          .eq('type', 'expense')
          .gte('date', startDate.toISOString().split('T')[0]);

        const spent = categoryTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
        const remaining = Number(budget.amount) - spent;
        const percentage = Math.round((spent / Number(budget.amount)) * 100);

        return {
          category: budget.categories?.name ?? 'Unknown',
          icon: budget.categories?.icon,
          budget: Number(budget.amount),
          spent,
          remaining,
          percentage: Math.min(percentage, 100),
        };
      })
    );

    // Get upcoming debt payments
    const { data: upcomingDebts } = await supabaseClient
      .from('debts')
      .select('name, minimum_payment, due_date')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('due_date', now.toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(5);

    // Get crypto portfolio balances
    const { data: cryptoBalances } = await supabaseClient
      .from('crypto_balances')
      .select('asset, total, value_usd')
      .eq('user_id', userId)
      .gt('total', 0);

    const totalCryptoValue =
      cryptoBalances?.reduce((sum, balance) => sum + (Number(balance.value_usd) || 0), 0) ?? 0;

    // Get latest portfolio snapshot for comparison
    const { data: latestSnapshot } = await supabaseClient
      .from('portfolio_snapshots')
      .select('total_value_usd, snapshot_date')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    const response = {
      period,
      total_balance: totalBalance,
      monthly_income: period === 'monthly' ? income : income / 12,
      monthly_expenses: period === 'monthly' ? expenses : expenses / 12,
      net_income: income - expenses,
      active_debts: totalDebt,
      budget_status: budgetStatus,
      upcoming_payments: upcomingDebts ?? [],
      savings_rate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
      crypto_portfolio: {
        total_value_usd: totalCryptoValue,
        assets:
          cryptoBalances?.map(b => ({
            asset: b.asset,
            amount: b.total,
            value_usd: b.value_usd || 0,
          })) || [],
        last_updated: latestSnapshot?.snapshot_date || null,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
