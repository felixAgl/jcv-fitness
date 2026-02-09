# Spec: Wizard Store

## Overview
The wizard store manages all state for the 9-step plan generation wizard using Zustand with localStorage persistence.

## Requirements

### REQ-1: State Persistence
- **MUST** persist state to localStorage
- **MUST** use key "jcv-wizard-state"
- **MUST** restore state on page refresh
- **MUST** partialize state (exclude functions)

### REQ-2: Step Navigation
- **MUST** support nextStep (max 9)
- **MUST** support prevStep (min 1)
- **MUST** support goToStep (1-9)
- **MUST** validate before advancing

### REQ-3: Data Setters
- **MUST** provide setter for each data field
- **MUST** support toggle pattern for arrays
- **MUST** support partial updates for body data
- **MUST** reset to initial state on reset()

### REQ-4: Validation
- **MUST** implement canProceed() for each step
- **MUST** return true/false based on step requirements
- **MUST** allow optional steps (7, 8, 9) to proceed

### REQ-5: Calorie Calculation
- **MUST** calculate BMR using Harris-Benedict
- **MUST** calculate TDEE with activity multipliers
- **MUST** calculate target based on weight goal
- **MUST** return null if body data incomplete

## State Shape

```typescript
{
  currentStep: 1,
  level: null,
  goal: null,
  time: 30,
  equipment: [],
  duration: null,
  selectedExercises: [],
  selectedFoods: [],
  userName: "",
  userBodyData: null,
}
```

## Validation Rules

| Step | Condition |
|------|-----------|
| 1 | level !== null |
| 2 | goal !== null |
| 3 | time > 0 |
| 4 | equipment.length > 0 |
| 5 | duration !== null |
| 6 | userBodyData.weight > 0 && height > 0 && age > 0 |
| 7 | true (optional) |
| 8 | true (optional) |
| 9 | true (complete) |

## Scenarios

### Scenario: Toggle Equipment
```gherkin
Given equipment array is []
When toggleEquipment("mancuernas") is called
Then equipment should be ["mancuernas"]
When toggleEquipment("bandas") is called
Then equipment should be ["mancuernas", "bandas"]
When toggleEquipment("mancuernas") is called
Then equipment should be ["bandas"]
```

### Scenario: Calculate Calories
```gherkin
Given userBodyData = {
  currentWeight: 80,
  height: 175,
  age: 30,
  gender: "masculino",
  activityLevel: "moderado",
  weightGoal: "perder"
}
When calculateCalories() is called
Then BMR should be approximately 1838
And TDEE should be approximately 2849
And target should be approximately 2349 (TDEE - 500)
```

### Scenario: Step Validation
```gherkin
Given currentStep is 4
And equipment is []
When canProceed() is called
Then it should return false
When toggleEquipment("sin_equipo") is called
And canProceed() is called
Then it should return true
```

## Initial Body Data Default

```typescript
{
  currentWeight: 70,
  targetWeight: 70,
  height: 170,
  age: 25,
  gender: "masculino",
  activityLevel: "moderado",
  weightGoal: "mantener",
}
```
