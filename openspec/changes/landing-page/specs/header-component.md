# Spec: Header Component

## Overview
A fixed navigation header with responsive design, authentication integration, and smooth scrolling navigation.

## Requirements

### REQ-1: Layout
- **MUST** be fixed at top of viewport
- **MUST** have semi-transparent background with blur
- **MUST** span full width
- **MUST** have consistent height (64px)

### REQ-2: Navigation
- **MUST** display logo linking to home
- **MUST** show navigation links on desktop
- **MUST** support smooth scroll to sections
- **MUST** collapse to hamburger on mobile

### REQ-3: Authentication Integration
- **MUST** show login/register buttons when unauthenticated
- **MUST** show user menu when authenticated
- **MUST** open AuthModal on button click
- **MUST** redirect to dashboard after auth

### REQ-4: Mobile Menu
- **MUST** show hamburger icon on mobile
- **MUST** animate menu open/close
- **MUST** close on link click
- **MUST** close on outside click

## Navigation Links

```typescript
const navLinks = [
  { href: "#meal-plan", label: "Alimentacion" },
  { href: "#workout-plan", label: "Entrenamiento" },
  { href: "#pricing", label: "Planes" },
];
```

## State

```typescript
const [isOpen, setIsOpen] = useState(false);      // Mobile menu open
const [showAuth, setShowAuth] = useState(false);  // Auth modal open
const [authMode, setAuthMode] = useState<"login" | "register">("login");
```

## UI States

### Desktop - Unauthenticated
```
[Logo] [JCV 24 FITNESS]    [Alimentacion] [Entrenamiento] [Planes]    [Iniciar sesion] [Registrarse]
```

### Desktop - Authenticated
```
[Logo] [JCV 24 FITNESS]    [Alimentacion] [Entrenamiento] [Planes]    [Mi Panel] [Logout icon]
```

### Mobile - Menu Closed
```
[Logo] [JCV 24 FITNESS]                                                [Hamburger]
```

### Mobile - Menu Open
```
[Logo] [JCV 24 FITNESS]                                                [X]
+------------------------------------------------------------------+
| Alimentacion                                                       |
| Entrenamiento                                                      |
| Planes                                                             |
| Iniciar sesion                                                     |
| [Registrarse]                                                      |
+------------------------------------------------------------------+
```

## Scenarios

### Scenario: Unauthenticated User Clicks Register
```gherkin
Given a user is not authenticated
And the header is displayed
When the user clicks "Registrarse"
Then the AuthModal should open
And authMode should be "register"
```

### Scenario: Mobile Navigation
```gherkin
Given the viewport is mobile width
When the user clicks the hamburger icon
Then the mobile menu should animate open
And all nav links should be visible
When the user clicks a nav link
Then the menu should close
And the page should scroll to that section
```

### Scenario: Authenticated User Menu
```gherkin
Given a user is authenticated
When viewing the header
Then "Iniciar sesion" and "Registrarse" should be hidden
And "Mi Panel" link should be visible
And logout button should be visible
```

## Styling

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
```

## Accessibility

- Hamburger button has aria-label
- Navigation links are keyboard accessible
- Focus visible on interactive elements
- Menu state announced to screen readers
