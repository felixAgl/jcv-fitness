# Tasks: Authentication System

## Phase 1: Core Authentication
- [x] 1.1 Create AuthContext with state management
- [x] 1.2 Implement signIn (email/password)
- [x] 1.3 Implement signUp (email/password/name)
- [x] 1.4 Implement signOut
- [x] 1.5 Implement session refresh
- [x] 1.6 Add onAuthStateChange listener
- [x] 1.7 Add getSession fallback
- [x] 1.8 Add timeout fallback for initial load

## Phase 2: Magic Link
- [x] 2.1 Implement signInWithMagicLink
- [x] 2.2 Create /auth/callback page
- [x] 2.3 Handle token exchange on callback
- [x] 2.4 Redirect to dashboard after auth

## Phase 3: Password Reset
- [x] 3.1 Implement resetPassword function
- [x] 3.2 Create /auth/reset-password page
- [x] 3.3 Handle password update form
- [x] 3.4 Add success/error states

## Phase 4: UI Components
- [x] 4.1 Create LoginForm component
- [x] 4.2 Create RegisterForm component
- [x] 4.3 Create AuthModal wrapper
- [x] 4.4 Add auth method toggle (password/magic)
- [x] 4.5 Add loading states
- [x] 4.6 Add error display

## Phase 5: Protected Routes
- [x] 5.1 Create ProtectedRoute component
- [x] 5.2 Add redirect logic for unauthenticated users
- [x] 5.3 Add loading state during auth check
- [x] 5.4 Wrap protected pages

## Phase 6: Profile Integration
- [x] 6.1 Add fetchProfile function
- [x] 6.2 Load profile on authentication
- [x] 6.3 Make profile load non-blocking
- [x] 6.4 Update profile state when loaded

## Phase 7: Testing
- [x] 7.1 Create AuthContext tests
- [x] 7.2 Test signIn flow
- [x] 7.3 Test signUp flow
- [x] 7.4 Test session persistence
- [ ] 7.5 E2E tests for auth flows

## Pending Improvements
- [ ] Add email verification requirement
- [ ] Add social OAuth (Google)
- [ ] Implement remember me functionality
- [ ] Add session timeout warning
- [ ] Improve error messages for edge cases
