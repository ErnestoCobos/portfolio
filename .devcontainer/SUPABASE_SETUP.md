# 🗄️ Supabase Local Development Setup

Esta guía te ayudará a configurar y usar Supabase localmente en tu DevContainer.

## 📋 Requisitos Previos

- DevContainer iniciado y funcionando
- Supabase CLI instalado (se instala automáticamente)

## 🚀 Primera Configuración

### 1. Inicializar Supabase (Solo la primera vez)

```bash
supabase init
```

Este comando creará:

- `supabase/` - Directorio para migraciones y configuración
- `supabase/config.toml` - Configuración de Supabase local

### 2. Iniciar Supabase Local

```bash
supabase start
```

Este comando iniciará todos los servicios de Supabase:

- ✅ PostgreSQL Database
- ✅ Kong API Gateway
- ✅ Studio (Admin UI)
- ✅ Auth Service
- ✅ Realtime Service
- ✅ Storage Service
- ✅ Inbucket (Email Testing)

**Importante:** La primera vez puede tardar varios minutos descargando las imágenes Docker.

### 3. Obtener Credenciales

Después de `supabase start`, verás:

```bash
supabase status
```

Esto mostrará:

```
API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324

anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔧 Configuración de Variables de Entorno

Tu archivo `.env.local` ya tiene las configuraciones por defecto:

```env
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Estas claves son estáticas para desarrollo local y son seguras de commitear.

## 📦 Storage (Buckets)

### Crear un Bucket

```bash
# Crear bucket público
supabase storage create avatars --public

# Crear bucket privado
supabase storage create documents
```

### Listar Buckets

```bash
supabase storage ls
```

### Configurar Bucket desde Studio

1. Abre http://127.0.0.1:54323
2. Ve a "Storage"
3. Click en "Create Bucket"
4. Configura:
   - Nombre del bucket
   - Público/Privado
   - Allowed MIME types
   - File size limit

### Usar Storage en tu App

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Upload file
const { data, error } = await supabase.storage.from('avatars').upload('user-123.png', file);

// Get public URL
const {
  data: { publicUrl },
} = supabase.storage.from('avatars').getPublicUrl('user-123.png');
```

## 📧 Email Testing con Inbucket

Supabase local usa Inbucket para capturar emails.

### Acceder a Inbucket

- **Web UI**: http://127.0.0.1:54324
- **SMTP**: 127.0.0.1:54325

### Ver Emails de Confirmación

1. Registra un usuario desde tu app
2. Abre http://127.0.0.1:54324
3. Verás el email de confirmación
4. Click en el link de confirmación

### Configuración SMTP

Ya está configurado en `.env.local`:

```env
INBUCKET_URL=http://127.0.0.1:54324
SMTP_HOST=127.0.0.1
SMTP_PORT=54325
```

## 🗃️ Database Migrations

### Crear Nueva Migración

```bash
supabase migration new create_users_table
```

Esto crea un archivo en `supabase/migrations/`

### Ejemplo de Migración

```sql
-- supabase/migrations/20240101000000_create_users_table.sql
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);
```

### Aplicar Migraciones

```bash
# Las migraciones se aplican automáticamente al iniciar
supabase start

# O resetea la base de datos
supabase db reset
```

### Generar Tipos TypeScript

```bash
supabase gen types typescript --local > types/supabase.ts
```

## 🔐 Auth Configuration

### Configurar Providers

Edita `supabase/config.toml`:

```toml
[auth.external.github]
enabled = true
client_id = "your-github-client-id"
secret = "your-github-secret"
redirect_uri = "http://localhost:3000/auth/callback"

[auth.external.google]
enabled = true
client_id = "your-google-client-id"
secret = "your-google-secret"
```

### Email Templates

Personaliza emails en Studio:

1. http://127.0.0.1:54323
2. Authentication → Email Templates

## 📊 Comandos Útiles

```bash
# Iniciar Supabase
supabase start

# Ver estado y credenciales
supabase status

# Detener Supabase
supabase stop

# Detener y eliminar volúmenes
supabase stop --no-backup

# Ver logs
supabase logs

# Resetear base de datos
supabase db reset

# Push a producción
supabase db push

# Link a proyecto en Supabase Cloud
supabase link --project-ref your-project-ref
```

## 🌐 URLs de Servicios

| Servicio   | URL                                                     | Descripción  |
| ---------- | ------------------------------------------------------- | ------------ |
| API (Kong) | http://127.0.0.1:54321                                  | REST API     |
| GraphQL    | http://127.0.0.1:54321/graphql/v1                       | GraphQL API  |
| Studio     | http://127.0.0.1:54323                                  | Admin UI     |
| PostgreSQL | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct DB    |
| Storage    | http://127.0.0.1:54321/storage/v1                       | File Storage |
| Inbucket   | http://127.0.0.1:54324                                  | Email UI     |

## 🔍 Debugging

### Ver Logs en Tiempo Real

```bash
# Todos los servicios
supabase logs

# Solo database
supabase logs db

# Solo API
supabase logs api
```

### Conectar con Cliente PostgreSQL

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Backup Local

```bash
# Crear backup
supabase db dump -f backup.sql

# Restaurar
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < backup.sql
```

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Auth Guide](https://supabase.com/docs/guides/auth)

## ⚠️ Notas Importantes

1. **Datos Locales**: Los datos en Supabase local NO se sincronizan con producción
2. **Migraciones**: Commitea tus migraciones en `supabase/migrations/` al repo
3. **Configuración**: El `config.toml` puede contener secretos, usa variables de entorno
4. **Buckets**: Los buckets creados localmente no existen en producción, créalos manualmente
5. **Performance**: Primera vez puede ser lento, subsecuentes son rápidos

## 🆘 Problemas Comunes

### Puerto 54321 ya en uso

```bash
# Detener Supabase
supabase stop

# O encuentra el proceso
lsof -ti:54321 | xargs kill -9
```

### Servicios no inician

```bash
# Detener todo
supabase stop --no-backup

# Limpiar Docker
docker system prune -a

# Reiniciar
supabase start
```

### Credenciales no coinciden

```bash
# Verificar credenciales actuales
supabase status

# Actualizar .env.local con las correctas
```
