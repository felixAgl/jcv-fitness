# Spec: StepBodyData Component

## Overview
Step 6 of the wizard collects user's physical measurements and activity level for calorie calculations.

## Requirements

### REQ-1: Data Collection
- **MUST** collect current weight (kg)
- **MUST** collect target weight (kg)
- **MUST** collect height (cm)
- **MUST** collect age (years)
- **MUST** collect gender (masculino/femenino)
- **MUST** collect activity level (5 options)
- **MUST** collect weight goal (perder/mantener/ganar)

### REQ-2: Input Validation
- **MUST** validate weight is between 30-300 kg
- **MUST** validate height is between 100-250 cm
- **MUST** validate age is between 12-99 years
- **MUST** show validation errors inline

### REQ-3: Real-time Calorie Display
- **MUST** display calculated BMR
- **MUST** display calculated TDEE
- **MUST** display target calories
- **MUST** update calculations on any input change

### REQ-4: Activity Level Options
- **MUST** display 5 activity levels
- **MUST** show description for each level
- **MUST** highlight selected level

## Activity Levels

| Value | Label | Description |
|-------|-------|-------------|
| sedentario | Sedentario | Trabajo de oficina, poco movimiento |
| ligero | Ligero | Ejercicio 1-2 veces/semana |
| moderado | Moderado | Ejercicio 3-4 veces/semana |
| activo | Activo | Ejercicio 5-6 veces/semana |
| muy_activo | Muy Activo | Atleta o trabajo fisico intenso |

## Weight Goal Options

| Value | Label | Emoji | Calorie Adjustment |
|-------|-------|-------|-------------------|
| perder | Perder Peso | 📉 | TDEE - 500 |
| mantener | Mantener Peso | ⚖️ | TDEE |
| ganar | Ganar Masa | 📈 | TDEE + 300 |

## UI Layout

```
Tu Informacion Fisica

[Weight Input]  [Height Input]  [Age Input]
     70 kg          170 cm         25

[Gender Toggle]
  [Masculino] [Femenino]

Nivel de Actividad
  [Sedentario]
  [Ligero]
  [Moderado]  <- selected
  [Activo]
  [Muy Activo]

Tu Objetivo
  [📉 Perder]  [⚖️ Mantener]  [📈 Ganar]

+----------------------------------+
|  Tus Calorias Diarias            |
|                                  |
|  BMR:    1838 kcal               |
|  TDEE:   2849 kcal               |
|  Target: 2349 kcal               |
+----------------------------------+

[Anterior]  [Siguiente]
```

## Validation Messages

| Field | Error Condition | Message |
|-------|-----------------|---------|
| weight | < 30 or > 300 | Peso debe estar entre 30 y 300 kg |
| height | < 100 or > 250 | Altura debe estar entre 100 y 250 cm |
| age | < 12 or > 99 | Edad debe estar entre 12 y 99 anos |
