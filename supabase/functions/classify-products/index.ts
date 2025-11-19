// Classify Products Edge Function
// Interactive product learning and classification

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ProductClassification {
    line_item_id: string
    description: string
    user_answer: string
}

interface ClassifyProductsRequest {
    document_id: string
    unclassified_items: ProductClassification[]
}

function normalizeProductName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, ' ')
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

        const { document_id, unclassified_items }: ClassifyProductsRequest = await req.json()

        const learnedProducts = []

        for (const item of unclassified_items) {
            const normalizedName = normalizeProductName(item.user_answer)

            // Check if product already exists
            let { data: existingProduct } = await supabaseClient
                .from('products')
                .select('id, normalized_names')
                .eq('user_id', user.id)
                .eq('name', normalizedName)
                .single()

            let productId: string

            if (!existingProduct) {
                // Create new product
                const { data: newProduct } = await supabaseClient
                    .from('products')
                    .insert({
                        user_id: user.id,
                        name: normalizedName,
                        normalized_names: [item.description.toLowerCase(), normalizedName]
                    })
                    .select()
                    .single()

                productId = newProduct.id
                learnedProducts.push({
                    product_id: productId,
                    name: normalizedName,
                    category: null // Can be set later
                })
            } else {
                productId = existingProduct.id

                // Add new normalized name if not exists
                const normalizedNames = existingProduct.normalized_names || []
                if (!normalizedNames.includes(item.description.toLowerCase())) {
                    await supabaseClient
                        .from('products')
                        .update({
                            normalized_names: [...normalizedNames, item.description.toLowerCase()]
                        })
                        .eq('id', productId)
                }
            }

            // Update line item with product ID
            await supabaseClient
                .from('receipt_line_items')
                .update({
                    product_id: productId,
                    is_classified: true,
                    needs_clarification: false
                })
                .eq('id', item.line_item_id)

            // Get line item details for price history
            const { data: lineItem } = await supabaseClient
                .from('receipt_line_items')
                .select('total_price, quantity, document_id')
                .eq('id', item.line_item_id)
                .single()

            if (lineItem) {
                // Get document details for merchant and date
                const { data: document } = await supabaseClient
                    .from('documents')
                    .select('extracted_merchant, extracted_date')
                    .eq('id', lineItem.document_id)
                    .single()

                if (document) {
                    // Add to price history
                    await supabaseClient
                        .from('product_price_history')
                        .insert({
                            product_id: productId,
                            merchant: document.extracted_merchant || 'Unknown',
                            price: Number(lineItem.total_price),
                            quantity: Number(lineItem.quantity),
                            unit_price: Number(lineItem.total_price) / Number(lineItem.quantity),
                            receipt_line_item_id: item.line_item_id,
                            purchased_at: document.extracted_date || new Date().toISOString().split('T')[0]
                        })
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            classified_count: unclassified_items.length,
            learned_products: learnedProducts,
            remaining_unclear: []
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
