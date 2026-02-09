# Spec: Subscription Plans

## Overview
Definition and configuration of the three subscription tiers offered by JCV Fitness.

## Requirements

### REQ-1: Plan Types
- **MUST** offer exactly three plan types
- **MUST** use enum: PLAN_BASICO, PLAN_PRO, PLAN_PREMIUM
- **MUST** store plan type in subscriptions table

### REQ-2: Pricing
- **MUST** price in Colombian Pesos (COP)
- **MUST** use integer amounts (no decimals)
- **MUST** display formatted prices with thousands separator
- **MUST** include currency indicator

### REQ-3: Features
- **MUST** define distinct features per plan
- **MUST** show feature comparison
- **MUST** indicate popular/recommended plan

### REQ-4: Duration
- **MUST** all plans have same duration (40 days)
- **MUST** calculate end_date from activation
- **MUST** track start_date and end_date

## Plan Definitions

### PLAN_BASICO
```typescript
{
  id: "PLAN_BASICO",
  name: "Basico",
  price: 49900,             // $49,900 COP
  priceDisplay: "$49.900",
  durationDays: 40,
  features: [
    "Plan de alimentacion 7 dias",
    "Rutina de entrenamiento casa",
    "Acceso a la app",
    "Soporte por email",
  ],
}
```

### PLAN_PRO
```typescript
{
  id: "PLAN_PRO",
  name: "Pro",
  price: 89900,             // $89,900 COP
  priceDisplay: "$89.900",
  durationDays: 40,
  popular: true,            // Highlighted
  features: [
    "Plan de alimentacion personalizado",
    "Rutina gimnasio + casa",
    "Videos de ejercicios",
    "Soporte prioritario",
    "Seguimiento semanal",
  ],
}
```

### PLAN_PREMIUM
```typescript
{
  id: "PLAN_PREMIUM",
  name: "Premium",
  price: 149900,            // $149,900 COP
  priceDisplay: "$149.900",
  durationDays: 40,
  features: [
    "Todo lo del plan Pro",
    "Coaching 1 a 1",
    "Ajustes mensuales",
    "Acceso a comunidad VIP",
    "Garantia de resultados",
  ],
}
```

## Feature Comparison Matrix

| Feature | BASICO | PRO | PREMIUM |
|---------|--------|-----|---------|
| Plan alimentacion 7 dias | Y | Y | Y |
| Rutina casa | Y | Y | Y |
| Acceso app | Y | Y | Y |
| Soporte email | Y | Y | Y |
| Plan alimentacion personalizado | - | Y | Y |
| Rutina gimnasio | - | Y | Y |
| Videos ejercicios | - | Y | Y |
| Soporte prioritario | - | Y | Y |
| Seguimiento semanal | - | Y | Y |
| Coaching 1 a 1 | - | - | Y |
| Ajustes mensuales | - | - | Y |
| Comunidad VIP | - | - | Y |
| Garantia resultados | - | - | Y |

## Price Determination from Amount

```typescript
function determinePlanFromAmount(amount: number): PlanType {
  switch (amount) {
    case 49900:
      return "PLAN_BASICO";
    case 89900:
      return "PLAN_PRO";
    case 149900:
      return "PLAN_PREMIUM";
    default:
      return "PLAN_BASICO"; // Fallback
  }
}
```

## Duration Calculation

```typescript
function calculateEndDate(planType: PlanType): Date {
  const now = new Date();
  const durationDays = 40; // All plans have 40 days
  return new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
}
```
