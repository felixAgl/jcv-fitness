# Proposal: Wizard Flow for Plan Generation

## Summary
A 9-step interactive wizard that collects user fitness data and preferences to generate personalized workout and meal plans.

## Problem Statement
Users need a guided, intuitive way to provide their fitness profile and preferences to receive customized training and nutrition plans. The process must:
1. Collect training level and goals
2. Gather physical data for calorie calculations
3. Allow customization of exercises and foods
4. Generate personalized plans based on inputs
5. Save progress for authenticated users

## Proposed Solution
A step-by-step wizard with:
1. Zustand store for state management with localStorage persistence
2. 9 progressive steps with clear navigation
3. Real-time validation before advancing
4. Harris-Benedict formula for calorie calculations
5. Plan generation based on user selections

## Business Value
- **Personalization**: Plans tailored to individual needs
- **User experience**: Guided process reduces confusion
- **Data quality**: Step-by-step collection ensures complete data
- **Retention**: Saved progress encourages completion

## Scope

### In Scope
- 9-step wizard flow:
  1. Training Level (principiante to elite)
  2. Training Goal (8 options)
  3. Session Time (slider, 15-90 min)
  4. Equipment Available (multi-select)
  5. Program Duration (1 day to 3 months)
  6. Body Data (weight, height, age, gender, activity)
  7. Exercise Selection (categorized list)
  8. Food Preferences (categorized list)
  9. Summary with plan generation
- Zustand store with persistence
- Progress bar visualization
- Navigation (next/prev/skip)
- Calorie calculation (BMR, TDEE, target)
- Plan saving to Supabase

### Out of Scope
- AI-powered plan generation
- Exercise video integration
- Meal recipe details
- Progress photos upload
- Social sharing

## Success Criteria
- [x] All 9 steps render correctly
- [x] State persists across page refreshes
- [x] Validation prevents invalid advancement
- [x] Calorie calculations are accurate
- [x] Plans can be saved to database
- [x] Mobile-responsive design

## Status: IMPLEMENTED
