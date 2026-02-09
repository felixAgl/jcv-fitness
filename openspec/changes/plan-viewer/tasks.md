# Tasks: Plan Viewer System

## Phase 1: Data Layer
- [x] 1.1 Define UserPlan type
- [x] 1.2 Define PlanDataWithProgress type
- [x] 1.3 Create plan-service.ts
- [x] 1.4 Implement getActivePlan function
- [x] 1.5 Create get_active_plan Supabase function
- [x] 1.6 Create usePlan hook

## Phase 2: Plan Generation
- [x] 2.1 Create generateWorkoutPlan function
- [x] 2.2 Create generateMealPlan function
- [x] 2.3 Implement exercise mapping
- [x] 2.4 Implement meal/food mapping
- [x] 2.5 Calculate nutritional macros

## Phase 3: PlanViewer Component
- [x] 3.1 Create PlanViewer component
- [x] 3.2 Implement tab navigation
- [x] 3.3 Add day selector for workout
- [x] 3.4 Add day selector for meals
- [x] 3.5 Implement responsive layout

## Phase 4: Resumen Tab
- [x] 4.1 Display plan configuration
- [x] 4.2 Display body data
- [x] 4.3 Create quick stats cards
- [x] 4.4 Add download CTA section

## Phase 5: Rutina Tab
- [x] 5.1 Create day selector buttons
- [x] 5.2 Display workout header
- [x] 5.3 Show muscle group badges
- [x] 5.4 Render exercise cards
- [x] 5.5 Show sets/reps/rest info
- [x] 5.6 Handle rest days

## Phase 6: Alimentacion Tab
- [x] 6.1 Create day selector buttons
- [x] 6.2 Display daily summary
- [x] 6.3 Show macro breakdown
- [x] 6.4 Render meal cards
- [x] 6.5 List foods per meal
- [x] 6.6 Show nutritional info per food

## Phase 7: Calendario Tab
- [x] 7.1 Create TrackingCalendar component
- [x] 7.2 Implement calendar grid
- [x] 7.3 Add day completion markers
- [x] 7.4 Display streak information
- [x] 7.5 Show completion percentage

## Phase 8: Progress Tracking
- [x] 8.1 Create progress-service.ts
- [x] 8.2 Implement markDayComplete
- [x] 8.3 Save progress to database
- [x] 8.4 Update plan_data.progress

## Phase 9: Expiration Handling
- [x] 9.1 Add expiration warning banner
- [x] 9.2 Create PlanExpiredOverlay
- [x] 9.3 Implement days remaining display
- [x] 9.4 Add renewal CTAs

## Phase 10: PDF Download
- [x] 10.1 Create generatePDF utility
- [x] 10.2 Integrate jspdf/html2canvas
- [x] 10.3 Add premium check
- [x] 10.4 Register download in database
- [x] 10.5 Handle download errors

## Phase 11: View Page
- [x] 11.1 Create /plan/view page
- [x] 11.2 Add authentication check
- [x] 11.3 Handle loading state
- [x] 11.4 Handle no-plan state
- [x] 11.5 Handle error state

## Phase 12: Testing
- [x] 12.1 Unit tests for PlanViewer
- [x] 12.2 Unit tests for usePlan hook
- [ ] 12.3 Integration tests for plan loading
- [ ] 12.4 E2E tests for tab navigation

## Pending Improvements
- [ ] Add exercise video links
- [ ] Add meal recipe modals
- [ ] Implement plan sharing
- [ ] Add print-friendly view
- [ ] Offline caching (PWA)
- [ ] Exercise swap suggestions
