# Design: User Dashboard

## Architecture

```
+------------------+     +-------------------+     +----------------+
|  Dashboard Page  |     |  Protected Route  |     |  Auth Context  |
|  /dashboard      |---->|  Wrapper          |---->|  User/Profile  |
+------------------+     +-------------------+     +----------------+
        |                        |
        v                        v
+------------------+     +-------------------+
|  Dashboard       |     |  Subscription     |
|  Components      |     |  Context          |
+------------------+     +-------------------+
        |
        +----> PlanStatusCard
        |        +-- usePlan hook
        |        +-- Plan summary or create CTA
        |
        +----> SubscriptionCard
        |        +-- useSubscription hook
        |        +-- Status, days remaining
        |
        +----> QuickActions
        |        +-- Action grid
        |        +-- Subscription gating
        |
        +----> UserProfile
        |        +-- Avatar, name, email
        |        +-- Settings, logout
        |
        +----> Help Section
                 +-- WhatsApp link
```

## Page Layout

```
+------------------------------------------------------------------+
|  [JCV FITNESS logo/link]                                          |
+------------------------------------------------------------------+
|  Mi Panel                                                         |
|  Gestiona tu plan y suscripcion                                   |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------------------------------+  +--------------+   |
|  |  PlanStatusCard                          |  | UserProfile  |   |
|  |  [Active plan summary or Create CTA]     |  | [Avatar]     |   |
|  +------------------------------------------+  | Name         |   |
|                                                | Email        |   |
|  +------------------------------------------+  |              |   |
|  |  SubscriptionCard                        |  | [Settings]   |   |
|  |  [Plan name, status, days remaining]     |  | [Logout]     |   |
|  +------------------------------------------+  +--------------+   |
|                                                                   |
|  Acciones rapidas                              +--------------+   |
|  +----------------------+  +------------------+| Help Section |   |
|  | Mi Plan Alimenticio  |  | Mi Rutina        || Necesitas    |   |
|  | [icon] description   |  | [icon] desc      || ayuda?       |   |
|  +----------------------+  +------------------+|              |   |
|  +----------------------+  +------------------+| [WhatsApp]   |   |
|  | Descargar PDF        |  | Contactar        |+--------------+   |
|  | [icon] description   |  | [icon] desc      |                   |
|  +----------------------+  +------------------+                   |
|                                                                   |
+------------------------------------------------------------------+
```

## Component Design

### Dashboard Page (`/src/app/dashboard/page.tsx`)

**Structure:**
```tsx
<ProtectedRoute>
  <div className="min-h-screen bg-black py-8 px-4">
    <div className="max-w-4xl mx-auto">
      {/* Header with logo */}
      {/* Title section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <PlanStatusCard />
          <SubscriptionCard />
          <QuickActions />
        </div>
        {/* Sidebar (1 col) */}
        <div className="space-y-6">
          <UserProfile />
          <HelpSection />
        </div>
      </div>
    </div>
  </div>
</ProtectedRoute>
```

### PlanStatusCard

**States:**
1. **Loading**: Skeleton animation
2. **Has Plan**: Shows plan summary, "Ver mi plan" link
3. **No Plan**: Shows "Crear mi plan" CTA

**Content (Has Plan):**
```
+------------------------------------------+
| Tu Plan de Entrenamiento                 |
| Nivel: Intermedio | Objetivo: Ganar      |
| Dias restantes: 25                       |
|                                          |
| [Ver mi plan]                            |
+------------------------------------------+
```

**Content (No Plan):**
```
+------------------------------------------+
| No tienes un plan activo                 |
| Crea tu primer plan personalizado        |
|                                          |
| [Crear mi plan ->]                       |
+------------------------------------------+
```

### SubscriptionCard

**States:**
1. **Loading**: Skeleton animation
2. **Active**: Plan name, status badge, expiration
3. **Expiring Soon**: Yellow warning (< 7 days)
4. **No Subscription**: CTA to pricing

**Content (Active):**
```
+------------------------------------------+
| [check icon] Plan Pro                    |
| Suscripcion activa         [Activo badge]|
|                                          |
| Vence: 15 de marzo, 2026                 |
| Dias restantes: 25 dias                  |
|                                          |
| [Cambiar plan]                           |
+------------------------------------------+
```

**Content (Expiring):**
```
+------------------------------------------+
| [warning banner]                         |
| Tu suscripcion esta por vencer           |
| Renueva para no perder acceso            |
|                                          |
| [Renovar ahora]                          |
+------------------------------------------+
```

### QuickActions

**Actions Configuration:**
```typescript
const actions = [
  {
    title: "Mi Plan Alimenticio",
    description: "Ver tu plan de comidas personalizado",
    href: "/plan/alimentacion",
    icon: ClipboardIcon,
    color: "cyan",
    requiresSubscription: true,
  },
  {
    title: "Mi Rutina",
    description: "Accede a tus ejercicios diarios",
    href: "/plan/ejercicios",
    icon: BoltIcon,
    color: "purple",
    requiresSubscription: true,
  },
  {
    title: "Descargar PDF",
    description: "Descarga tu plan completo",
    href: "/plan/download",
    icon: DocumentIcon,
    color: "green",
    requiresSubscription: true,
  },
  {
    title: "Contactar Soporte",
    description: "Habla con un asesor",
    href: "https://wa.me/573143826430",
    icon: ChatIcon,
    color: "green",
    requiresSubscription: false,
    external: true,
  },
];
```

**Subscription Gating:**
- If `requiresSubscription && !hasActiveSubscription`:
  - Reduce opacity (50%)
  - Show "Requiere suscripcion activa" message
  - Disable link click

### UserProfile

**Layout:**
```
+-------------------------------------------+
| [Avatar with initials]  Display Name      |
|                         user@email.com    |
|-------------------------------------------|
| [Configuracion]    [Cerrar sesion]        |
+-------------------------------------------+
```

**Avatar Generation:**
```typescript
const initials = displayName
  .split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);
```

### Help Section

```
+-------------------------------------------+
| Necesitas ayuda?                          |
| Nuestro equipo esta disponible para       |
| ayudarte con cualquier pregunta.          |
|                                           |
| [WhatsApp button -> 573143826430]         |
+-------------------------------------------+
```

## Data Flow

```
1. Dashboard page mounts
    |
    v
2. ProtectedRoute checks auth
    |
    +-- Not authenticated --> Redirect to /
    |
    v
3. Components mount in parallel
    |
    +-- PlanStatusCard --> usePlan() --> Supabase
    +-- SubscriptionCard --> useSubscription() --> Profile/Subscriptions
    +-- UserProfile --> useAuth() --> Already loaded
    |
    v
4. Data loads and renders
```

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 1024px) | Single column, stacked |
| Desktop (>= 1024px) | 2:1 grid (main:sidebar) |
