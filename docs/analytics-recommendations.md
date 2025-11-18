# 📊 Analytics & Monitoring Recomendaciones

## Oportunidades de Analytics Identificadas

Mientras implementaba el sistema, identifiqué varias áreas donde analytics mejorarían significativamente la experiencia:

---

## 1. 📈 Analytics de Uso del Sistema

### ¿Qué rastrear?

#### Edge Functions Metrics
- **Invocaciones por función** - Qué funciones se usan más
- **Tiempos de respuesta** - Performance monitoring
- **Tasa de errores** - Reliability tracking
- **Uso por hora del día** - Patrones de uso

#### User Engagement
- **DAU/MAU** (Daily/Monthly Active Users)
- **Funciones más usadas por usuario**
- **Tiempo promedio de sesión con el GPT**
- **Frecuencia de uploads de recibos**

### Herramientas Recomendadas

**Opción 1: Supabase Analytics** (Built-in)
- ✅ Ya incluido gratis
- ✅ Métricas básicas de Edge Functions
- ✅ Database performance insights
- ❌ Limitado en customización

**Opción 2: PostHog** (Recomendado)
- ✅ Open source analytics
- ✅ Event tracking customizable
- ✅ Session recording
- ✅ Free tier generoso
- Implementación: `npm install posthog-js`

**Opción 3: Vercel Analytics**
- ✅ Si despliegas en Vercel
- ✅ Métricas de performance automáticas
- ✅ Fácil integración con Next.js

### Implementación Ejemplo

```typescript
// supabase/functions/_shared/analytics.ts
export async function trackEvent(
  eventName: string,
  userId: string,
  properties: Record<string, any> = {}
) {
  // Log to PostHog, Mixpanel, or custom endpoint
  await fetch('https://analytics-endpoint/track', {
    method: 'POST',
    body: JSON.stringify({
      event: eventName,
      user_id: userId,
      properties,
      timestamp: new Date().toISOString()
    })
  })
}

// Uso en Edge Functions
await trackEvent('transaction_created', user.id, {
  type: 'expense',
  amount: 500,
  category: 'Comida'
})
```

---

## 2. 💰 Financial Insights & Reporting

### Analytics Financieras Adicionales

Estas NO existen aún pero serían muy valiosas:

#### Spending Patterns
- **Gastos por día de la semana** - "Gastas más los viernes"
- **Gastos por hora del día** - "Tus compras más grandes son entre 2-4pm"
- **Comercios más frecuentados** - "Has ido a Oxxo 23 veces este mes"
- **Categorías con mayor crecimiento** - "Comida subió 15% vs mes pasado"

#### Predictive Analytics
- **Proyección de gastos del mes** - "A este ritmo gastarás $18,500"
- **Predicción de fin de presupuesto** - "Te quedas sin presupuesto de Comida el día 22"
- **Alertas proactivas** - "Gastos inusuales detectados en Entretenimiento"

#### Comparative Analytics
- **Comparación mes a mes** - Gráficas de tendencias
- **Promedio vs actual** - "Este mes gastas 20% más que tu promedio"
- **Benchmarking por categoría** - Comparar con promedios generales

### Nueva Edge Function Sugerida

```typescript
// supabase/functions/get-spending-patterns/index.ts
// Retorna patrones y analytics profundos
{
  "day_of_week_spending": {
    "monday": 850,
    "friday": 2100, // ← Mayor gasto
    "sunday": 450
  },
  "hourly_patterns": {
    "14-16": { avg: 450, count: 12 } // ← Hora pico
  },
  "merchant_frequency": [
    { merchant: "Oxxo", visits: 23, total_spent: 3200 }
  ],
  "category_growth": {
    "Comida": { current: 5200, previous: 4500, change_percent: 15.6 }
  },
  "predictions": {
    "month_end_total": 18500,
    "days_until_budget_exceeded": {
      "Comida": 8
    }
  }
}
```

---

## 3. 🤖 GPT Conversation Analytics

### Métricas del Chatbot

- **Intenciones más comunes** - Qué pregunta más el usuario
- **Tasa de resolución** - ¿El GPT respondió correctamente?
- **Prompts que causan errores** - Debugging conversacional
- **Funciones que requieren múltiples intentos** - UX issues

### Implementación

Agregar logging en cada Edge Function:

```typescript
await logConversation({
  user_id: user.id,
  function_called: 'manage-transaction',
  success: true,
  response_time_ms: 234,
  user_intent: 'add_expense' // Inferido del request
})
```

---

## 4. 📸 Receipt Processing Analytics

### OCR Performance Tracking

- **Tasa de éxito de OCR** - % de recibos procesados correctamente
- **Campos extraídos correctamente** - Amount: 95%, Date: 98%, Merchant: 80%
- **Productos que requieren clarificación** - Top 10 productos confusos
- **Tiempo promedio de procesamiento** - Performance del OCR

