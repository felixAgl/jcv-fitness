# PRD: Sistema de Suscripciones JCV Fitness

## Resumen Ejecutivo

Sistema de monetización para JCV Fitness que protege el contenido generado (planes de entrenamiento y nutrición) mediante suscripciones con expiración. Los usuarios completan el wizard, pagan, crean cuenta y acceden a su plan personalizado durante el período contratado.

---

## Objetivos

1. **Monetizar el contenido**: Solo usuarios que pagaron pueden acceder al PDF/plan
2. **Proteger contra piratería**: PDFs con watermark, sin URLs públicas, generación server-side
3. **Suscripciones con expiración**: Planes de 1, 2 o 3 meses que expiran automáticamente
4. **Experiencia fluida**: Wizard → Pago → Cuenta → Acceso inmediato

---

## Stack Técnico

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Auth | Supabase Auth | Magic links, OAuth, gratis |
| Database | Supabase PostgreSQL | RLS, gratis 500MB |
| Storage | Supabase Storage | PDFs temporales si necesario |
| Edge Functions | Supabase Edge Functions | Generación PDF server-side |
| Frontend | Next.js (existente) | Ya en uso |
| Pagos | MercadoPago (existente) | Ya integrado |

---

## Arquitectura de Base de Datos

### Tabla: `profiles` (extiende auth.users)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `subscriptions`
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basico', 'pro', 'premium')),
  duration_months INTEGER NOT NULL CHECK (duration_months IN (1, 2, 3)),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  payment_id TEXT,
  payment_provider TEXT CHECK (payment_provider IN ('mercadopago', 'wompi')),
  amount_paid INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `wizard_data`
```sql
CREATE TABLE wizard_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  level TEXT NOT NULL,
  goal TEXT NOT NULL,
  time_minutes INTEGER NOT NULL,
  equipment TEXT[] NOT NULL,
  duration TEXT NOT NULL,
  selected_exercises TEXT[],
  selected_foods TEXT[],
  user_body_data JSONB,
  generated_plan JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subscription_id)
);
```

### Tabla: `plan_downloads`
```sql
CREATE TABLE plan_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  download_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS)

```sql
-- Profiles: usuarios solo ven su perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Subscriptions: usuarios solo ven sus suscripciones
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Wizard data: usuarios solo ven sus datos
ALTER TABLE wizard_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wizard data" ON wizard_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wizard data" ON wizard_data FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Plan downloads: usuarios solo ven sus descargas
ALTER TABLE plan_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own downloads" ON plan_downloads FOR SELECT USING (auth.uid() = user_id);
```

---

## Flujo de Usuario

### Fase 1: Wizard (sin auth)
```
1. Usuario llega a /wizard
2. Completa todos los pasos del wizard
3. Al final, ve resumen y precios
4. Selecciona plan (1, 2 o 3 meses)
5. Click en "Pagar"
```

### Fase 2: Pago
```
1. Se guarda wizard data en localStorage (ya existe)
2. Redirige a MercadoPago/Wompi
3. Usuario paga
4. Webhook recibe confirmación
5. Redirige a /payment/success?payment_id=XXX
```

### Fase 3: Creación de Cuenta
```
1. /payment/success detecta que no hay sesión
2. Muestra form de registro (email ya prellenado si vino del pago)
3. Usuario ingresa email y contraseña (o magic link)
4. Se crea cuenta en Supabase Auth
5. Trigger crea profile automáticamente
6. Se crea subscription con status 'active'
7. Se migra wizard_data de localStorage a DB
8. Redirige a /dashboard
```

### Fase 4: Acceso al Plan
```
1. Usuario en /dashboard ve su plan activo
2. Click en "Ver mi plan" o "Descargar PDF"
3. Backend verifica:
   - Usuario autenticado
   - Suscripción activa (end_date > now)
4. Si válido: genera/muestra plan
5. Si expirado: muestra mensaje y opción de renovar
```

---

## Endpoints API

### POST /api/auth/register
Crea cuenta después del pago.
```typescript
Request:
{
  email: string,
  password: string,
  paymentId: string,
  wizardData: WizardState
}

