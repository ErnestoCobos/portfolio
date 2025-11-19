// Get Budget Status Edge Function  
// Returns current budget status with spent amounts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // Get monthly budgets
        const { data: budgets } = await supabaseClient
            .from('budgets')
            .select(`
        id,
        amount,
        category_id,
        categories (
          name,
          icon,
          color
        )
      `)
            .eq('user_id', user.id)
            .eq('period', 'monthly')
            .gte('end_date', now.toISOString().split('T')[0])

        if (!budgets || budgets.length === 0) {
            return new Response(JSON.stringify({
                budgets: [],
                message: 'No hay presupuestos configurados'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Calculate spent for each budget
        const budgetStatus = await Promise.all(
            budgets.map(async (budget) => {
                const { data: transactions } = await supabaseClient
                    .from('transactions')
                    .select('amount')
                    .eq('user_id', user.id)
                    .eq('category_id', budget.category_id)
                    .eq('type', 'expense')
                    .gte('date', startOfMonth.toISOString().split('T')[0])

                const spent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) ?? 0
                const budgetAmount = Number(budget.amount)
                const remaining = budgetAmount - spent
                const percentage = Math.round((spent / budgetAmount) * 100)

                return {
                    category: budget.categories?.name ?? 'Unknown',
                    icon: budget.categories?.icon,
                    color: budget.categories?.color,
                    budget: budgetAmount,
                    spent,
                    remaining,
                    percentage: Math.min(percentage, 100),
                    status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok'
                }
            })
        )

        // Calculate totals
        const totalBudget = budgetStatus.reduce((sum, b) => sum + b.budget, 0)
        const totalSpent = budgetStatus.reduce((sum, b) => sum + b.spent, 0)
        const totalRemaining = totalBudget - totalSpent

        return new Response(JSON.stringify({
            budgets: budgetStatus,
            totals: {
                budget: totalBudget,
                spent: totalSpent,
                remaining: totalRemaining,
                percentage: Math.round((totalSpent / totalBudget) * 100)
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
