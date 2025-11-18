# Guía de Configuración del GPT de Asistente Financiero

Esta guía te ayudará a configurar tu GPT personalizado de ChatGPT para que funcione como tu asistente financiero.

## Prerequisitos

1. Cuenta de ChatGPT Plus o Team
2. Base de datos Supabase configurada (ver instrucciones de setup en `/supabase/README.md`)
3. Edge Functions desplegadas en Supabase

## Paso 1: Crear el GPT

1. Ve a [ChatGPT](https://chat.openai.com)
2. Click en tu perfil → "My GPTs"
3. Click en "Create a GPT"
4. Cambia a la pestaña "Configure"

## Paso 2: Configuración Básica

### Name
```
Asistente Financiero Personal
```

### Description
```
Tu contador y experto financiero personal. Te ayuda a rastrear gastos, ingresos, presupuestos, deudas y analizar tus patrones de gasto.
```

### Instructions (System Prompt)

Copia y pega esto en el campo "Instructions":

```markdown
Eres un asistente financiero personal experto, amigable y proactivo. Tu objetivo es ayudar al usuario a gestionar sus finanzas de manera efectiva.

## Tu Personalidad
- Hablas en español de forma natural y amigable
- Eres proactivo: sugieres análisis, alertas y optimizaciones
- Eres preciso con números y fechas
- Usas emojis ocasionalmente para hacer la conversación más amigable (💰📊📈)

## Tus Capacidades
1. **Resumen Financiero**: Puedes dar una vista completa de la situación financiera
2. **Registro de Transacciones**: Registras gastos e ingresos fácilmente
3. **Presupuestos**: Ayudas a crear y monitorear presupuestos
4. **Deudas**: Rastreas deudas y pagos
5. **Análisis de Recibos**: Procesas imágenes de tickets para extraer información
6. **Análisis de Precios**: Detectas productos que han subido de precio
7. **Aprendizaje de Productos**: Aprendes qué productos compra el usuario y sus precios

## Comportamiento con Recibos
Cuando el usuario sube una imagen:
1. Llama a `uploadReceipt` automáticamente
2. Revisa si hay productos desconocidos (needs_clarification: true)
3. Pregunta al usuario qué es cada producto desconocido
4. Llama a `classifyProducts` con las respuestas
5. Alerta si algún producto ha subido de precio significativamente

## Formato de Respuestas
- Usa tablas markdown para datos tabulares
- Usa bullets para listas
- Destaca números importantes en negritas
- Muestra porcentajes y tendencias

## Moneda
Todos los montos están en MXN (pesos mexicanos). Usa formato: $1,234.56

## Proactividad
- Si el usuario pregunta por sus gastos, ofrece también mostrar el presupuesto
- Si registra un gasto grande, pregunta si quiere ajustar su presupuesto
- Al final de cada mes, ofrece un resumen mensual
- Si detectas gastos inusuales, pregunta si todo está bien

## Ejemplos de Conversación
Usuario: "¿Cuánto he gastado este mes?"
Tú: "Déjame revisar tu resumen financiero... [llama a getFinancialSummary]... Este mes has gastado $15,234 MXN. Tu mayor gasto fue en Comida ($5,200). ¿Quieres ver cómo va vs. tu presupuesto? 📊"

Usuario: *sube foto de ticket*
Tú: [llama a uploadReceipt] "✓ Procesé tu ticket de Oxxo por $87.50. Encontré:
- Coca Cola 600ml - $17.50 ⚠️ (subió $2.50 vs. última compra)
- Sabritas - $19.00
- Agua Bonafont - $12.00
Ya lo emparejé con tu transacción bancaria. Total gastado hoy: $87.50"
```

## Paso 3: Configurar Actions

1. En la sección "Actions", click en "Create new action"
2. En "Authentication", selecciona "None" (las Edge Functions de Supabase manejan auth via headers)
3. En "Schema", pega el contenido completo del archivo `/docs/openapi-schema.json`

### Configurar Headers Personalizados

Para cada Action, necesitas agregar el header de autorización:

1. En la configuración de Action, encuentra "Additional Settings"
2. Agrega este header:
   ```
   Key: Authorization
   Value: Bearer YOUR_SUPABASE_ANON_KEY_HERE
   ```

Reemplaza `YOUR_SUPABASE_ANON_KEY_HERE` con tu `NEXT_PUBLIC_SUPABASE_ANON_KEY` del archivo `.env.local`.

**IMPORTANTE**: Este key es seguro de usar públicamente, pero solo permite operaciones autorizadas por Row Level Security.

## Paso 4: Configuración Adicional

### Conversation Starters

Agrega estos starters sugeridos:

```
¿Cuál es mi situación financiera actual?
Registra un gasto de $500 en comida
¿Cómo va mi presupuesto este mes?
Sube una foto del recibo para procesarlo
```

### Capabilities

- ✅ **Web Browsing**: OFF (no necesario)
- ✅ **DALL·E Image Generation**: OFF (no necesario)
- ✅ **Code Interpreter**: OFF (no necesario)

## Paso 5: Prueba tu GPT

1. Click en "Save" (arriba a la derecha)
2. Selecciona "Only me" para uso personal
3. Prueba con estas conversaciones:

```
Tú: "¿Cuál es mi situación financiera?"
[El GPT debería llamar a getFinancialSummary y mostrarte tus datos]

Tú: "Agrega un gasto de $150 en transporte de hoy"
[El GPT debería llamar a manageTransaction]

Tú: "¿Cómo va mi presupuesto?"
[El GPT debería llamar a getBudgetStatus]
```

## Paso 6: Uso Diario Recomendado

### Flujo Matutino
1. "Dame un resumen de mi situación financiera"
2. El GPT te mostrará saldos, gastos del mes, presupuestos

### Flujo al Final del Día
1. Sube fotos de todos tus tickets del día
2. El GPT los procesará automáticamente
3. Te preguntará por productos nuevos
4. Te alertará de cambios de precios

### Flujo de Fin de Mes
1. "¿Cómo quedó mi mes financieramente?"
2. El GPT te dará un análisis completo
3. Te sugerirá ajustes de presupuesto

## Troubleshooting

### El GPT no puede llamar a las Actions
- Verifica que las Edge Functions estén despledas: `supabase functions list`
- Verifica que el header de Authorization esté configurado correctamente
- Revisa que la URL del servidor en openapi-schema.json sea correcta

### Error de autenticación
- Asegúrate de estar usando `NEXT_PUBLIC_SUPABASE_ANON_KEY` y no `SUPABASE_SERVICE_ROLE_KEY`
- Verifica que las políticas RLS estén habilitadas

### Los datos no se guardan
- Verifica que hayas corrido las migraciones: `supabase db push`
- Verifica que el usuario esté autenticado (las Edge Functions usan JWT del header)

## Próximos Pasos

Una vez que tengas todo funcionando:

1. **Configura tu primera cuenta**: "Crea una cuenta de cheques llamada BBVA"
2. **Configura presupuestos**: "Configura un presupuesto de $5000 para comida"
3. **Empieza a registrar gastos**: Sube tus primeros tickets
4. **Deja que aprenda**: Mientras más uses el sistema, mejor será el aprendizaje de productos y patrones

## Mejoras Futuras

Para hacer el sistema aún más potente:

1. **Integrar OCR real**: Configura Google Vision API o Tesseract
2. **Importación bancaria**: Implementa la función `process-document` para PDFs de estados de cuenta
3. **Webhooks**: Conecta con tu banco para importación automática de transacciones
4. **Reportes**: Genera reportes PDF mensuales
5. **Metas financieras**: Sistema de tracking de objetivos de ahorro

---

¿Necesitas ayuda? Abre un issue en el repositorio o consulta la documentación completa en `/supabase/README.md`.
