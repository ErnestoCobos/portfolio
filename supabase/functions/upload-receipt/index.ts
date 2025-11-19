// Upload Receipt Edge Function
// Designed to work with GPT Custom Actions
// GPT extracts data from receipt image, this function stores it and matches with transactions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface LineItem {
  description: string;
  quantity: number;
  unit_price?: number;
  total_price: number;
}

interface UploadReceiptRequest {
  // File data (base64 or multipart)
  file?: File;
  file_url?: string; // If GPT already uploaded somewhere

  // Data extracted by GPT Vision
  extracted_data: {
    merchant: string;
    total: number;
    date: string;
    payment_method?: string;
    suggested_category?: string;
    items?: LineItem[];
  };
}

interface UploadReceiptResponse {
  success: boolean;
  document_id: string;
  file_url?: string;
  line_items_created?: number;
  unclassified_products?: Array<{
    line_item_id: string;
    description: string;
  }>;
  matching?: {
    found_transaction: boolean;
    transaction_id?: string;
    confidence: number;
  };
}

// Normalize merchant name for pattern matching
function normalizeMerchant(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to parse as JSON first (GPT sends JSON)
    let requestData: UploadReceiptRequest;
    let fileData: File | null = null;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle multipart (if GPT sends file directly)
      const formData = await req.formData();
      fileData = formData.get('file') as File;
      const extractedDataStr = formData.get('extracted_data') as string;
      requestData = {
        file: fileData,
        extracted_data: JSON.parse(extractedDataStr),
      };
    } else {
      // Handle JSON (preferred for GPT Actions)
      requestData = await req.json();
    }

    const { extracted_data } = requestData;

    if (!extracted_data || !extracted_data.merchant || !extracted_data.total) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: merchant and total are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let filePath: string | null = null;
    let publicUrl: string | null = null;

    // Upload file to storage if provided
    if (fileData || requestData.file_url) {
      if (fileData) {
        filePath = `${user.id}/${Date.now()}_${fileData.name}`;
        const buffer = await fileData.arrayBuffer();

        const { error: uploadError } = await supabaseClient.storage
          .from('receipts')
          .upload(filePath, buffer, {
            contentType: fileData.type,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const {
          data: { publicUrl: url },
        } = supabaseClient.storage.from('receipts').getPublicUrl(filePath);

        publicUrl = url;
      } else {
        publicUrl = requestData.file_url;
      }
    }

    // Create document record
    const { data: document } = await supabaseClient
      .from('documents')
      .insert({
        user_id: user.id,
        file_path: filePath,
        file_type: fileData?.type || 'image/jpeg',
        original_filename: fileData?.name || 'receipt.jpg',
        extracted_amount: extracted_data.total,
        extracted_date: extracted_data.date,
        extracted_merchant: extracted_data.merchant,
        extracted_payment_method: extracted_data.payment_method,
        has_line_items: !!extracted_data.items && extracted_data.items.length > 0,
        processed: true,
        is_matched: false,
      })
      .select()
      .single();

    const response: UploadReceiptResponse = {
      success: true,
      document_id: document.id,
      file_url: publicUrl || undefined,
    };

    // Process line items if provided
    const unclassifiedProducts: Array<{ line_item_id: string; description: string }> = [];

    if (extracted_data.items && extracted_data.items.length > 0) {
      for (const item of extracted_data.items) {
        // Check if product exists in user's learned products
        const normalizedDesc = item.description.toLowerCase().trim();

        const { data: existingProduct } = await supabaseClient
          .from('products')
          .select('id')
          .eq('user_id', user.id)
          .contains('normalized_names', [normalizedDesc])
          .single();

        // Create line item
        const { data: lineItem } = await supabaseClient
          .from('receipt_line_items')
          .insert({
            document_id: document.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            product_id: existingProduct?.id,
            is_classified: !!existingProduct,
            needs_clarification: !existingProduct,
          })
          .select()
          .single();

        // If not classified, add to unclassified list
        if (!existingProduct) {
          unclassifiedProducts.push({
            line_item_id: lineItem.id,
            description: item.description,
          });
        } else {
          // Add to price history
          await supabaseClient.from('product_price_history').insert({
            product_id: existingProduct.id,
            merchant: extracted_data.merchant,
            price: item.total_price,
            quantity: item.quantity,
            unit_price: item.unit_price || item.total_price / item.quantity,
            receipt_line_item_id: lineItem.id,
            purchased_at: extracted_data.date,
          });
        }
      }

      response.line_items_created = extracted_data.items.length;
      if (unclassifiedProducts.length > 0) {
        response.unclassified_products = unclassifiedProducts;
      }
    }

    // Try to match with existing transactions
    const twoDaysAgo = new Date(extracted_data.date);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAhead = new Date(extracted_data.date);
    twoDaysAhead.setDate(twoDaysAhead.getDate() + 2);

    const { data: matchingTransactions } = await supabaseClient
      .from('transactions')
      .select('id, merchant, amount, date')
      .eq('user_id', user.id)
      .gte('amount', extracted_data.total * 0.99) // Allow 1% variance
      .lte('amount', extracted_data.total * 1.01)
      .gte('date', twoDaysAgo.toISOString().split('T')[0])
      .lte('date', twoDaysAhead.toISOString().split('T')[0]);

    const normalizedMerchant = normalizeMerchant(extracted_data.merchant);
    const match =
      matchingTransactions?.find(
        t => t.merchant && normalizeMerchant(t.merchant).includes(normalizedMerchant.slice(0, 5))
      ) || matchingTransactions?.[0]; // Fallback to first match by amount/date

    if (match) {
      // Mark as matched
      await supabaseClient
        .from('documents')
        .update({ is_matched: true, transaction_id: match.id })
        .eq('id', document.id);

      await supabaseClient
        .from('transactions')
        .update({ is_reconciled: true, reconciled_with: document.id })
        .eq('id', match.id);

      response.matching = {
        found_transaction: true,
        transaction_id: match.id,
        confidence:
          match.merchant && normalizeMerchant(match.merchant) === normalizedMerchant ? 0.95 : 0.75,
      };
    }

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
