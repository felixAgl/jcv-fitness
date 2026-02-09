# Proposal: Plan Viewer System

## Summary
A comprehensive plan viewing system that displays user's personalized workout and meal plans with multiple tabs, progress tracking, and PDF download capability.

## Problem Statement
After users generate their personalized plans, they need a way to:
1. View their complete training program
2. Navigate between workout and meal plans
3. Track daily progress
4. Download plans for offline use
5. Access plans across devices

## Proposed Solution
A tabbed plan viewer with:
1. Summary tab showing plan overview
2. Weekly workout routine with day-by-day navigation
3. Daily meal plan with nutritional information
4. Progress tracking calendar
5. PDF download for premium subscribers

## Business Value
- **User engagement**: Easy plan access increases adherence
- **Premium value**: PDF download as premium feature
- **Progress tracking**: Visual feedback motivates users
- **Mobile access**: Responsive design for on-the-go use

## Scope

### In Scope
- Plan data loading from Supabase
- Four-tab interface (Resumen, Rutina, Alimentacion, Calendario)
- Day-by-day workout navigation
- Day-by-day meal plan navigation
- Nutritional information display
- Exercise details with sets/reps/rest
- Progress tracking calendar
- Plan expiration handling
- Expired plan overlay
- PDF download button (premium only)

### Out of Scope
- Exercise video playback
- Meal recipe instructions
- Social sharing
- Plan editing
- Print view
- Offline mode (PWA)

## Success Criteria
- [x] Plan data loads correctly from database
- [x] All four tabs render properly
- [x] Day navigation works in workout/meal tabs
- [x] Nutritional macros display correctly
- [x] Progress calendar shows completed days
- [x] Expiration warning displays at 7 days
- [x] Expired overlay blocks access

## Status: IMPLEMENTED
