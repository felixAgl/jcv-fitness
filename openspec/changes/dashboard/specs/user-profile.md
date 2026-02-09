# Spec: UserProfile Component

## Overview
A card component displaying the authenticated user's profile information with avatar, settings link, and logout functionality.

## Requirements

### REQ-1: Data Display
- **MUST** show user's display name
- **MUST** show user's email
- **MUST** generate avatar with initials
- **MUST** handle missing profile data

### REQ-2: Avatar Generation
- **MUST** use initials from display name
- **MUST** limit to 2 characters
- **MUST** uppercase initials
- **MUST** fallback to email username if no name

### REQ-3: Actions
- **MUST** provide settings link
- **MUST** provide logout button
- **MUST** call signOut on logout click

### REQ-4: Null State
- **MUST** return null if no user
- **MUST NOT** render when unauthenticated

## Name Resolution

```typescript
const displayName =
  profile?.full_name ||
  user.email?.split("@")[0] ||
  "Usuario";
```

## Initials Generation

```typescript
const initials = displayName
  .split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);

// Examples:
// "Juan Carlos Vargas" -> "JC"
// "maria" -> "M"
// "Juan" -> "J"
```

## UI Layout

```
+------------------------------------------+
| [Gradient Avatar]  Juan Carlos Vargas    |
|      JC           juan@email.com         |
+------------------------------------------+
|                                          |
| [Configuracion]    [Cerrar sesion]       |
+------------------------------------------+
```

## Avatar Styling

```css
.avatar {
  width: 4rem;         /* 64px */
  height: 4rem;
  background: linear-gradient(to bottom-right, #00f0ff, #3b82f6);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: black;
}
```

## Button Styles

### Settings Button
```css
.settings-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: #1f2937;   /* gray-800 */
  color: #9ca3af;        /* gray-300 */
  font-size: 0.875rem;
  font-weight: 500;
}

.settings-btn:hover {
  background: #374151;   /* gray-700 */
}
```

### Logout Button
```css
.logout-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: rgba(239, 68, 68, 0.1);  /* red-500/10 */
  color: #f87171;                       /* red-400 */
  font-size: 0.875rem;
  font-weight: 500;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);  /* red-500/20 */
}
```

## Scenarios

### Scenario: Display Full Name
```gherkin
Given a user with profile.full_name = "Juan Carlos Vargas"
When UserProfile renders
Then displayName should be "Juan Carlos Vargas"
And initials should be "JC"
And email should be displayed below the name
```

### Scenario: Fallback to Email Username
```gherkin
Given a user with profile.full_name = null
And user.email = "test@example.com"
When UserProfile renders
Then displayName should be "test"
And initials should be "T"
```

### Scenario: Logout Click
```gherkin
Given UserProfile is displayed
When the user clicks "Cerrar sesion"
Then signOut() should be called
And the user should be logged out
And the page should redirect appropriately
```

### Scenario: No User
```gherkin
Given user is null (not authenticated)
When UserProfile tries to render
Then it should return null
And nothing should be displayed
```

## Accessibility

- Avatar is decorative (no alt text needed)
- Buttons have visible text labels
- Links are keyboard accessible
- Focus visible on interactive elements
