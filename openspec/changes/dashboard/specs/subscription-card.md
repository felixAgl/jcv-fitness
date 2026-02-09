# Spec: SubscriptionCard Component

## Overview
A card component that displays the user's current subscription status, plan details, and relevant CTAs.

## Requirements

### REQ-1: Data Integration
- **MUST** use useSubscription hook
- **MUST** access profile.has_active_subscription
- **MUST** calculate days remaining
- **MUST** handle loading state

### REQ-2: Active Subscription Display
- **MUST** show plan name
- **MUST** show "Activo" status badge
- **MUST** show expiration date (formatted)
- **MUST** show days remaining
- **MUST** provide "Cambiar plan" link

### REQ-3: Expiration Warning
- **MUST** show warning when daysRemaining <= 7
- **MUST** display orange/yellow styling
- **MUST** show "Renovar ahora" CTA
- **MUST** explain urgency

### REQ-4: No Subscription Display
- **MUST** show "Sin suscripcion activa" message
- **MUST** explain what user is missing
- **MUST** provide "Ver planes" CTA

## State Handling

```typescript
const { subscription, hasActiveSubscription, daysRemaining, isLoading } = useSubscription();
const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription?.plan_type);
const isExpiringSoon = daysRemaining <= 7;
```

## UI States

### Loading
```
+------------------------------------------+
| [skeleton block - 1/3 width] [skeleton]  |
| [skeleton block - 2/3 width]             |
| [skeleton block - 1/2 width]             |
+------------------------------------------+
```

### No Subscription
```
+------------------------------------------+
| [clock icon]  Sin suscripcion activa     |
|               Activa tu plan para        |
|               acceder al contenido       |
|                                          |
| [Ver planes - full width button]         |
+------------------------------------------+
```

### Active Subscription
```
+------------------------------------------+
| [check icon]  Plan Pro                   |
|               Suscripcion activa [Activo]|
|                                          |
| Vence: 15 de marzo de 2026               |
| Dias restantes: 25 dias                  |
|                                          |
| [Cambiar plan - outline button]          |
+------------------------------------------+
```

### Expiring Soon
```
+------------------------------------------+
| [check icon]  Plan Pro                   |
|               Suscripcion activa [Activo]|
|                                          |
| Vence: 20 de febrero de 2026 (orange)    |
| Dias restantes: 5 dias (orange)          |
|                                          |
| +--------------------------------------+ |
| | Tu suscripcion esta por vencer.      | |
| | Renueva para no perder acceso.       | |
| +--------------------------------------+ |
|                                          |
| [Renovar ahora - outline button]         |
+------------------------------------------+
```

## Date Formatting

```typescript
endDate.toLocaleDateString("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
// Output: "15 de marzo de 2026"
```

## Scenarios

### Scenario: Display Active Subscription
```gherkin
Given a user has an active PRO subscription
And the subscription ends in 25 days
When SubscriptionCard renders
Then it should show "Plan Pro"
And it should show "Activo" badge in green
And it should show the expiration date
And it should show "25 dias" remaining
```

### Scenario: Expiring Soon Warning
```gherkin
Given a user has an active subscription
And the subscription ends in 5 days
When SubscriptionCard renders
Then expiration date should be orange colored
And days remaining should be orange colored
And a warning banner should appear
And the CTA should say "Renovar ahora"
```

### Scenario: No Subscription
```gherkin
Given a user has no active subscription
When SubscriptionCard renders
Then it should show clock icon (not check)
And it should show "Sin suscripcion activa"
And it should have a "Ver planes" button
```

## Color Classes

```typescript
// Active badge
className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium"

// Expiring warning text
className={isExpiringSoon ? "text-orange-400" : "text-white"}

// Warning banner
className="bg-orange-500/10 border border-orange-500/30 rounded-xl"
```
