# 🏦 Financial Assistant - AI-Powered Personal Finance Manager

Tu asistente financiero personal impulsado por ChatGPT y Supabase. Rastrea gastos, presupuestos, deudas, y aprende de tus patrones de gasto.

## ✨ Features

- 💰 **Expense & Income Tracking** - Registra transacciones fácilmente
- 📊 **Budget Management** - Presupuestos mensuales con alertas
- 📸 **Receipt OCR** - Sube fotos de tickets para procesamiento automático
- 🏪 **Product-Level Tracking** - Aprende productos y detecta cambios de precios
- 🤖 **Smart Reconciliation** - Empareja recibos con transacciones bancarias automáticamente
- 💳 **Payment Pattern Learning** - Aprende qué tarjeta usas en cada comercio
- 📈 **Price Insights** - Compara precios entre comercios y detecta incrementos
- 💸 **Debt Tracking** - Gestiona tarjetas de crédito, préstamos, hipotecas
- 🎯 **Financial Goals** - Rastrea objetivos de ahorro

## 🏗️ Architecture

```
ChatGPT GPT → Supabase Edge Functions → PostgreSQL + Storage
```

- **Frontend**: ChatGPT GPT con Actions API
- **Backend**: Supabase Edge Functions (Deno/TypeScript)
- **Database**: PostgreSQL con Row Level Security
- **Storage**: Supabase Storage para recibos y documentos
- **Framework**: Next.js 16 (para futuro dashboard web)

## 📁 Project Structure

```
portfolio/
├── supabase/
│   ├── functions/              # 8 Edge Functions for GPT Actions
│   │   ├── get-financial-summary/
│   │   ├── manage-transaction/
│   │   ├── manage-budget/
│   │   ├── get-budget-status/
│   │   ├── manage-debt/
│   │   ├── upload-receipt/
│   │   ├── classify-products/
│   │   └── get-price-insights/
│   ├── migrations/             # Database schema & seeds
│   │   ├── 20251118_initial_schema.sql
│   │   ├── 20251118_seed_categories.sql
│   │   └── 20251118_helper_functions.sql
│   └── config.toml             # Local dev configuration
├── lib/
│   └── supabase.ts             # TypeScript client
├── docs/
│   ├── openapi-schema.json     # GPT Actions schema
│   ├── gpt-setup-guide.md      # How to configure GPT
│   └── deployment-guide.md     # Deployment instructions
└── .env.local                  # Environment variables (not in git)
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- pnpm
- Supabase account ([free tier](https://supabase.com))
- ChatGPT Plus/Team account
- Supabase CLI: `npm install -g supabase`

### 2. Setup

```bash
# Install dependencies
pnpm install

# Link to Supabase project
supabase link --project-ref bioenchgdmbthnwfctkn

# Push database schema
supabase db push

# Deploy Edge Functions
supabase functions deploy get-financial-summary
supabase functions deploy manage-transaction
supabase functions deploy manage-budget
supabase functions deploy get-budget-status
supabase functions deploy manage-debt
supabase functions deploy upload-receipt
supabase functions deploy classify-products
supabase functions deploy get-price-insights
```

### 3. Configure Storage

Create two buckets in [Supabase Dashboard](https://app.supabase.com):
- `receipts` - For receipt images (max 10MB)
- `documents` - For bank statements (max 25MB)

### 4. Configure ChatGPT GPT

Follow the comprehensive guide: [`docs/gpt-setup-guide.md`](./docs/gpt-setup-guide.md)

## 📖 Documentation

- [**Deployment Guide**](./docs/deployment-guide.md) - Step-by-step deployment
- [**GPT Setup Guide**](./docs/gpt-setup-guide.md) - Configure ChatGPT GPT
- [**Supabase README**](./supabase/README.md) - Database & Functions overview
- [**Walkthrough**](/.gemini/antigravity/brain/078a58b0-3d79-4865-bd71-de9593ffc03d/walkthrough.md) - Complete implementation details

## 💡 Usage Examples

### With GPT

```
You: "¿Cuál es mi situación financiera?"
GPT: "Tu balance total es $50,234 MXN..."

You: "Agrega un gasto de $500 en comida"
GPT: "✓ Gasto registrado: $500 en Comida"

You: *uploads receipt photo*
GPT: "✓ Procesé tu ticket de Oxxo por $87.50..."

You: "¿Qué productos han subido de precio?"
GPT: "Coca Cola 600ml subió $2.50 (16%) en Oxxo..."
```

## 🗄️ Database Schema

11 tables with full RLS:
- `accounts` - Bank accounts
- `payment_methods` - Cards, cash, etc.
- `categories` - Expense/income categories
- `transactions` - All transactions
- `documents` - Uploaded receipts/PDFs
- `receipt_line_items` - Individual items from receipts
- `products` - Personal product catalog
- `product_price_history` - Price tracking
- `merchant_patterns` - Payment method learning
- `budgets` - Monthly/yearly budgets
- `debts` + `debt_payments` - Debt tracking
- `financial_goals` - Savings goals

## 🔐 Security

- **Row Level Security (RLS)** on all tables
- JWT-based authentication via Edge Functions
- Private storage with user-scoped access
- Separate API keys for client vs server

## 🛠️ Development

```bash
# Run Next.js dev server
pnpm dev

# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# View function logs
supabase functions logs get-financial-summary --tail
```

## 📊 Tech Stack

- **Frontend**: ChatGPT GPT, Next.js 16, React 19
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Styling**: TailwindCSS 4
- **Language**: TypeScript 5

## 🔮 Future Enhancements

- [ ] Google Vision API integration for real OCR
- [ ] PDF bank statement processing
- [ ] Mobile app (iOS/Android)
- [ ] Webhook integrations with banks
- [ ] Machine learning for auto-categorization
- [ ] Web dashboard for visualizations
- [ ] Multi-currency support
- [ ] Recurring transaction detection

## 📝 License

Private project - All rights reserved

## 🤝 Contributing

This is a personal project. Not accepting contributions at this time.

---

**Built with ❤️ using Supabase, ChatGPT, and Next.js**

For support or questions, refer to the [documentation](./docs/) or open an issue.
