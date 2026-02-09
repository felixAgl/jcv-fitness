# Spec: StepSummary Component

## Overview
Step 9 displays a summary of all wizard selections and triggers plan generation.

## Requirements

### REQ-1: Summary Display
- **MUST** show selected training level
- **MUST** show selected goal
- **MUST** show session duration
- **MUST** show selected equipment
- **MUST** show program duration
- **MUST** show body data summary
- **MUST** show selected exercises count
- **MUST** show selected foods count

### REQ-2: Calorie Summary
- **MUST** display BMR calculation
- **MUST** display TDEE calculation
- **MUST** display target calories
- **MUST** explain calorie adjustments

### REQ-3: Plan Generation
- **MUST** show "Generar Plan" button
- **MUST** trigger plan creation on click
- **MUST** show loading state during generation
- **MUST** handle errors gracefully

### REQ-4: User Authentication
- **MUST** check if user is authenticated
- **MUST** prompt login if not authenticated
- **MUST** save plan after authentication
- **MUST** redirect to plan view on success

### REQ-5: Plan Preview
- **SHOULD** show preview of workout days
- **SHOULD** show preview of meal plan
- **SHOULD** indicate what's included in plan

## UI Layout

```
Resumen de Tu Plan

+----------------------------------+
|  Configuracion del Programa      |
|                                  |
|  Nivel:      Intermedio          |
|  Objetivo:   Ganar Musculo       |
|  Tiempo:     45 min/sesion       |
|  Equipo:     Gym Completo        |
|  Duracion:   1 Mes               |
+----------------------------------+

+----------------------------------+
|  Datos Corporales                |
|                                  |
|  Peso actual:    80 kg           |
|  Peso objetivo:  85 kg           |
|  Altura:         175 cm          |
|  Edad:           30 anos         |
+----------------------------------+

+----------------------------------+
|  Calorias Diarias                |
|                                  |
|  Metabolismo Basal:  1838 kcal   |
|  Gasto Diario:       2849 kcal   |
|  Objetivo:           3149 kcal   |
|                                  |
|  +300 kcal para ganar masa       |
+----------------------------------+

+----------------------------------+
|  Tu Plan Incluye                 |
|                                  |
|  [💪] 12 ejercicios seleccionados|
|  [🥗] 15 alimentos preferidos    |
|  [📋] Rutina semanal completa    |
|  [📊] Plan nutricional 7 dias    |
+----------------------------------+

[Anterior]  [Generar Mi Plan]

-- If not authenticated --
+----------------------------------+
|  Inicia sesion para guardar      |
|  tu plan personalizado           |
|                                  |
|  [Iniciar Sesion]                |
+----------------------------------+
```

## Generation Flow

```
Click "Generar Mi Plan"
    |
    v
Is user authenticated?
    |
    +-- NO --> Show AuthModal
    |            |
    |            v
    |          Login/Register
    |            |
    |            +-- Success --> Continue
    |
    +-- YES --> Generate plan
                    |
                    v
                Call planService.createPlan()
                    |
                    +-- Success --> Redirect to /plan/view
                    |
                    +-- Error --> Show error message
```

## Plan Creation Payload

```typescript
{
  userId: string,
  planData: {
    currentStep: 9,
    level: "intermedio",
    goal: "ganar_musculo",
    time: 45,
    equipment: ["gym_completo"],
    duration: "1_mes",
    selectedExercises: ["squat", "bench", ...],
    selectedFoods: ["chicken", "rice", ...],
    userName: "Juan",
    userBodyData: {
      currentWeight: 80,
      targetWeight: 85,
      height: 175,
      age: 30,
      gender: "masculino",
      activityLevel: "activo",
      weightGoal: "ganar"
    }
  },
  planType: "free"
}
```

## Error States

| Error | User Message |
|-------|--------------|
| Not authenticated | "Inicia sesion para guardar tu plan" |
| Already has plan | "Ya tienes un plan activo" |
| Free plan used | "Ya usaste tu plan gratuito" |
| Server error | "Error al crear el plan. Intenta de nuevo" |
