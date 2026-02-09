# Spec: Protected Route

## Overview
The ProtectedRoute component wraps pages that require authentication, redirecting unauthenticated users.

## Requirements

### REQ-1: Authentication Check
- **MUST** check isAuthenticated from AuthContext
- **MUST** check isLoading state first
- **MUST** wait for auth check before rendering

### REQ-2: Loading State
- **MUST** display loading spinner while auth is checking
- **MUST** center loading indicator on screen
- **SHOULD** show "Verificando sesion..." message

### REQ-3: Redirect Behavior
- **MUST** redirect unauthenticated users to home page
- **SHOULD** preserve intended destination for after login
- **MUST NOT** flash protected content before redirect

### REQ-4: Authenticated State
- **MUST** render children when authenticated
- **MUST** pass through all props to children

## Component Interface

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

## Behavior Flow

```
ProtectedRoute mounts
    |
    v
Is auth loading?
    |
    +-- YES --> Show loading spinner
    |
    +-- NO --> Is authenticated?
                    |
                    +-- YES --> Render children
                    |
                    +-- NO --> Redirect to /
```

## Loading State UI

```
[centered container]
    |
    +-- [spinning circle animation]
    |
    +-- "Verificando sesion..."
```

## Usage Example

```tsx
// In page component
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

## Protected Pages
- `/dashboard` - User dashboard
- `/plan/view` - View active plan
- `/plan/alimentacion` - Meal plan details
- `/plan/ejercicios` - Workout plan details
- `/plan/download` - Download plan PDF
- `/settings` - User settings
- `/wizard` - Plan creation wizard (partial)
