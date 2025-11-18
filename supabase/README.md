# Supabase Configuration

This directory contains Supabase-related configuration for the Financial Assistant system.

## Directory Structure

```
supabase/
├── migrations/          # SQL migrations for database schema
├── functions/           # Edge Functions (Deno) for GPT Actions API
├── config.toml          # Supabase local development configuration
└── seed.sql            # Optional seed data for testing
```

## Migrations

Database migrations are in `/migrations`:
- `20251118_initial_schema.sql` - Main database schema with 11 tables
- `20251118_seed_categories.sql` - Default expense/income categories

## Edge Functions

Located in `/functions`, each function is a Deno-based serverless API endpoint:
- `get-financial-summary` - Overall financial status
- `manage-transaction` - Add/edit expenses and income
- `upload-receipt` - Process receipt images with OCR
- `classify-products` - Interactive product learning
- `get-price-insights` - Price change analysis
- `manage-budget` - Budget management
- `get-budget-status` - Current budget status
- `manage-debt` - Debt tracking and payments
- `reconcile-transactions` - Match receipts with bank transactions
- `process-document` - Parse bank statements (PDF)

## Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

### 2. Link to your Supabase project

```bash
supabase link --project-ref bioenchgdmbthnwfctkn
```

### 3. Push migrations to your database

```bash
supabase db push
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy
```

## Local Development

Start local Supabase instance:

```bash
supabase start
```

Serve functions locally:

```bash
supabase functions serve
```

## Environment Variables

Edge Functions need these secrets:

```bash
# For OCR (if using Google Vision API)
supabase secrets set GOOGLE_VISION_API_KEY=your_key_here

# Supabase URL and keys are automatically available in Edge Functions
```

## Testing

Test an Edge Function locally:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/get-financial-summary' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"period": "monthly"}'
```
