// Manage Budget Edge Function
// Create or update budgets

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ManageBudgetRequest {
    category: string
    amount: number
    period?: 'monthly' | 'yearly'
}

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

        const { category, amount, period = 'monthly' }: ManageBudgetRequest = await req.json()

        // Find category
        const { data: categoryData } = await supabaseClient
            .from('categories')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', category)
            .eq('type', 'expense')
            .single()

        if (!categoryData) {
            return new Response(JSON.stringify({ error: `Category "${category}" not found` }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Calculate period dates
        const now = new Date()
        const startDate = period === 'yearly'
            ? new Date(now.getFullYear(), 0, 1)
            : new Date(now.getFullYear(), now.getMonth(), 1)

        const endDate = period === 'yearly'
            ? new Date(now.getFullYear(), 11, 31)
            : new Date(now.getFullYear(), now.getMonth() + 1, 0)

        // Check if budget exists
        const { data: existingBudget } = await supabaseClient
            .from('budgets')
            .select('id')
            .eq('user_id', user.id)
            .eq('category_id', categoryData.id)
            .eq('period', period)
            .gte('end_date', now.toISOString().split('T')[0])
            .single()

        if (existingBudget) {
            // Update existing
            const { data: updated } = await supabaseClient
                .from('budgets')
                .update({ amount })
                .eq('id', existingBudget.id)
                .select()
                .single()

            return new Response(JSON.stringify({
                success: true,
                message: `Presupuesto actualizado para ${category}`,
                budget: updated
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Create new budget
        const { data: budget } = await supabaseClient
            .from('budgets')
            .insert({
                user_id: user.id,
                category_id: categoryData.id,
                amount,
                period,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            })
            .select()
            .single()

        return new Response(JSON.stringify({
            success: true,
            message: `Presupuesto creado para ${category}`,
            budget
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
