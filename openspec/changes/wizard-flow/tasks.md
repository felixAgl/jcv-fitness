# Tasks: Wizard Flow

## Phase 1: Store Setup
- [x] 1.1 Create wizard-store with Zustand
- [x] 1.2 Define WizardState interface
- [x] 1.3 Define WizardActions interface
- [x] 1.4 Implement state setters
- [x] 1.5 Add navigation actions (next/prev/goTo)
- [x] 1.6 Add reset action
- [x] 1.7 Implement canProceed validation
- [x] 1.8 Add localStorage persistence

## Phase 2: Type Definitions
- [x] 2.1 Define TrainingLevel type
- [x] 2.2 Define TrainingGoal type
- [x] 2.3 Define EquipmentType type
- [x] 2.4 Define ProgramDuration type
- [x] 2.5 Define UserBodyData interface
- [x] 2.6 Define Exercise interface
- [x] 2.7 Define TRANSLATIONS object
- [x] 2.8 Add ACTIVITY_LEVELS constant

## Phase 3: Step Components
- [x] 3.1 Create StepLevel component
- [x] 3.2 Create StepGoal component
- [x] 3.3 Create StepTime component (slider)
- [x] 3.4 Create StepEquipment component
- [x] 3.5 Create StepDuration component
- [x] 3.6 Create StepBodyData component
- [x] 3.7 Create StepExercises component
- [x] 3.8 Create StepFoods component
- [x] 3.9 Create StepSummary component

## Phase 4: UI Components
- [x] 4.1 Create WizardContainer layout
- [x] 4.2 Create WizardProgress component
- [x] 4.3 Create OptionCard component
- [x] 4.4 Create ExerciseCard component
- [x] 4.5 Create FoodCard component
- [x] 4.6 Create NavigationButtons component

## Phase 5: Data Files
- [x] 5.1 Create exercises.ts with exercise list
- [x] 5.2 Create foods.ts with food list
- [x] 5.3 Create workout-templates.ts generator
- [x] 5.4 Create meal-templates.ts generator

## Phase 6: Calorie Calculation
- [x] 6.1 Implement Harris-Benedict BMR formula
- [x] 6.2 Add activity multipliers
- [x] 6.3 Calculate TDEE
- [x] 6.4 Calculate target calories based on goal

## Phase 7: Plan Generation
- [x] 7.1 Implement generateWorkoutPlan function
- [x] 7.2 Implement generateMealPlan function
- [x] 7.3 Connect to StepSummary
- [x] 7.4 Save plan to user_plans table

## Phase 8: Testing
- [x] 8.1 Unit tests for wizard-store
- [x] 8.2 Unit tests for calorie calculation
- [x] 8.3 Unit tests for workout templates
- [x] 8.4 Unit tests for meal templates
- [x] 8.5 Component tests for navigation
- [ ] 8.6 E2E tests for complete flow

## Pending Improvements
- [ ] Add exercise videos
- [ ] Add food photos
- [ ] Implement AI-powered recommendations
- [ ] Add more exercise variations
- [ ] Support meal substitutions
- [ ] Add progress indicators per step
