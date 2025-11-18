// Manage Debt Edge Function
// Add debts or record payments

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ManageDebtRequest {
    action: 'add' | 'pay' | 'update'
    debt_id?: string
    name?: string
    type?: 'credit_card' | 'loan' | 'mortgage'
    total_amount?: number
    interest_rate?: number
    minimum_payment?: number
    due_date?: string
    payment_amount?: number
    payment_date?: string
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

        const requestData: ManageDebtRequest = await req.json()
        const { action } = requestData

        if (action === 'add') {
            const { name, type, total_amount, interest_rate, minimum_payment, due_date } = requestData

            const { data: debt } = await supabaseClient
                .from('debts')
                .insert({
                    user_id: user.id,
                    name: name!,
                    type: type!,
                    total_amount: total_amount!,
                    remaining_amount: total_amount!,
                    interest_rate,
                    minimum_payment,
                    due_date,
                    status: 'active'
                })
                .select()
                .single()

            return new Response(JSON.stringify({
                success: true,
                message: `Deuda "${name}" agregada`,
                debt
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (action === 'pay') {
            const { debt_id, payment_amount, payment_date = new Date().toISOString().split('T')[0] } = requestData

            // Get current debt
            const { data: debt } = await supabaseClient
                .from('debts')
                .select('remaining_amount')
                .eq('id', debt_id!)
                .eq('user_id', user.id)
                .single()

            if (!debt) {
                return new Response(JSON.stringify({ error: 'Debt not found' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            // Record payment
            await supabaseClient
                .from('debt_payments')
                .insert({
                    debt_id: debt_id!,
                    amount: payment_amount!,
                    payment_date
                })

            // Update remaining amount
            const newRemaining = Number(debt.remaining_amount) - Number(payment_amount!)
            const status = newRemaining <= 0 ? 'paid_off' : 'active'

            await supabaseClient
                .from('debts')
                .update({
                    remaining_amount: Math.max(0, newRemaining),
                    status
                })
                .eq('id', debt_id!)

            return new Response(JSON.stringify({
                success: true,
                message: `Pago de $${payment_amount} registrado`,
                remaining: Math.max(0, newRemaining),
                paid_off: status === 'paid_off'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
