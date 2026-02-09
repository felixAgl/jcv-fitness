# Proposal: User Dashboard

## Summary
A protected dashboard page providing users with an overview of their profile, subscription status, plan access, and quick actions for navigating the platform.

## Problem Statement
After authentication, users need a central hub that:
1. Shows their profile information at a glance
2. Displays current subscription status and expiration
3. Provides quick access to their plans
4. Shows their generated plan status
5. Offers help and support options

## Proposed Solution
A dashboard with:
1. User profile card with avatar and logout
2. Plan status card showing active/no plan state
3. Subscription card with status and expiration
4. Quick action grid for common tasks
5. Help section with WhatsApp contact

## Business Value
- **User retention**: Clear status increases engagement
- **Upsell opportunity**: Subscription card drives renewals
- **Reduced support**: Self-service access to plans
- **User experience**: Central navigation hub

## Scope

### In Scope
- Protected route (requires authentication)
- User profile card with initials avatar
- Plan status card (active plan or create CTA)
- Subscription status card
- Quick action buttons (meal plan, workout, PDF, support)
- Help section with WhatsApp link
- Settings link
- Logout functionality

### Out of Scope
- Activity feed/history
- Notification center
- Progress graphs
- Achievement badges
- Community features

## Success Criteria
- [x] Page protected from unauthenticated access
- [x] Profile displays user name and email
- [x] Plan status shows correctly
- [x] Subscription status reflects database
- [x] Quick actions link to correct pages
- [x] Subscription-gated actions show warning
- [x] Mobile responsive layout

## Status: IMPLEMENTED
