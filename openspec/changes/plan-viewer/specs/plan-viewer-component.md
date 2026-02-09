# Spec: PlanViewer Component

## Overview
The main component for displaying user's personalized workout and meal plans with tabbed navigation.

## Requirements

### REQ-1: Tab Navigation
- **MUST** display four tabs: Resumen, Rutina, Alimentacion, Calendario
- **MUST** highlight active tab
- **MUST** show tab icons/emojis
- **MUST** support horizontal scrolling on mobile

### REQ-2: Header Information
- **MUST** display plan name (user's name or default)
- **MUST** show days remaining
- **MUST** show back navigation
- **MUST** display expiration warning when < 7 days

### REQ-3: Workout Display
- **MUST** generate workout plan from user selections
- **MUST** display 7 days of workouts
- **MUST** show rest days appropriately
- **MUST** display exercise details (sets, reps, rest)

### REQ-4: Meal Plan Display
- **MUST** generate meal plan based on calorie target
- **MUST** display 7 days of meals
- **MUST** show meals per day (breakfast, lunch, dinner, snacks)
- **MUST** display nutritional macros

### REQ-5: Premium Features
- **MUST** check subscription status for PDF download
- **MUST** show upgrade prompt for free users
- **MUST** track download count

## Props Interface

```typescript
interface PlanViewerProps {
  plan: UserPlan & {
    isExpired: boolean;
    daysRemaining: number;
  };
}
```

## State

```typescript
const [activeTab, setActiveTab] = useState<TabType>("resumen");
const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(0);
const [selectedMealDay, setSelectedMealDay] = useState(0);
```

## Computed Values

```typescript
// Generate workout plan
const workoutPlan = useMemo(() => {
  if (!planData.level || !planData.goal) return [];
  return generateWorkoutPlan(
    planData.level,
    planData.goal,
    planData.selectedExercises,
    planData.time
  );
}, [planData.level, planData.goal, planData.selectedExercises, planData.time]);

// Generate meal plan
const mealPlan = useMemo(() => {
  if (!planData.userBodyData) return [];
  const targetCalories = calculateTargetCalories(planData.userBodyData);
  return generateMealPlan(targetCalories, planData.userBodyData.weightGoal, 7);
}, [planData.userBodyData]);
```

## Tab Configuration

```typescript
const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: "resumen", label: "Resumen", icon: "clipboard" },
  { id: "rutina", label: "Rutina Semanal", icon: "muscle" },
  { id: "alimentacion", label: "Plan Alimenticio", icon: "salad" },
  { id: "calendario", label: "Calendario", icon: "calendar" },
];
```

## Scenarios

### Scenario: Render Summary Tab
```gherkin
Given a user with an active plan
When PlanViewer renders with "resumen" tab active
Then it should display plan configuration
And it should display body data
And it should display quick stats
And it should display download CTA
```

### Scenario: Navigate Workout Days
```gherkin
Given a user viewing the Rutina tab
When the user clicks on "Martes" day button
Then selectedWorkoutDay should be 1
And the Tuesday workout should display
```

### Scenario: Rest Day Display
```gherkin
Given a workout plan with rest on Sunday
When the user views Sunday in Rutina tab
Then it should display "Dia de Descanso" message
And it should show rest day emoji
And no exercises should be listed
```

### Scenario: Expiration Warning
```gherkin
Given a plan with 5 days remaining
When PlanViewer renders
Then it should display yellow warning banner
And banner should say "Tu plan vence en 5 dias"
And banner should have "Renovar" link
```

### Scenario: Premium Download
```gherkin
Given a user with active subscription
When viewing the Resumen tab
Then "Descargar PDF" button should be visible
And clicking should trigger PDF generation
```

## Error States

| State | Display |
|-------|---------|
| No plan data | "No hay datos del plan" |
| Empty workout plan | "No hay ejercicios asignados" |
| Empty meal plan | "No se pudo generar el plan alimenticio" |
| Download error | Toast: "Error al descargar" |
