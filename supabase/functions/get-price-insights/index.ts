// Get Price Insights Edge Function
// Analyze price trends and changes

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface PriceInsightsRequest {
    product_id?: string
    merchant?: string
    days_back?: number
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

        const { product_id, merchant, days_back = 30 }: PriceInsightsRequest = await req.json()

        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days_back)

        // Build query
        let query = supabaseClient
            .from('product_price_history')
            .select(`
        id,
        product_id,
        merchant,
        unit_price,
        purchased_at,
        products (
          name
        )
      `)
            .gte('purchased_at', cutoffDate.toISOString().split('T')[0])

        // Filter by product if specified
        if (product_id) {
            query = query.eq('product_id', product_id)
        } else {
            // Only get products owned by user
            query = query.in('product_id',
                (await supabaseClient
                    .from('products')
                    .select('id')
                    .eq('user_id', user.id)).data?.map(p => p.id) || []
            )
        }

        if (merchant) {
            query = query.eq('merchant', merchant)
        }

        const { data: priceHistory } = await query.order('purchased_at', { ascending: true })

        if (!priceHistory || priceHistory.length === 0) {
            return new Response(JSON.stringify({
                price_increases: [],
                price_decreases: [],
                average_prices: {},
                recommendations: []
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Group by product
        const productGroups = new Map<string, any[]>()
        for (const record of priceHistory) {
            const key = `${record.product_id}_${record.merchant}`
            if (!productGroups.has(key)) {
                productGroups.set(key, [])
            }
            productGroups.get(key)!.push(record)
        }

        const priceIncreases = []
        const priceDecreases = []
        const averagePrices: Record<string, Record<string, number>> = {}

        for (const [key, records] of productGroups) {
            if (records.length < 2) continue

            const sorted = records.sort((a, b) =>
                new Date(a.purchased_at).getTime() - new Date(b.purchased_at).getTime()
            )
            const oldest = sorted[0]
            const latest = sorted[sorted.length - 1]
            const productName = oldest.products?.name || 'Unknown'

            const oldPrice = Number(oldest.unit_price)
            const newPrice = Number(latest.unit_price)
            const change = newPrice - oldPrice
            const changePercent = Math.round((change / oldPrice) * 100)

            if (change > 0.01) {
                priceIncreases.push({
                    product: productName,
                    merchant: oldest.merchant,
                    old_price: oldPrice,
                    new_price: newPrice,
                    increase_percent: changePercent,
                    first_seen: oldest.purchased_at,
                    last_seen: latest.purchased_at
                })
            } else if (change < -0.01) {
                priceDecreases.push({
                    product: productName,
                    merchant: oldest.merchant,
                    old_price: oldPrice,
                    new_price: newPrice,
                    decrease_percent: Math.abs(changePercent),
                    first_seen: oldest.purchased_at,
                    last_seen: latest.purchased_at
                })
            }

            // Calculate average price
            if (!averagePrices[productName]) {
                averagePrices[productName] = {}
            }
            const avgPrice = records.reduce((sum, r) => sum + Number(r.unit_price), 0) / records.length
            averagePrices[productName][oldest.merchant] = Math.round(avgPrice * 100) / 100
        }

        // Generate recommendations
        const recommendations = []

        // Find significant price increases
        const significantIncreases = priceIncreases.filter(i => i.increase_percent >= 10)
        if (significantIncreases.length > 0) {
            recommendations.push(`${significantIncreases.length} producto(s) han subido más del 10% de precio`)
        }

        // Find price differences between merchants
        for (const [product, merchants] of Object.entries(averagePrices)) {
            const merchantPrices = Object.entries(merchants)
            if (merchantPrices.length > 1) {
                const [cheapest, expensivest] = merchantPrices.sort((a, b) => a[1] - b[1])
                const savings = ((expensivest[1] - cheapest[1]) / expensivest[1]) * 100
                if (savings >= 15) {
                    recommendations.push(
                        `${product} es ${Math.round(savings)}% más barato en ${cheapest[0]} que en ${expensivest[0]}`
                    )
                }
            }
        }

        return new Response(JSON.stringify({
            price_increases: priceIncreases.sort((a, b) => b.increase_percent - a.increase_percent).slice(0, 10),
            price_decreases: priceDecreases.sort((a, b) => b.decrease_percent - a.decrease_percent).slice(0, 10),
            average_prices: averagePrices,
            recommendations
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
