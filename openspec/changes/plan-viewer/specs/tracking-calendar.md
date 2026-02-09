# Spec: TrackingCalendar Component

## Overview
A calendar component for tracking daily workout completion and visualizing progress over the plan duration.

## Requirements

### REQ-1: Calendar Display
- **MUST** display current month
- **MUST** show all days in grid format
- **MUST** highlight current day
- **MUST** show plan start/end boundaries

### REQ-2: Progress Markers
- **MUST** mark completed workout days
- **MUST** mark partial completion days
- **MUST** mark rest days differently
- **MUST** show planned vs completed

### REQ-3: Day Interaction
- **MUST** allow clicking on past days
- **MUST** show day details on click
- **MUST** allow marking day as complete
- **MUST** prevent marking future days

### REQ-4: Statistics Display
- **MUST** show current streak
- **MUST** show longest streak
- **MUST** show completion percentage
- **MUST** show total workouts completed

## Props Interface

```typescript
interface TrackingCalendarProps {
  planId: string;
  planData: PlanDataWithProgress;
  workoutPlan: WorkoutDay[];
  planStartDate: Date;
  daysRemaining: number;
}
```

## Progress Data Structure

```typescript
interface PlanProgress {
  totalWeeks: number;
  currentWeek: number;
  weeks: WeekProgress[];
  stats: {
    totalWorkoutsCompleted: number;
    totalWorkoutsPlanned: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
  };
}

interface DayProgress {
  date: string;           // YYYY-MM-DD
  workoutCompleted: boolean;
  mealsTracked: boolean;
  notes?: string;
  exercisesCompleted?: string[];
  rating?: 1 | 2 | 3 | 4 | 5;
}
```

## Day Status Colors

| Status | Color | Description |
|--------|-------|-------------|
| Completed | Green | Workout finished |
| Partial | Yellow | Some exercises done |
| Missed | Red | Workout not done (past) |
| Rest | Gray | Planned rest day |
| Future | Default | Not yet due |
| Today | Cyan border | Current day |

## UI Layout

```
+----------------------------------+
|  < Febrero 2026 >                |
+----------------------------------+
|  L   M   M   J   V   S   D       |
+----------------------------------+
|      1   2   3   4   5   6       |
|  [G] [G] [Y] [G] [G] [-] [-]     |
|  7   8   9   10  11  12  13      |
|  [G] [G] [G] [G] [G] [-] [-]     |
|  14  15  16  17  18  19  20      |
|  [*] [ ] [ ] [ ] [ ] [ ] [ ]     |
+----------------------------------+

Legend:
[G] = Completed (green)
[Y] = Partial (yellow)
[-] = Rest day (gray)
[*] = Today (cyan border)
[ ] = Future/available
```

## Statistics Card

```
+----------------------------------+
|  Tu Progreso                     |
|                                  |
|  Racha actual:  5 dias           |
|  Mejor racha:   12 dias          |
|  Completados:   15/20 (75%)      |
+----------------------------------+
```

## Scenarios

### Scenario: View Current Month
```gherkin
Given a plan started on Feb 1
And today is Feb 14
When TrackingCalendar renders
Then February 2026 should be displayed
And days 1-13 should show completion status
And day 14 should have today indicator
And days 15-28 should be future
```

### Scenario: Mark Day Complete
```gherkin
Given a past workout day that is not completed
When the user clicks on that day
Then a modal should appear with completion options
When the user confirms completion
Then the day should turn green
And stats should update
```

### Scenario: View Rest Day
```gherkin
Given a day that is a planned rest day
When viewing the calendar
Then that day should show gray color
And clicking should show "Dia de descanso" message
```

### Scenario: Calculate Streak
```gherkin
Given days 1-5 are completed
And day 6 was missed
And days 7-10 are completed
Then currentStreak should be 4 (days 7-10)
And longestStreak should be 5 (days 1-5)
```

## Progress Persistence

```typescript
// Save progress update
async function updateDayProgress(
  planId: string,
  date: string,
  progress: Partial<DayProgress>
) {
  const { data } = await supabase
    .from("user_plans")
    .select("plan_data")
    .eq("id", planId)
    .single();

  const planData = data.plan_data as PlanDataWithProgress;
  const updatedProgress = {
    ...planData.progress,
    weeks: updateWeekProgress(planData.progress?.weeks, date, progress),
  };

  await supabase
    .from("user_plans")
    .update({
      plan_data: { ...planData, progress: updatedProgress },
    })
    .eq("id", planId);
}
```
