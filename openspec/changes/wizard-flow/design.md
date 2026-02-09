# Design: Wizard Flow

## Architecture

```
+-------------------+     +------------------+     +----------------+
|  WizardContainer  |     |  Zustand Store   |     |  Supabase      |
|  Step Components  |<--->|  wizard-store.ts |---->|  user_plans    |
|  Navigation       |     |  localStorage    |     |  profiles      |
+-------------------+     +------------------+     +----------------+
        |
        v
+-------------------+
|  Plan Generation  |
|  workout-templates|
|  meal-templates   |
+-------------------+
```

## Component Design

### WizardContainer (`/src/features/wizard/components/WizardContainer.tsx`)

**Responsibilities:**
- Render current step based on store state
- Display progress indicator
- Wrap content in consistent layout

**Step Mapping:**
```typescript
switch (currentStep) {
  case 1: return <StepLevel />;
  case 2: return <StepGoal />;
  case 3: return <StepTime />;
  case 4: return <StepEquipment />;
  case 5: return <StepDuration />;
  case 6: return <StepBodyData />;
  case 7: return <StepExercises />;
  case 8: return <StepFoods />;
  case 9: return <StepSummary />;
}
```

### Wizard Store (`/src/features/wizard/store/wizard-store.ts`)

**State Interface:**
```typescript
interface WizardState {
  currentStep: number;                    // 1-9
  level: TrainingLevel | null;            // Step 1
  goal: TrainingGoal | null;              // Step 2
  time: number;                           // Step 3 (minutes)
  equipment: EquipmentType[];             // Step 4 (multi-select)
  duration: ProgramDuration | null;       // Step 5
  selectedExercises: string[];            // Step 7 (exercise IDs)
  selectedFoods: string[];                // Step 8 (food IDs)
  userName: string;                       // User's name
  userBodyData: UserBodyData | null;      // Step 6
}
```

**Actions:**
```typescript
interface WizardActions {
  setLevel: (level: TrainingLevel) => void;
  setGoal: (goal: TrainingGoal) => void;
  setTime: (time: number) => void;
  toggleEquipment: (equipment: EquipmentType) => void;
  setDuration: (duration: ProgramDuration) => void;
  toggleExercise: (exerciseId: string) => void;
  toggleFood: (foodId: string) => void;
  setUserBodyData: (data: UserBodyData) => void;
  updateBodyDataField: (field, value) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
  canProceed: () => boolean;
  calculateCalories: () => CalorieResult | null;
}
```

### Step Configuration

| Step | Component | Required Data | Validation |
|------|-----------|---------------|------------|
| 1 | StepLevel | level | level !== null |
| 2 | StepGoal | goal | goal !== null |
| 3 | StepTime | time | time > 0 |
| 4 | StepEquipment | equipment[] | equipment.length > 0 |
| 5 | StepDuration | duration | duration !== null |
| 6 | StepBodyData | userBodyData | weight, height, age > 0 |
| 7 | StepExercises | selectedExercises | Always valid |
| 8 | StepFoods | selectedFoods | Always valid |
| 9 | StepSummary | - | Always valid |

## Type System

### Training Level
```typescript
type TrainingLevel =
  | "principiante"  // 0-6 months
  | "basico"        // 6-12 months
  | "intermedio"    // 1-2 years
  | "avanzado"      // 2-5 years
  | "elite";        // 5+ years
```

### Training Goal
```typescript
type TrainingGoal =
  | "perder_grasa"   // Fat loss
  | "ganar_musculo"  // Muscle gain
  | "tonificar"      // Toning
  | "resistencia"    // Endurance
  | "flexibilidad"   // Flexibility
  | "fuerza"         // Strength
  | "energia"        // Energy
  | "salud";         // General health
```

### Equipment Types
```typescript
type EquipmentType =
  | "sin_equipo" | "gym_completo" | "mancuernas"
  | "bandas" | "barra" | "banco" | "pull_up_bar"
  | "kettlebell" | "maquinas" | "trx" | "step"
  | "pelota" | "cuerda" | "ligas" | "discos"
  | "poleas" | "soga_batalla";
```

### Body Data
```typescript
interface UserBodyData {
  currentWeight: number;
  targetWeight: number;
  height: number;
  age: number;
  gender: "masculino" | "femenino";
  activityLevel: ActivityLevel;
  weightGoal: "perder" | "mantener" | "ganar";
}
```

## Calorie Calculation

### Harris-Benedict Formula
```typescript
// Men
BMR = 66.5 + (13.75 * weight) + (5.003 * height) - (6.755 * age)

// Women
BMR = 655.1 + (9.563 * weight) + (1.850 * height) - (4.676 * age)
```

### Activity Multipliers
```typescript
const ACTIVITY_MULTIPLIERS = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};
```

### Target Calculation
```typescript
TDEE = BMR * activityMultiplier

if (weightGoal === "perder")
  target = TDEE - 500  // Deficit for ~0.5kg/week loss

if (weightGoal === "ganar")
  target = TDEE + 300  // Surplus for lean gains

if (weightGoal === "mantener")
  target = TDEE
```

## Persistence Strategy

```typescript
persist(store, {
  name: "jcv-wizard-state",
  partialize: (state) => ({
    currentStep: state.currentStep,
    level: state.level,
    goal: state.goal,
    time: state.time,
    equipment: state.equipment,
    duration: state.duration,
    selectedExercises: state.selectedExercises,
    selectedFoods: state.selectedFoods,
    userName: state.userName,
    userBodyData: state.userBodyData,
  }),
})
```

## Navigation Flow

```
Step 1 <--> Step 2 <--> Step 3 <--> Step 4 <--> Step 5
                                                  |
Step 9 <--> Step 8 <--> Step 7 <--> Step 6 <-----+

* Previous always available (except Step 1)
* Next requires validation (canProceed)
* Steps 7-8 allow skipping (optional selections)
* Step 9 triggers plan generation
```

## UI Components

### OptionCard
- Used in Steps 1, 2, 4, 5
- Shows label, description, optional emoji
- Handles selection state
- Supports single or multi-select

### ExerciseCard / FoodCard
- Used in Steps 7, 8
- Shows item details
- Category grouping
- Toggle selection

### NavigationButtons
- Previous button (disabled on Step 1)
- Next/Continue button
- Loading state support

### WizardProgress
- Visual progress bar
- Step counter (X of 9)
- Current step highlight