Response:
{
  user: { id, email },
  subscription: { id, endDate, planType }
}
```

### GET /api/subscription/status
Verifica estado de suscripción.
```typescript
Response:
{
  hasActiveSubscription: boolean,
  subscription?: {
    planType: string,
    endDate: string,
    daysRemaining: number
  }
}
```

### GET /api/plan/access
Verifica si puede acceder al plan.
```typescript
Response:
{
  canAccess: boolean,
  reason?: 'no_subscription' | 'expired' | 'not_authenticated',
  expiresAt?: string
}
```

### POST /api/plan/generate-pdf
Genera PDF con watermark.
```typescript
Response: PDF binary con headers
Content-Type: application/pdf
Content-Disposition: attachment; filename="plan-jcv-fitness.pdf"
X-Watermark: "Licenciado a: user@email.com - Válido hasta: 2024-03-15"
```

### POST /api/webhooks/mercadopago
Webhook para confirmar pagos.
```typescript
Request: MercadoPago webhook payload
Action: Actualiza subscription.status = 'active'
```

---

## Componentes Frontend

### Nuevas Páginas
- `/dashboard` - Panel del usuario con su plan
- `/login` - Login para usuarios existentes
- `/register` - Registro post-pago
- `/plan` - Vista del plan (protegida)
- `/plan/expired` - Plan expirado, renovar

### Nuevos Componentes
- `AuthProvider` - Contexto de autenticación Supabase
- `ProtectedRoute` - HOC para rutas protegidas
- `SubscriptionStatus` - Muestra días restantes
- `PlanViewer` - Muestra el plan generado
- `LoginForm` - Formulario de login
- `RegisterForm` - Formulario de registro
- `DashboardLayout` - Layout del dashboard

### Modificaciones Existentes
- `CheckoutModal` - Agregar email antes de pago
- `PaymentSuccess` - Flujo de registro post-pago
- `WizardSummary` - Mostrar que requiere cuenta

---

## Seguridad

### Protección del PDF
1. **Nunca URLs públicas**: PDFs generados on-demand, nunca almacenados públicamente
2. **Watermark dinámico**: Email + fecha de expiración en cada página
3. **Tokens únicos**: Cada descarga genera token único registrado
4. **Rate limiting**: Máximo 5 descargas por día
5. **Logging**: Toda descarga registrada con IP y user agent

### Protección de Rutas
1. **Middleware**: Verificar JWT en cada request a /api/plan/*
2. **RLS**: Base de datos protegida a nivel de fila
3. **CORS**: Solo orígenes permitidos

---

## Cron Jobs

### Expirar Suscripciones (diario)
```sql
UPDATE subscriptions
SET status = 'expired', updated_at = NOW()
WHERE status = 'active' AND end_date < NOW();
```

### Enviar Recordatorio (3 días antes)
```typescript
// Edge function que envía email
// "Tu plan JCV Fitness expira en 3 días"
```

---

## TODO - Implementación

### Fase 1: Setup Supabase
- [ ] Crear proyecto en Supabase
- [ ] Configurar variables de entorno
- [ ] Crear tablas SQL
- [ ] Configurar RLS policies
- [ ] Crear trigger para profiles

### Fase 2: Autenticación
- [ ] Instalar @supabase/supabase-js y @supabase/ssr
- [ ] Crear cliente Supabase (client + server)
- [ ] Crear AuthProvider context
- [ ] Implementar LoginForm
- [ ] Implementar RegisterForm
- [ ] Crear middleware de autenticación
- [ ] Implementar ProtectedRoute HOC

### Fase 3: Sistema de Suscripciones
- [ ] Crear API /api/subscription/status
- [ ] Crear API /api/subscription/create
- [ ] Modificar webhook MercadoPago para crear suscripción
- [ ] Crear SubscriptionStatus component
- [ ] Implementar lógica de expiración

### Fase 4: Dashboard
- [ ] Crear página /dashboard
- [ ] Crear DashboardLayout
- [ ] Mostrar estado de suscripción
- [ ] Mostrar resumen del plan
- [ ] Botón para ver/descargar plan

### Fase 5: Protección del Plan
- [ ] Crear API /api/plan/access
- [ ] Crear API /api/plan/generate-pdf (básico, sin PDF real aún)
- [ ] Crear PlanViewer component
- [ ] Implementar watermark en vista web
- [ ] Crear página /plan/expired

### Fase 6: Flujo Post-Pago
- [ ] Modificar CheckoutModal para capturar email
- [ ] Modificar PaymentSuccess para flujo de registro
- [ ] Migrar wizard data de localStorage a DB
- [ ] Crear cuenta y suscripción automáticamente

### Fase 7: Testing & Polish
- [ ] Probar flujo completo wizard → pago → registro → dashboard
- [ ] Probar expiración de suscripción
- [ ] Probar renovación
- [ ] Probar login de usuario existente
- [ ] Verificar RLS funciona correctamente

---

## Variables de Entorno Nuevas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx (solo server-side)

# Opcional: Email
RESEND_API_KEY=re_xxx (para emails de recordatorio)
```

---

## Estimación

| Fase | Complejidad | Archivos |
|------|-------------|----------|
| 1. Setup Supabase | Baja | 3-4 |
| 2. Autenticación | Media | 8-10 |
| 3. Suscripciones | Media | 5-6 |
| 4. Dashboard | Media | 4-5 |
| 5. Protección Plan | Alta | 5-6 |
| 6. Flujo Post-Pago | Alta | 4-5 |
| 7. Testing | Media | 0 (testing) |

**Total estimado**: ~35-40 archivos nuevos/modificados

---

## Notas Importantes

1. **Next.js Static Export**: Actualmente el proyecto usa `output: "export"`. Para APIs server-side necesitamos:
   - Opción A: Cambiar a Next.js con server (Vercel/Node)
   - Opción B: Usar Supabase Edge Functions para toda la lógica
   - **Recomendación**: Opción B - mantener static export y usar Supabase para backend

2. **PDF Generation**: Para MVP, el "PDF" puede ser una página web protegida que el usuario puede imprimir. La generación real de PDF puede venir después con una librería como `@react-pdf/renderer`.

3. **Webhook MercadoPago**: Ya existe el worker de Cloudflare. Necesitamos agregar lógica para crear suscripción en Supabase.
