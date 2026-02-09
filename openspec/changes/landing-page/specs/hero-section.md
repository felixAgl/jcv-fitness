# Spec: Hero Section

## Overview
The hero section is the first thing users see, featuring a bold headline, value proposition, and primary call-to-action.

## Requirements

### REQ-1: Layout
- **MUST** be full viewport height (min-height: 100vh)
- **MUST** center content vertically and horizontally
- **MUST** account for fixed header (padding-top)
- **MUST** be responsive

### REQ-2: Visual Design
- **MUST** have animated background pattern
- **MUST** display glow effects on headline
- **MUST** use brand colors (cyan, red)
- **SHOULD** have subtle particle animation

### REQ-3: Content
- **MUST** display main headline
- **MUST** display subtitle/value proposition
- **MUST** show primary CTA button
- **MUST** show secondary CTA link
- **MUST** display feature highlights

### REQ-4: CTAs
- **MUST** link primary CTA to /wizard
- **MUST** link secondary CTA to #pricing
- **MUST** have hover effects

## Content Structure

```
TRANSFORMA TU CUERPO
TRANSFORMA TU VIDA

Plan de alimentacion y entrenamiento personalizado.
Resultados reales con JCV Fitness.

[COMENZAR AHORA ->]  [Ver planes]

[Utensils] Plan nutricional
[Dumbbell] Rutinas de ejercicio
```

## Visual Effects

### Headline Glow
```css
.text-accent-cyan.glow-cyan {
  text-shadow:
    0 0 10px rgba(0, 240, 255, 0.8),
    0 0 20px rgba(0, 240, 255, 0.6),
    0 0 40px rgba(0, 240, 255, 0.4);
}

.text-accent-red.glow-red {
  text-shadow:
    0 0 10px rgba(255, 51, 102, 0.8),
    0 0 20px rgba(255, 51, 102, 0.6),
    0 0 40px rgba(255, 51, 102, 0.4);
}
```

### Background Pattern
```css
.bg-pattern {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(0, 240, 255, 0.1) 0%,
    transparent 50%
  );
  animation: pulse 4s ease-in-out infinite;
}
```

### Particle Animation
```css
.bg-particles {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 20px 30px, #00f0ff, transparent),
    radial-gradient(2px 2px at 40px 70px, #00f0ff, transparent),
    ...
}
```

## CTA Button Styling

```css
.btn-cta {
  background: linear-gradient(135deg, #00f0ff 0%, #00cc99 100%);
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-weight: 700;
  color: black;
  transition: all 0.3s ease;
}

.btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 240, 255, 0.4);
}
```

## Responsive Behavior

| Breakpoint | Title Size | Layout |
|------------|------------|--------|
| Mobile | text-5xl | Single column, stacked |
| Desktop | text-7xl | Centered, inline CTAs |

## Scenarios

### Scenario: Primary CTA Click
```gherkin
Given the hero section is displayed
When the user clicks "COMENZAR AHORA"
Then the user should navigate to /wizard
```

### Scenario: Secondary CTA Click
```gherkin
Given the hero section is displayed
When the user clicks "Ver planes"
Then the page should smooth scroll to #pricing
```

## Accessibility

- Headline uses semantic h1
- CTAs are keyboard accessible
- Animations respect prefers-reduced-motion
- Sufficient color contrast
