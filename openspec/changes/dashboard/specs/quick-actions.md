# Spec: QuickActions Component

## Overview
A grid of action buttons providing quick access to common user tasks with subscription-aware gating.

## Requirements

### REQ-1: Action Grid
- **MUST** display 4 action cards
- **MUST** use 2x2 grid on desktop
- **MUST** use single column on mobile
- **MUST** show icon, title, description

### REQ-2: Action Types
- **MUST** include meal plan access
- **MUST** include workout access
- **MUST** include PDF download
- **MUST** include support contact

### REQ-3: Subscription Gating
- **MUST** check hasActiveSubscription
- **MUST** disable actions requiring subscription
- **MUST** show "Requiere suscripcion activa" message
- **MUST** reduce opacity on disabled actions

### REQ-4: External Links
- **MUST** handle external links (WhatsApp)
- **MUST** open in new tab
- **MUST** include proper rel attributes

## Action Configuration

```typescript
interface Action {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  color: "cyan" | "purple" | "green";
  requiresSubscription: boolean;
  external?: boolean;
}

const actions: Action[] = [
  {
    title: "Mi Plan Alimenticio",
    description: "Ver tu plan de comidas personalizado",
    href: "/plan/alimentacion",
    icon: <ClipboardIcon />,
    color: "cyan",
    requiresSubscription: true,
  },
  {
    title: "Mi Rutina",
    description: "Accede a tus ejercicios diarios",
    href: "/plan/ejercicios",
    icon: <BoltIcon />,
    color: "purple",
    requiresSubscription: true,
  },
  {
    title: "Descargar PDF",
    description: "Descarga tu plan completo",
    href: "/plan/download",
    icon: <DocumentIcon />,
    color: "green",
    requiresSubscription: true,
  },
  {
    title: "Contactar Soporte",
    description: "Habla con un asesor",
    href: "https://wa.me/573143826430",
    icon: <ChatIcon />,
    color: "green",
    requiresSubscription: false,
    external: true,
  },
];
```

## Color Classes

```typescript
const colorClasses = {
  cyan: {
    bg: "bg-accent-cyan/10",
    text: "text-accent-cyan",
    hover: "hover:border-accent-cyan/50",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    hover: "hover:border-purple-500/50",
  },
  green: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    hover: "hover:border-green-500/50",
  },
};
```

## Card Layout

```
+------------------------------------------+
| [icon bg]  Title                         |
| [icon]     Description                   |
|            [Requiere suscripcion activa] |
+------------------------------------------+
```

## Gating Logic

```typescript
const isDisabled = action.requiresSubscription && !hasActiveSubscription;

if (isDisabled) {
  // Render as div (not clickable)
  return <div className="opacity-50 cursor-not-allowed">{content}</div>;
}

if (action.external) {
  // Render as anchor with target="_blank"
  return <a href={action.href} target="_blank" rel="noopener noreferrer">{content}</a>;
}

// Render as Next.js Link
return <Link href={action.href}>{content}</Link>;
```

## Scenarios

### Scenario: User With Subscription
```gherkin
Given a user has an active subscription
When QuickActions renders
Then all 4 actions should be clickable
And no "Requiere suscripcion" messages should show
And links should navigate correctly
```

### Scenario: User Without Subscription
```gherkin
Given a user has no active subscription
When QuickActions renders
Then "Contactar Soporte" should be clickable
And the other 3 actions should be disabled
And disabled actions should show subscription requirement message
And disabled actions should have 50% opacity
```

### Scenario: Click External Link
```gherkin
Given the QuickActions are displayed
When the user clicks "Contactar Soporte"
Then a new tab should open
And WhatsApp should load with the contact number
```

## Grid Styling

```css
.quick-actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```
