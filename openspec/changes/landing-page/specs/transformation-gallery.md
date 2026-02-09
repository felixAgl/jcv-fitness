# Spec: TransformationGallery Component

## Overview
A social proof section displaying real client transformations in an interactive carousel with statistics and trainer information.

## Requirements

### REQ-1: Carousel Display
- **MUST** use Swiper with coverflow effect
- **MUST** autoplay with 3-second delay
- **MUST** pause on hover
- **MUST** be navigable (arrows, pagination)
- **MUST** loop continuously

### REQ-2: Image Cards
- **MUST** display transformation images
- **MUST** show before/after or promotional images
- **MUST** include caption/alt text
- **MUST** have gradient overlay
- **SHOULD** show "JCV 24" badge on promos

### REQ-3: Statistics
- **MUST** display 500+ clients stat
- **MUST** display 40 days program stat
- **MUST** display 100% commitment stat
- **MUST** be visually prominent

### REQ-4: Trainer Card
- **MUST** display trainer profile image
- **MUST** show JCV 24 branding
- **MUST** include description text
- **MUST** have WhatsApp CTA

## Swiper Configuration

```typescript
{
  modules: [Autoplay, Pagination, Navigation, EffectCoverflow],
  effect: "coverflow",
  grabCursor: true,
  centeredSlides: true,
  slidesPerView: "auto",
  coverflowEffect: {
    rotate: 0,
    stretch: 0,
    depth: 100,
    modifier: 2.5,
    slideShadows: false,
  },
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  pagination: {
    clickable: true,
    dynamicBullets: true,
  },
  navigation: true,
  loop: false,
}
```

## Image Data Structure

```typescript
interface TransformationImage {
  id: string;
  url: string;
  alt: string;
  type: "before_after" | "promo" | "testimonial";
}
```

## Statistics Display

```
+------------------+     +------------------+     +------------------+
|      500+        |     |       40         |     |      100%        |
| Clientes         |     | Dias de          |     | Compromiso       |
| transformados    |     | programa         |     |                  |
+------------------+     +------------------+     +------------------+
```

## Trainer Card Layout

```
+-------------------------------------------------------------+
| [Profile Image]  Entrena conmigo - JCV 24 Fitness           |
|                                                              |
|                  Cupos limitados para quienes realmente      |
|                  quieren un cambio. No busco clientes,       |
|                  busco guerreros dispuestos a transformar    |
|                  su vida.                                    |
|                                                              |
|                  [WhatsApp Button] 314 382 64 30             |
+-------------------------------------------------------------+
```

## Scenarios

### Scenario: Carousel Navigation
```gherkin
Given the transformation gallery is displayed
When the user clicks the next arrow
Then the carousel should advance to the next slide
And the coverflow effect should animate
```

### Scenario: Autoplay Pause
```gherkin
Given the carousel is autoplaying
When the user hovers over the carousel
Then autoplay should pause
When the user moves the mouse away
Then autoplay should resume
```

### Scenario: WhatsApp CTA Click
```gherkin
Given the trainer card is visible
When the user clicks the WhatsApp button
Then a new tab should open with WhatsApp
And the contact number should be pre-filled
```

## Slide Sizing

```css
.swiper-slide {
  width: 300px;  /* Mobile */
}

@media (min-width: 768px) {
  .swiper-slide {
    width: 400px;  /* Desktop */
  }
}
```

## Image Card Styling

```css
.image-card {
  aspect-ratio: 3/4;
  border-radius: 1rem;
  overflow: hidden;
  position: relative;
}

.image-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8) 0%,
    transparent 50%
  );
}
```

## Promo Badge

```css
.promo-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: var(--accent-red);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  animation: pulse 2s infinite;
}
```
