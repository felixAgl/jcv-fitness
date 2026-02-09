# Design: Authentication System

## Architecture

```
+------------------+     +-------------------+     +----------------+
|  React App       |     |  Supabase Auth    |     |  Supabase DB   |
|  AuthContext     |<--->|  Auth API         |<--->|  profiles      |
|  AuthProvider    |     |  Session Mgmt     |     |  table         |
+------------------+     +-------------------+     +----------------+
        |                         |
        v                         v
+------------------+     +-------------------+
|  UI Components   |     |  Email Service    |
|  LoginForm       |     |  Magic Links      |
|  RegisterForm    |     |  Password Reset   |
|  AuthModal       |     |  Confirmations    |
+------------------+     +-------------------+
```

## Component Design

### AuthContext (`/src/features/auth/context/AuthContext.tsx`)

**State Interface:**
```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Tables<"profiles"> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

**Actions Interface:**
```typescript
interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}
```

### Authentication Flows

#### Flow 1: Password Login
```
1. User enters email + password
2. Call signIn(email, password)
3. Supabase validates credentials
4. On success: session created
5. onAuthStateChange fires
6. handleAuthChange sets user immediately
7. Profile loads in background (non-blocking)
```

#### Flow 2: Magic Link Login
```
1. User enters email
2. Call signInWithMagicLink(email)
3. Supabase sends OTP email with link
4. User clicks link
5. Redirected to /auth/callback
6. Callback page handles token exchange
7. Session created
8. onAuthStateChange fires
9. User redirected to dashboard
```

#### Flow 3: Password Reset
```
1. User clicks "Forgot password"
2. User enters email
3. Call resetPassword(email)
4. Supabase sends reset email
5. User clicks link
6. Redirected to /auth/reset-password
7. User enters new password
8. Password updated
9. User redirected to login
```

### Component Hierarchy

```
AuthProvider (context wrapper)
  |
  +-- Header
  |     +-- AuthModal (login/register)
  |           +-- LoginForm
  |           +-- RegisterForm
  |
  +-- ProtectedRoute (HOC)
  |     +-- Dashboard
  |     +-- Plan pages
  |     +-- Settings
  |
  +-- Auth pages
        +-- /auth/callback
        +-- /auth/reset-password
```

### Database Schema

```sql
-- Supabase auth.users table (managed by Supabase)
-- Contains: id, email, encrypted_password, etc.

-- Public profiles table (synced via trigger)
TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  has_active_subscription BOOLEAN DEFAULT false,
  current_plan plan_type,
  subscription_end_date TIMESTAMPTZ,
  has_free_plan_used BOOLEAN DEFAULT false,
  free_plan_expires_at TIMESTAMPTZ,
  active_plan_id UUID REFERENCES user_plans(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

## Session Management

### Initial Load Strategy
```typescript
// 1. Set up auth listener FIRST
supabase.auth.onAuthStateChange(handleAuthChange);

// 2. Explicitly get session (fallback)
supabase.auth.getSession().then(handleAuthChange);

// 3. Timeout fallback (5 seconds)
setTimeout(() => {
  if (!initialAuthProcessed.current) {
    setState({ isLoading: false, isAuthenticated: false });
  }
}, 5000);
```

### Non-Blocking Profile Load
```typescript
// Set user immediately - don't wait for profile
setState({
  user: session.user,
  isAuthenticated: true,
  isLoading: false,
  profile: null, // Loaded async
});

// Load profile in background
fetchProfile(session.user.id).then(profile => {
  setState(prev => ({ ...prev, profile }));
});
```

## Security Considerations

1. **Supabase RLS**: Profiles protected by Row Level Security
2. **Session tokens**: Stored in HTTP-only cookies via @supabase/ssr
3. **PKCE flow**: Used for Magic Link authentication
4. **Email verification**: Optional (currently disabled)
5. **Password requirements**: Handled by Supabase (min 6 chars)

## Routes

| Route | Purpose |
|-------|---------|
| `/auth/callback` | Magic Link callback, token exchange |
| `/auth/reset-password` | Password reset form |

## Error Handling

| Error | User Message |
|-------|--------------|
| Invalid email format | "Correo electronico invalido" |
| Wrong password | "Credenciales incorrectas" |
| Email not found | "Usuario no encontrado" |
| Rate limited | "Demasiados intentos. Intenta mas tarde" |
| Network error | "Error de conexion" |
