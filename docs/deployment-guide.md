# 📝 Deployment Guide - Financial Assistant

Guía paso a paso para desplegar el asistente financiero en Supabase.

## Prerequisites

- [x] Node.js 18+ instalado
- [x] pnpm instalado
- [x] Cuenta de Supabase (gratis en [supabase.com](https://supabase.com))
- [x] Supabase CLI instalado

## Instalación de Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# O con npm global
npm install -g supabase
```

## Paso 1: Setup Local

### 1.1 Configurar Variables de Entorno

Crea el archivo `.env.local` en la raíz del proyecto:

```bash
# Copia las credenciales que ya tienes
NEXT_PUBLIC_SUPABASE_URL="https://bioenchgdmbthnwfctkn.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_anon_key_aqui"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key_aqui"
```

### 1.2 Instalar Dependencias

```bash
pnpm install
```

## Paso 2: Desplegar Base de Datos

### 2.1 Vincular Proyecto

```bash
supabase link --project-ref bioenchgdmbthnwfctkn
```

Te pedirá tu password de la base de datos.

### 2.2 Push Migraciones

```bash
supabase db push
```

Esto creará:
- ✅ 11 tablas (accounts, payment_methods, categories, transactions, documents, etc.)
- ✅ Políticas de Row Level Security (RLS)
- ✅ Índices para performance
- ✅ Triggers para `updated_at`
- ✅ Funciones helper SQL

### 2.3 Verificar Tablas

```bash
supabase db diff
```

Deberías ver que todo está sincronizado.

## Paso 3: Configurar Storage

### 3.1 Crear Buckets

Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/project/bioenchgdmbthnwfctkn/storage/buckets) y crea dos buckets:

1. **receipts**
   - Public: No
   - File size limit: 10 MB
   - Allowed MIME types: `image/jpeg, image/png, application/pdf`

2. **documents**
   - Public: No
   - File size limit: 25 MB
   - Allowed MIME types: `application/pdf`

### 3.2 Configurar Políticas de Storage

Para cada bucket, agrega estas políticas:

**SELECT (Download)**:
```sql
(bucket_id = 'receipts') AND (auth.uid() = (storage.foldername(name))[1])
```

**INSERT (Upload)**:
```sql
(bucket_id = 'receipts') AND (auth.uid() = (storage.foldername(name))[1])
```

**UPDATE**:
```sql
(bucket_id = 'receipts') AND (auth.uid() = (storage.foldername(name))[1])
```

**DELETE**:
```sql
(bucket_id = 'receipts') AND (auth.uid() = (storage.foldername(name))[1])
```

Repite para el bucket `documents`.

## Paso 4: Desplegar Edge Functions

### 4.1 Desplegar Todas las Funciones

```bash
# Desplegar todas de una vez
supabase functions deploy get-financial-summary
supabase functions deploy manage-transaction
supabase functions deploy manage-budget
supabase functions deploy get-budget-status
supabase functions deploy manage-debt
supabase functions deploy upload-receipt
supabase functions deploy classify-products
supabase functions deploy get-price-insights
```

### 4.2 Verificar Deployment

```bash
supabase functions list
```

Deberías ver todas las funciones con status `deployed`.

### 4.3 Probar una Función Localmente (Opcional)

```bash
# Iniciar servidor local
supabase functions serve

# En otra terminal, probar
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/get-financial-summary' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"period": "monthly"}'
```

## Paso 5: Configurar el GPT

Sigue la guía completa en [`/docs/gpt-setup-guide.md`](./gpt-setup-guide.md).

**Resumen rápido**:
1. Ve a ChatGPT → My GPTs → Create
2. Copia el system prompt de la guía
3. Agrega Action con el schema de `/docs/openapi-schema.json`
4. Configura header de Authorization con tu ANON_KEY
5. ¡Prueba!

## Paso 6: Verificación

### 6.1 Test de Base de Datos

Ejecuta este query en el SQL Editor de Supabase:

```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Debería mostrar: accounts, payment_methods, categories, 
-- transactions, documents, receipt_line_items, budgets, debts, 
-- debt_payments, financial_goals, products, merchant_patterns, 
-- product_price_history
```

### 6.2 Test de Edge Functions

Prueba cada función con el GPT:

```
Usuario: "¿Cuál es mi situación financiera?"
Expected: El GPT llama a get-financial-summary

Usuario: "Agrega un gasto de $100 en comida"
Expected: El GPT llama a manage-transaction

Usuario: "¿Cómo va mi presupuesto?"
Expected: El GPT llama a get-budget-status
```

### 6.3 Test de Upload

```
Usuario: *Sube una imagen de ticket*
Expected: El GPT llama a upload-receipt y muestra datos extraídos
```

## Troubleshooting

### Error: "relation does not exist"
- Solución: Corre `supabase db push` nuevamente
- Verifica que estés en el proyecto correcto con `supabase link`

### Error: "RLS policy violation"
- Solución: Verifica que las políticas RLS estén creadas
- Check: `SELECT * FROM pg_policies WHERE schemaname = 'public';`

### Edge Functions no responden
- Verifica deployment: `supabase functions list`
- Revisa logs: `supabase functions logs get-financial-summary`
- Asegúrate que el header Authorization esté configurado

### Storage upload falla
- Verifica que los buckets existan
- Verifica las políticas de storage
- Asegúrate que el tamaño del archivo < límite

## Monitoreo

### Ver Logs de Edge Functions

```bash
supabase functions logs get-financial-summary --tail
```

### Ver Métricas

Ve a Dashboard → Functions → [nombre función] para ver:
- Total invocations
- Errors
- Response times

## Next Steps

1. **Personalizar Categorías**: Agrega categorías personalizadas en la tabla `categories`
2. **Configurar OCR**: Si quieres OCR real, configura Google Vision API
3. **Importación Bancaria**: Implementa `process-document` para PDFs de estados de cuenta
4. **Webhooks**: Conecta con APIs bancarias para importación automática

## Actualizar el Sistema

Cuando hagas cambios:

```bash
# Base de datos
supabase db push

# Edge Functions
supabase functions deploy [function-name]

# Ver diferencias antes de aplicar
supabase db diff
```

## Backup

```bash
# Backup de la base de datos
supabase db dump -f backup.sql

# Restaurar
psql $POSTGRES_URL < backup.sql
```

---

✅ **¡Sistema Desplegado!** Ahora puedes empezar a usar tu asistente financiero.
