// Manage Transaction Edge Function
// Add or update transactions (expenses and income)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ManageTransactionRequest {
    action?: 'add' | 'update' | 'delete'
    transaction_id?: string
    type: 'expense' | 'income'
    amount: number
    category?: string
    description?: string
    merchant?: string
    date?: string
    account?: string
    payment_method?: string
    is_recurring?: boolean
    recurrence_pattern?: string
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

        const requestData: ManageTransactionRequest = await req.json()
        const {
            action = 'add',
            transaction_id,
            type,
            amount,
            category,
            description,
            merchant,
            date = new Date().toISOString().split('T')[0],
            account,
            payment_method,
            is_recurring = false,
            recurrence_pattern
        } = requestData

        // Find or create category
        let categoryId: string | null = null
        if (category) {
            let { data: categoryData } = await supabaseClient
                .from('categories')
                .select('id')
                .eq('user_id', user.id)
                .eq('name', category)
                .eq('type', type)
                .single()

            if (!categoryData) {
                const { data: newCategory } = await supabaseClient
                    .from('categories')
                    .insert({ user_id: user.id, name: category, type })
                    .select()
                    .single()
                categoryId = newCategory?.id
            } else {
                categoryId = categoryData.id
            }
        }

        // Find or get default account
        let accountId: string
        if (account) {
            const { data: accountData } = await supabaseClient
                .from('accounts')
                .select('id')
                .eq('user_id', user.id)
                .eq('name', account)
                .single()

            accountId = accountData?.id
        } else {
            // Get first account or create one
            let { data: accountData } = await supabaseClient
                .from('accounts')
                .select('id')
                .eq('user_id', user.id)
                .limit(1)
                .single()

            if (!accountData) {
                const { data: newAccount } = await supabaseClient
                    .from('accounts')
                    .insert({ user_id: user.id, name: 'Cuenta Principal', type: 'checking', balance: 0 })
                    .select()
                    .single()
                accountId = newAccount?.id
            } else {
                accountId = accountData.id
            }
        }

        // Find payment method if specified
        let paymentMethodId: string | null = null
        if (payment_method) {
            const { data: pmData } = await supabaseClient
                .from('payment_methods')
                .select('id')
                .eq('user_id', user.id)
                .or(`name.eq.${payment_method},last_four_digits.eq.${payment_method}`)
                .single()

            paymentMethodId = pmData?.id
        }

        if (action === 'delete' && transaction_id) {
            await supabaseClient
                .from('transactions')
                .delete()
                .eq('id', transaction_id)
                .eq('user_id', user.id)

            return new Response(JSON.stringify({ success: true, message: 'Transaction deleted' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (action === 'update' && transaction_id) {
            const { data: updated } = await supabaseClient
                .from('transactions')
                .update({
                    type,
                    amount,
                    category_id: categoryId,
                    description,
                    merchant,
                    date,
                    payment_method_id: paymentMethodId,
                    is_recurring,
                    recurrence_pattern
                })
                .eq('id', transaction_id)
                .eq('user_id', user.id)
                .select()
                .single()

            return new Response(JSON.stringify({ success: true, transaction: updated }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Add new transaction
        const { data: transaction } = await supabaseClient
            .from('transactions')
            .insert({
                user_id: user.id,
                account_id: accountId,
                category_id: categoryId,
                payment_method_id: paymentMethodId,
                type,
                amount,
                description,
                merchant,
                date,
                is_recurring,
                recurrence_pattern,
                source: 'manual'
            })
            .select()
            .single()

        // Update account balance
        const balanceChange = type === 'income' ? amount : -amount
        await supabaseClient.rpc('increment_balance', {
            account_id: accountId,
            amount: balanceChange
        })

        return new Response(JSON.stringify({
            success: true,
            message: `${type === 'income' ? 'Ingreso' : 'Gasto'} registrado exitosamente`,
            transaction
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
