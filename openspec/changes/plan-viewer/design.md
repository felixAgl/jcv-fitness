# Design: Plan Viewer System

## Architecture

```
+------------------+     +-------------------+     +----------------+
|  PlanViewPage    |     |  usePlan Hook     |     |  Supabase      |
|  /plan/view      |---->|  Plan Service     |---->|  user_plans    |
+------------------+     +-------------------+     +----------------+
        |
        v
+------------------+
|  PlanViewer      |
|  Component       |
+------------------+
        |
        +----> [Resumen Tab]
        |           +-- Configuration summary
        |           +-- Body data
        |           +-- Quick stats
        |           +-- Download CTA
        |
        +----> [Rutina Tab]
        |           +-- Day selector
        |           +-- Exercise list
        |           +-- Sets/reps/rest
        |
        +----> [Alimentacion Tab]
        |           +-- Day selector
        |           +-- Meal cards
        |           +-- Nutritional info
        |
        +----> [Calendario Tab]
                    +-- TrackingCalendar
                    +-- Progress stats
```

## Component Design

### PlanViewer (`/src/features/plans/components/PlanViewer.tsx`)

**Props:**
```typescript
interface PlanViewerProps {
  plan: UserPlan & {
    isExpired: boolean;
    daysRemaining: number;
  };
}
```

**State:**
```typescript
const [activeTab, setActiveTab] = useState<TabType>("resumen");
const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(0);
const [selectedMealDay, setSelectedMealDay] = useState(0);
```

**Tab Types:**
```typescript
type TabType = "resumen" | "rutina" | "alimentacion" | "calendario";
```

### Plan Data Structure

```typescript
interface UserPlan {
  id: string;
  userId: string;
  planData: PlanDataWithProgress;
  planType: "free" | "paid";
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  downloadCount: number;
}

interface PlanDataWithProgress extends WizardState {
  progress?: PlanProgress;
}
```

## Tab Layouts

### Resumen Tab
```
+----------------------------------+
|  Configuracion del Programa      |
|  [Grid: Nivel, Objetivo, Tiempo] |
|  [Grid: Duracion, Equipo]        |
+----------------------------------+

+----------------------------------+
|  Datos Corporales                |
|  [80kg actual] [85kg objetivo]   |
|  [175cm altura] [30 anos]        |
+----------------------------------+

+----------------------------------+
|  Quick Stats                     |
|  [5 Dias Entreno] [12 Ejercicios]|
|  [15 Alimentos]                  |
+----------------------------------+

+----------------------------------+
|  Descarga tu plan en PDF         |
|  [Descargar PDF] (if premium)    |
|  [Ver Planes Premium] (if free)  |
+----------------------------------+
```

### Rutina Tab
```
+----------------------------------+
|  Day Selector                    |
|  [Lun] [Mar] [Mie] [Jue] [Vie]   |
|  [Sab] [Dom]                     |
+----------------------------------+

+----------------------------------+
|  Dia 1 - Pecho y Triceps         |
|  Duracion: ~45 min | 6 ejercicios|
+----------------------------------+

|  [Muscle group badges]           |
|                                  |
|  +----------------------------+  |
|  | Exercise Card              |  |
|  | [emoji] Press Banca        |  |
|  | [4 series] [10 reps] [90s] |  |
|  +----------------------------+  |
|                                  |
|  [More exercise cards...]        |
+----------------------------------+
```

### Alimentacion Tab
```
+----------------------------------+
|  Day Selector                    |
|  [Dia 1] [Dia 2] ... [Dia 7]     |
+----------------------------------+

+----------------------------------+
|  Lunes - Resumen Nutricional     |
|  [2349 kcal] [P:150g] [C:280g]   |
|  [G:65g]                         |
+----------------------------------+

|  +----------------------------+  |
|  | Desayuno - 7:00 AM         |  |
|  | 620 kcal                   |  |
|  |                            |  |
|  | Avena (80g) - 300kcal      |  |
|  | Huevos (3) - 210kcal       |  |
|  | Banana (1) - 110kcal       |  |
|  +----------------------------+  |
|                                  |
|  [Almuerzo, Cena, Snacks...]     |
+----------------------------------+
```

### Calendario Tab
```
+----------------------------------+
|  TrackingCalendar Component      |
|                                  |
|  [Feb 2026]                      |
|  [S] [M] [T] [W] [T] [F] [S]     |
|       [1] [2] [3] [4] [5] [6]    |
|   [7] [8] ...                    |
|                                  |
|  Legend:                         |
|  [Green] Completed               |
|  [Yellow] Partial                |
|  [Gray] Rest day                 |
+----------------------------------+

+----------------------------------+
|  Stats                           |
|  Streak: 5 dias | Total: 12/20   |
|  Completion: 60%                 |
+----------------------------------+
```

## Plan Generation

### Workout Plan Generation
```typescript
const workoutPlan = generateWorkoutPlan(
  planData.level,        // Training level
  planData.goal,         // Training goal
  planData.selectedExercises,  // User's exercise selection
  planData.time          // Session duration
);

// Returns: WorkoutDay[] (7 days)
```

### Meal Plan Generation
```typescript
const mealPlan = generateMealPlan(
  targetCalories,        // Calculated target
  weightGoal,            // perder/mantener/ganar
  7                      // Number of days
);

// Returns: MealPlanDay[] (7 days)
```

## Expiration Handling

### Warning Banner (< 7 days)
```tsx
{!plan.isExpired && plan.daysRemaining <= 7 && (
  <div className="bg-yellow-500/10 border border-yellow-500/30">
    Tu plan vence en {plan.daysRemaining} dias
    <Link href="/pricing">Renovar</Link>
  </div>
)}
```

### Expired Overlay
```tsx
{plan.isExpired && <PlanExpiredOverlay />}
```

**Overlay Content:**
- Full-screen overlay
- "Tu plan ha expirado" message
- Renewal CTA button
- Dashboard link

## Data Flow

```
1. PlanViewPage mounts
    |
    v
2. usePlan hook fetches active plan
    |
    +-- Calls planService.getActivePlan()
    |
    v
3. Supabase function get_active_plan()
    |
    +-- Returns plan_data, is_expired, days_remaining
    |
    v
4. PlanViewer receives plan prop
    |
    v
5. Generate workout/meal plans from planData
    |
    v
6. Render active tab content
```

## PDF Download

### Flow
```
1. User clicks "Descargar PDF"
    |
    v
2. Check subscription status
    |
    +-- No subscription --> Show upgrade prompt
    |
    v
3. Call generatePDF(planData)
    |
    v
4. Register download (increment count)
    |
    v
5. Trigger browser download
```

### Premium Check
```typescript
const hasSubscription = profile?.has_active_subscription ?? false;

{hasSubscription ? (
  <button onClick={handleDownload}>Descargar PDF</button>
) : (
  <Link href="/pricing">Ver Planes Premium</Link>
)}
```
