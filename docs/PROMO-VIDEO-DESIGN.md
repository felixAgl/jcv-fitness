# JCV Fitness - Promo Video Design Document

## Overview
Video promocional usando **Remotion.dev** para mostrar las capacidades de la plataforma JCV Fitness.

**Duracion estimada**: 60-90 segundos
**Formato**: 1920x1080 (16:9) para web, 1080x1920 (9:16) para stories/reels
**FPS**: 30

---

## Inspiracion: physicalassessmentspreadsheet.com

El sitio de referencia usa:
- Animaciones de texto con gradientes llamativos
- Transiciones suaves entre secciones
- CTAs con gradientes (verde-azul, purpura, rojo-naranja)
- Overlays de imagenes de producto (spreadsheet)
- Headlines impactantes en espanol
- Estructura: Hook -> Valor -> Solucion -> CTA

---

## Estructura del Video

### Secuencia 1: Hook (0-5s)
**Objetivo**: Captar atencion inmediata

```
- Texto animado: "TRANSFORMA TU CUERPO"
- Gradiente cyan (#22d3ee) -> azul (#3b82f6)
- Logo JCV 24 FITNESS aparece con glow effect
- Fondo: Dark gradient con particulas animadas
```

**Componente Remotion**: `<HeroIntro />`

---

### Secuencia 2: Problema (5-12s)
**Objetivo**: Conectar con el dolor del usuario

```
- "Cansado de planes genericos?"
- "Sin saber que comer?"
- "Rutinas que no funcionan?"
- Texto aparece con efecto typewriter
- Fondo rojo suave para tension
```

**Componente Remotion**: `<ProblemStatement />`

---

### Secuencia 3: Solucion - Landing Preview (12-22s)
**Objetivo**: Mostrar la plataforma

```
- Screenshot animado del Hero
- Zoom suave hacia TransformationGallery
- Before/After images sliding
- Texto: "Plan 100% personalizado"
```

**Componente Remotion**: `<LandingShowcase />`

---

### Secuencia 4: Wizard Flow (22-42s)
**Objetivo**: Mostrar la personalizacion (CORE del video)

```
Mostrar flujo del wizard en time-lapse:

4a. Nivel (2s)
    - Cards de nivel con colores (verde->amarillo->rojo)
    - Seleccion animada con glow

4b. Objetivo (2s)
    - Iconos de muscle/fat loss/endurance
    - Selection scale animation

4c. Body Data (3s)
    - Form filling animation
    - BMR/TDEE/Calorias apareciendo en tiempo real
    - Highlight en "2,450 CALORIAS DIARIAS"

4d. Ejercicios (4s)
    - Tabs de muscle groups animandose
    - Search functionality
    - "Recomendados por JCV" badge
    - Counter badges incrementando

4e. Alimentos (3s)
    - Similar a ejercicios
    - Food icons animandose

4f. Resumen Final (3s)
    - Scroll suave por toda la configuracion
    - "Tu plan personalizado listo!"
```

**Componente Remotion**: `<WizardTimelapse />`

---

### Secuencia 5: PDF Generation (42-52s)
**Objetivo**: Mostrar el entregable premium

```
- Click en "Guardar Plan" con ripple effect
- Loading spinner
- PDF apareciendo pagina por pagina:
  1. Cover page con nombre del usuario
  2. Training overview con ejercicios
  3. Daily workout cards
  4. Calendar/Progress tracker
  5. Meal plan pages
- Flip animation entre paginas
- Texto: "Tu rutina profesional lista para imprimir"
```

**Componente Remotion**: `<PDFShowcase />`

---

### Secuencia 6: Dashboard (52-62s)
**Objetivo**: Mostrar experiencia post-compra

```
- Transicion al Dashboard
- Quick Actions panel
- Plan Status card
- Video tutorials preview
- WhatsApp support card
- Texto: "Acompanamiento completo"
```

**Componente Remotion**: `<DashboardPreview />`

---

### Secuencia 7: CTA Final (62-70s)
**Objetivo**: Call to action

```
- Pricing cards animandose
- "Mas popular" badge pulsando
- Precio grande: "$29,900 COP/mes"
- Boton "COMENZAR AHORA" con gradient animation
- Logo final + URL
- Texto: "jcv24fitness.com"
```

**Componente Remotion**: `<CTASection />`

---

## Paleta de Colores

```typescript
const colors = {
  background: '#000000',
  backgroundSecondary: '#0f172a',
  cyan: '#22d3ee',      // Primary
  blue: '#3b82f6',      // Accent
  red: '#ef4444',       // Advanced/CTA
  orange: '#f59e0b',    // Goals
  green: '#22c55e',     // Success/Save
  white: '#ffffff',
  gray: '#6b7280',
};
```