### Product Learning Analytics

- **Productos aprendidos por mes** - Crecimiento del catálogo
- **Variaciones de nombres por producto** - Ej: "Coca" → ["coca", "coca-cola", "COCA 600ML"]
- **Tasa de reconocimiento automático** - Mejora con el tiempo

---

## 5. 🎯 Goal & Budget Tracking

### Alertas Automáticas

Crear sistema de notificaciones:

- ⚠️ "Has usado 80% de tu presupuesto de Comida"
- 🎉 "¡Felicidades! Ahorraste $2,000 este mes"
- 📉 "Tus gastos bajaron 15% vs mes pasado"
- 💳 "Vence el pago mínimo de BBVA en 3 días"

### Nueva Tabla Sugerida

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT, -- 'budget_warning', 'goal_reached', etc.
  event_data JSONB,
  triggered_at TIMESTAMPTZ,
  read BOOLEAN DEFAULT false
);
```

---

## 6. 💡 Price Intelligence

### Analytics de Precios (Ya parcialmente implementado)

Mejorar `get-price-insights` con:

- **Inflation tracking** - "Tus productos subieron 8% en promedio"
- **Best time to buy** - "Histórico: Coca Cola más barata los martes"
- **Merchant comparison** - "Podrías ahorrar $450/mes comprando en Walmart vs Oxxo"
- **Seasonal trends** - "Aguacates suben 30% en diciembre"

---

## 7. 📊 Dashboard & Reporting

### Reportes Automáticos

Generar PDFs/emails mensuales:

```
📊 Reporte Financiero - Noviembre 2025

💰 Resumen
- Ingresos: $30,000
- Gastos: $18,500
- Ahorro: $11,500 (38%)

📈 Top 3 Categorías
1. Comida: $5,200 (28% del total)
2. Transporte: $3,800
3. Entretenimiento: $2,100

⚠️ Alertas
- Comida excedió presupuesto en $200
- 3 productos subieron más de 10%

🎯 Metas
- Fondo emergencia: 65% completado
```

### Nueva Edge Function

```typescript
// supabase/functions/generate-monthly-report/index.ts
// Se ejecuta automáticamente el día 1 de cada mes
// O se puede llamar manualmente
```

---

## 8. 🔐 Security & Fraud Detection

### Anomaly Detection

- **Gastos inusuales** - "Gasto de $5,000 en Electrónica (tu promedio es $200)"
- **Patrones sospechosos** - Múltiples transacciones pequeñas en poco tiempo
- **Merchant verification** - "Primera vez que compras en esta tienda"

---

## Prioridades de Implementación

### 🟢 Alta Prioridad (Implementar Ya)
1. ✅ Edge Functions logging básico (Supabase Analytics)
2. ⬜ Spending patterns analytics
3. ⬜ Budget alerts system
4. ⬜ Monthly reports

### 🟡 Media Prioridad (Dentro de 1-2 meses)
1. ⬜ PostHog integration para event tracking
2. ⬜ OCR performance metrics
3. ⬜ Predictive analytics (proyecciones)
4. ⬜ Price intelligence mejorado

### 🔵 Baja Prioridad (Nice to have)
1. ⬜ Conversation analytics
2. ⬜ Anomaly detection
3. ⬜ Seasonal trends
4. ⬜ Benchmarking vs otros usuarios (agregado)

---

## Costos Estimados

### Free Tier (Opción gratuita)
- Supabase Analytics: ✅ Incluido
- PostHog Free: ✅ 1M eventos/mes
- **Costo: $0/mes**

### Paid Tier (Producción escalada)
- Supabase Pro: $25/mes
- PostHog Growth: ~$20/mes
- **Costo total: ~$45/mes**

---

## Código de Setup Rápido

### 1. Agregar Logging a Edge Functions

```typescript
// En cada Edge Function
const startTime = Date.now()

try {
  // ... lógica de la función
  
  await logMetric({
    function: 'manage-transaction',
    user_id: user.id,
    success: true,
    duration_ms: Date.now() - startTime
  })
} catch (error) {
  await logMetric({
    function: 'manage-transaction',
    user_id: user.id,
    success: false,
    duration_ms: Date.now() - startTime,
    error: error.message
  })
}
```

### 2. Crear tabla de métricas

```sql
CREATE TABLE function_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  function_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  success BOOLEAN,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_function ON function_metrics(function_name, created_at DESC);
```

---

## Resumen

**Analytics que agregaría YA:**
1. ✅ Logging básico en Edge Functions
2. ✅ Spending patterns function
3. ✅ Budget alerts
4. ✅ Metrics table en DB

**Analytics para después:**
- PostHog integration
- Predictive analytics
- Automated reports
- Fraud detection

¿Quieres que implemente alguno de estos ahora?
