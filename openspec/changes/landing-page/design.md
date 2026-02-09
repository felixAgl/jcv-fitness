# Design: Landing Page

## Architecture

```
+------------------+
|  Landing Page    |
|  /page.tsx       |
+------------------+
        |
        +----> Header (fixed)
        |        +-- Logo
        |        +-- Nav links
        |        +-- Auth buttons/user menu
        |        +-- AuthModal
        |
        +----> Hero Section
        |        +-- Title with glow effects
        |        +-- Subtitle
        |        +-- CTA buttons
        |        +-- Feature highlights
        |
        +----> TransformationGallery
        |        +-- Swiper carousel
        |        +-- Stats (500+, 40 days, 100%)
        |        +-- Trainer card
        |
        +----> MealPlanSection
        |        +-- Phase tabs
        |        +-- Week view
        |        +-- Day details
        |
        +----> WorkoutPlanSection
        |        +-- Plan type toggle (gym/home)
        |        +-- Day view
        |        +-- Exercise list
        |
        +----> PricingSection
        |        +-- 3 plan cards
        |        +-- Feature comparison
        |        +-- Payment badges
        |
        +----> Footer
                 +-- Logo
                 +-- Contact links
                 +-- Social links
```

## Component Design

### Header (`/src/features/landing/components/Header.tsx`)

**State:**
```typescript
const [isOpen, setIsOpen] = useState(false);      // Mobile menu
const [showAuth, setShowAuth] = useState(false);  // Auth modal
const [authMode, setAuthMode] = useState<"login" | "register">("login");
```

**Navigation Links:**
```typescript
const navLinks = [
  { href: "#meal-plan", label: "Alimentacion" },
  { href: "#workout-plan", label: "Entrenamiento" },
  { href: "#pricing", label: "Planes" },
];
```

**Features:**
- Fixed position with backdrop blur
- Logo with home link
- Desktop nav with smooth scrolling
- Mobile hamburger menu
- Auth state-aware buttons
- AuthModal integration

### Hero (`/src/features/landing/components/Hero.tsx`)

**Visual Elements:**
- Full viewport height
- Background pattern overlay
- Particle animation
- Glow effects on title

**Content:**
```
TRANSFORMA TU [CUERPO (cyan)]
TRANSFORMA TU [VIDA (red)]

Plan de alimentacion y entrenamiento personalizado.
Resultados reales con JCV Fitness.

[COMENZAR AHORA ->]  [Ver planes]

[Utensils icon] Plan nutricional
[Dumbbell icon] Rutinas de ejercicio
```

### TransformationGallery (`/src/features/landing/components/TransformationGallery.tsx`)

**Swiper Configuration:**
```typescript
{
  effect: "coverflow",
  centeredSlides: true,
  slidesPerView: "auto",
  coverflowEffect: {
    rotate: 0,
    stretch: 0,
    depth: 100,
    modifier: 2.5,
  },
  autoplay: { delay: 3000 },
  pagination: { clickable: true },
  navigation: true,
}
```

**Stats Display:**
- 500+ Clientes transformados
- 40 Dias de programa
- 100% Compromiso

**Trainer Card:**
- Profile image
- JCV 24 branding
- Description text
- WhatsApp CTA

### PricingSection

**Plan Cards:**
```typescript
const pricingPlans = [
  {
    name: "Basico",
    price: "49.900",
    features: [...],
  },
  {
    name: "Transformacion",
    price: "249.000",
    highlighted: true,
    features: [...],
  },
  {
    name: "Elite",
    price: "399.000",
    features: [...],
  },
];
```

**Trust Badges:**
- Pasarela de Pago: MercadoPago/Wompi
- Pago Seguro: SSL Encryption
- Proximamente: Integration status

## Page Sections Flow

```
[Header - fixed]
    |
[Hero - 100vh]
    |
    v (scroll)
[TransformationGallery]
    |
    v (scroll)
[MealPlanSection]
    |
    v (scroll)
[WorkoutPlanSection]
    |
    v (scroll)
[PricingSection]
    |
    v (scroll)
[Footer]
```

## Responsive Breakpoints

| Breakpoint | Width | Changes |
|------------|-------|---------|
| Mobile | < 768px | Hamburger menu, single column |
| Tablet | 768-1024px | 2-column grids |
| Desktop | > 1024px | Full layout, 3-column pricing |

## Color System

```css
--accent-cyan: #00f0ff;   /* Primary CTA, highlights */
--accent-red: #ff3366;    /* Secondary accent */
--accent-green: #00ff88;  /* Success states */
--background: #000000;    /* Main background */
--foreground: #ffffff;    /* Text */
--gray-400: #9ca3af;      /* Muted text */
--gray-800: #1f2937;      /* Borders, cards */
```

## Animation Effects

### Hero Glow
```css
.glow-cyan {
  text-shadow: 0 0 20px rgba(0, 240, 255, 0.5),
               0 0 40px rgba(0, 240, 255, 0.3);
}

.glow-red {
  text-shadow: 0 0 20px rgba(255, 51, 102, 0.5),
               0 0 40px rgba(255, 51, 102, 0.3);
}
```

### Background Pattern
```css
.bg-pattern {
  background-image: radial-gradient(
    circle at center,
    rgba(0, 240, 255, 0.05) 0%,
    transparent 70%
  );
}
```

### CTA Button
```css
.btn-cta {
  background: linear-gradient(135deg, #00f0ff, #00cc99);
  transition: all 0.3s ease;
}
.btn-cta:hover {
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
  transform: translateY(-2px);
}
```