---

## Animaciones Clave

### Text Animations
- **FadeInUp**: Texto aparece de abajo hacia arriba con fade
- **TypeWriter**: Caracter por caracter
- **GlowPulse**: Texto con shadow pulsante
- **GradientShift**: Color shifting en gradiente

### UI Animations
- **ScaleOnSelect**: Cards escalan a 1.02x al seleccionar
- **RingGlow**: Ring animado alrededor de elementos seleccionados
- **SlideIn**: Elementos entran desde los lados
- **CountUp**: Numeros incrementando

### Transitions
- **CrossFade**: Transicion suave entre secciones
- **Zoom**: Zoom hacia elemento destacado
- **Wipe**: Transicion de izquierda a derecha

---

## Estructura de Archivos Remotion

```
src/
  remotion/
    compositions/
      PromoVideo.tsx           # Root composition
      HeroIntro.tsx
      ProblemStatement.tsx
      LandingShowcase.tsx
      WizardTimelapse.tsx
      PDFShowcase.tsx
      DashboardPreview.tsx
      CTASection.tsx
    components/
      AnimatedText.tsx
      GradientBackground.tsx
      DeviceMockup.tsx
      PageFlip.tsx
      ProgressBar.tsx
    assets/
      screenshots/
        hero.png
        wizard-level.png
        wizard-body.png
        wizard-exercises.png
        wizard-summary.png
        pdf-cover.png
        pdf-workout.png
        dashboard.png
        pricing.png
      fonts/
        Inter-Bold.ttf
        Inter-Regular.ttf
    utils/
      animations.ts
      colors.ts
      timing.ts
    index.ts
    Root.tsx
```

---

## Remotion Setup

### package.json additions
```json
{
  "dependencies": {
    "@remotion/cli": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    "remotion": "^4.0.0"
  },
  "scripts": {
    "video:dev": "remotion preview src/remotion/index.ts",
    "video:build": "remotion render src/remotion/index.ts PromoVideo out/promo.mp4"
  }
}
```

### Root.tsx
```tsx
import { Composition } from 'remotion';
import { PromoVideo } from './compositions/PromoVideo';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={2100} // 70s * 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoVideoVertical"
        component={PromoVideo}
        durationInFrames={2100}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ vertical: true }}
      />
    </>
  );
};
```

---

## Screenshots Necesarios

Para el video necesitamos capturas de:

1. **Landing Page**
   - Hero section completo
   - Transformation gallery
   - Meal plan preview
   - Workout plan preview

2. **Wizard Steps**
   - Step 1: Level selection (con nivel seleccionado)
   - Step 6: Body data (mostrando calculos)
   - Step 7: Exercises (con tabs y busqueda)
   - Step 8: Foods (similar)
   - Step 9: Summary (scroll completo)

3. **PDF Pages**
   - Cover page
   - Training overview
   - Daily workout
   - Calendar
   - Meal plan

4. **Dashboard**
   - Vista completa
   - Plan status card
   - Quick actions

5. **Pricing**
   - Cards con "Mas popular" destacado

---

## Timing Detallado (frames @ 30fps)

| Seccion | Inicio | Fin | Duracion |
|---------|--------|-----|----------|
| Hook | 0 | 150 | 5s |
| Problema | 150 | 360 | 7s |
| Landing | 360 | 660 | 10s |
| Wizard | 660 | 1260 | 20s |
| PDF | 1260 | 1560 | 10s |
| Dashboard | 1560 | 1860 | 10s |
| CTA | 1860 | 2100 | 8s |

---

## Audio (opcional)

- Background music: Upbeat, motivacional, royalty-free
- Sound effects:
  - Click sounds para selecciones
  - Whoosh para transiciones
  - Success chime para calculos completados

---

## Proximos Pasos

1. [ ] Instalar Remotion en el proyecto
2. [ ] Crear estructura de carpetas
3. [ ] Tomar screenshots de la app
4. [ ] Implementar componentes base (AnimatedText, GradientBackground)
5. [ ] Implementar cada secuencia individualmente
6. [ ] Integrar todas las secuencias
7. [ ] Agregar audio
8. [ ] Render final
9. [ ] Crear version vertical para stories

---

## Comandos Utiles

```bash
# Instalar Remotion
npm install --save-exact remotion @remotion/cli @remotion/renderer

# Preview en tiempo real
npx remotion preview src/remotion/index.ts

# Render MP4
npx remotion render src/remotion/index.ts PromoVideo out/promo.mp4

# Render GIF (para previews)
npx remotion render src/remotion/index.ts PromoVideo out/promo.gif --codec=gif

# Render frame especifico
npx remotion still src/remotion/index.ts PromoVideo out/frame.png --frame=100
```
