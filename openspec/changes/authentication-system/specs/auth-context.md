# Spec: AuthContext

## Overview
The AuthContext provides centralized authentication state management for the entire application.

## Requirements

### REQ-1: State Management
- **MUST** track current user (from Supabase auth.users)
- **MUST** track current session (tokens, expiry)
- **MUST** track user profile (from profiles table)
- **MUST** expose isLoading flag during auth checks
- **MUST** expose isAuthenticated boolean

### REQ-2: Authentication Methods
- **MUST** support email/password sign in
- **MUST** support email/password sign up with optional name
- **MUST** support Magic Link (OTP) sign in
- **MUST** support password reset via email
- **MUST** support sign out

### REQ-3: Session Handling
- **MUST** listen for auth state changes
- **MUST** persist session across page refreshes
- **MUST** support session refresh
- **MUST** timeout initial auth check after 5 seconds
- **SHOULD** avoid double-processing auth events

### REQ-4: Profile Loading
- **MUST** fetch profile after authentication
- **MUST** load profile asynchronously (non-blocking)
- **MUST** update state when profile loads
- **SHOULD** handle profile fetch errors gracefully

## Scenarios

### Scenario: Fresh Page Load with Valid Session
```gherkin
Given a user has a valid session cookie
When the application loads
Then the user should be authenticated immediately
And the profile should load in the background
And isLoading should become false within 5 seconds
```

### Scenario: Fresh Page Load without Session
```gherkin
Given no session cookie exists
When the application loads
Then isAuthenticated should be false
And user should be null
And isLoading should become false
```

### Scenario: Password Login Success
```gherkin
Given valid credentials "user@example.com" / "password123"
When signIn is called with these credentials
Then the user state should update
And isAuthenticated should become true
And profile should load in background
```

### Scenario: Magic Link Request
```gherkin
Given an email "user@example.com"
When signInWithMagicLink is called
Then an email with a login link should be sent
And the function should return no error
```

### Scenario: Sign Out
```gherkin
Given an authenticated user
When signOut is called
Then user should become null
And session should become null
And profile should become null
And isAuthenticated should become false
```

## State Transitions

```
INITIAL
  |
  +-- [getSession] --> HAS_SESSION --> AUTHENTICATED
  |                         |
  |                         +-- [fetchProfile] --> AUTHENTICATED_WITH_PROFILE
  |
  +-- [timeout] --> UNAUTHENTICATED
  |
  +-- [signIn/signUp] --> AUTHENTICATED
```

## Error Codes

| Code | Description |
|------|-------------|
| `invalid_credentials` | Email or password incorrect |
| `user_not_found` | No user with this email |
| `email_not_confirmed` | Email verification required |
| `rate_limit` | Too many attempts |
| `network_error` | Failed to connect |
