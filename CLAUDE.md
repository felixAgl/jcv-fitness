# JCV Fitness - Project Instructions

## Critical Rules - ALWAYS FOLLOW

### 1. Model Preference
- Use **Claude Opus 4.5** for complex tasks when available
- Prefer opus for architecture decisions, code review, and multi-step implementations

### 2. Build & Test Before Commit
- **ALWAYS** run `npm run build` before committing
- **ALWAYS** run `npm test` before committing
- **NEVER** commit code that doesn't build
- **NEVER** push broken code to any branch
- Add tests for new features - aim for good coverage

### 3. Git Branch Flow
```
main (production) <-- PR only, protected
  |
staging (pre-prod) <-- work here, auto-deploys to staging env
  |
feature/* (optional) <-- for large features
```

- **main**: Protected, requires PR from staging
- **staging**: Primary development branch, auto-deploys to Cloudflare Pages staging
- **feature/xxx**: Optional for large features, merge to staging first
- **NEVER** push directly to main

### 4. Commit Flow
```bash
# 1. Make changes
# 2. Build and test
npm run build && npm test

# 3. Stage specific files (not git add .)
git add <specific-files>

# 4. Commit with conventional commits
git commit -m "feat|fix|docs|refactor|test(scope): description"

# 5. Push to staging
git push origin staging

# 6. Create PR when ready for production
gh pr create --base main --head staging
```

### 5. Obey User Instructions
- Follow user instructions explicitly
- When user says "validate", actually verify the implementation
- When user says "use X", use exactly X
- Don't assume - ask if unclear

## Project Context

### Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **State**: Zustand 5
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Payments**: MercadoPago (primary), Wompi (future)
- **Hosting**: Cloudflare Pages (static export)
- **Worker**: Cloudflare Workers (webhook handling)

### Key Docs
- `/docs/PRD-subscription-system.md` - Subscription system PRD
- `/openspec/` - Feature specifications
- `/supabase/migrations/` - Database schema

### Database Tables
- `profiles` - User profiles
- `subscriptions` - Active subscriptions
- `wizard_data` - Wizard form data
- `user_plans` - Generated fitness plans
- `webhook_logs` - MercadoPago webhook logs
- `subscription_audit_log` - Subscription changes audit

### Feature Folders
```
src/features/
  auth/           # Authentication (magic link, etc)
  dashboard/      # User dashboard components
  meal-plan/      # Meal plan display
  payment/        # MercadoPago/Wompi integration
  plans/          # Plan viewer, tracking
  subscription/   # Subscription management
  wizard/         # 9-step plan generator
  workout-plan/   # Workout plan display
```

## URLs
- **Production**: https://jcv24fitness.com
- **Staging**: https://staging.jcv24fitness.pages.dev (or similar)
- **Webhook Worker**: https://mercadopago-jcv.fagal142010.workers.dev

## Common Commands
```bash
# Development
npm run dev

# Build (required before commit)
npm run build

# Test (required before commit)
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Deploy worker
cd cloudflare-worker && wrangler deploy
```

## Checklist Before Push
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] No TypeScript errors
- [ ] Exports are correct (check index.ts files)
- [ ] New components exported from feature index
