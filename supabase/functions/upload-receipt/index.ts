// Upload Receipt Edge Function
// Process receipt images/PDFs with OCR and match with transactions
// NOTE: This is a simplified version. For production, integrate Google Vision API or similar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UploadReceiptResponse {
    document_id: string
    file_url: string
    extracted_data: {
        amount?: number
        date?: string
        merchant?: string
        payment_method?: string
        suggested_category?: string
    }
    matching?: {
        found_bank_transaction: boolean
        transaction_id?: string
        confidence?: number
        matched_by?: string[]
    }
    learned_pattern?: {
        merchant?: string
        typical_payment_method?: string
        confidence?: number
    }
    line_items?: Array<{
        description: string
        quantity: number
        unit_price?: number
        total_price: number
        needs_clarification: boolean
    }>
}

// Simple OCR text extraction (placeholder - replace with actual OCR service)
async function extractTextFromReceipt(fileData: ArrayBuffer): Promise<string> {
    // In production, use Google Vision API, Tesseract, or similar
    // For now, return empty string - GPT can handle missing OCR
    return ''
}

// Normalize merchant name for pattern matching
function normalizeMerchant(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
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

        // Parse multipart form data
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file provided' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Upload to Supabase Storage
        const filePath = `${user.id}/${Date.now()}_${file.name}`
        const fileData = await file.arrayBuffer()

        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('receipts')
            .upload(filePath, fileData, {
                contentType: file.type
            })

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseClient
            .storage
            .from('receipts')
            .getPublicUrl(filePath)

        // Extract text with OCR (placeholder)
        const ocrText = await extractTextFromReceipt(fileData)

        // For now, use manual extraction
        // In production, parse ocrText to extract these fields
        const extractedData = {
            amount: undefined as number | undefined,
            date: new Date().toISOString().split('T')[0],
            merchant: undefined as string | undefined,
            payment_method: undefined as string | undefined,
            suggested_category: 'Comida' // Default
        }

        // Create document record
        const { data: document } = await supabaseClient
            .from('documents')
            .insert({
                user_id: user.id,
                file_path: filePath,
                file_type: file.type,
                original_filename: file.name,
                ocr_text: ocrText,
                extracted_amount: extractedData.amount,
                extracted_date: extractedData.date,
                extracted_merchant: extractedData.merchant,
                extracted_payment_method: extractedData.payment_method,
                has_line_items: false,
                processed: true,
                is_matched: false
            })
            .select()
            .single()

        const response: UploadReceiptResponse = {
            document_id: document.id,
            file_url: publicUrl,
            extracted_data: extractedData
        }

        // Try to match with existing transactions (if amount was extracted)
        if (extractedData.amount && extractedData.merchant) {
            const twoDaysAgo = new Date()
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
            const twoDaysAhead = new Date()
            twoDaysAhead.setDate(twoDaysAhead.getDate() + 2)

            const { data: matchingTransactions } = await supabaseClient
                .from('transactions')
                .select('id, merchant, amount, date')
                .eq('user_id', user.id)
                .eq('amount', extractedData.amount)
                .gte('date', twoDaysAgo.toISOString().split('T')[0])
                .lte('date', twoDaysAhead.toISOString().split('T')[0])

            const normalizedMerchant = normalizeMerchant(extractedData.merchant)
            const match = matchingTransactions?.find(t =>
                t.merchant && normalizeMerchant(t.merchant) === normalizedMerchant
            )

            if (match) {
                // Mark as matched
                await supabaseClient
                    .from('documents')
                    .update({ is_matched: true, transaction_id: match.id })
                    .eq('id', document.id)

                await supabaseClient
                    .from('transactions')
                    .update({ is_reconciled: true, reconciled_with: document.id })
                    .eq('id', match.id)

                response.matching = {
                    found_bank_transaction: true,
                    transaction_id: match.id,
                    confidence: 0.95,
                    matched_by: ['amount', 'date', 'merchant']
                }
            }
        }

        // Check merchant patterns
        if (extractedData.merchant && extractedData.payment_method) {
            const normalizedMerchant = normalizeMerchant(extractedData.merchant)

            const { data: pattern } = await supabaseClient
                .from('merchant_patterns')
                .select('payment_method_id, usage_count, confidence_score')
                .eq('user_id', user.id)
                .eq('merchant_name', normalizedMerchant)
                .single()

            if (pattern) {
                response.learned_pattern = {
                    merchant: extractedData.merchant,
                    typical_payment_method: extractedData.payment_method,
                    confidence: Number(pattern.confidence_score)
                }
            }
        }

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
