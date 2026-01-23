# PRD - JCV Fitness: Generador de Rutinas Personalizadas con PDF

## Vision del Producto
Plataforma web completa para JCV Fitness que permite a usuarios crear rutinas de entrenamiento personalizadas mediante un wizard interactivo, generar PDF descargable, visualizar planes de alimentacion, y procesar pagos via Mercado Pago/Wompi.

---

## Stack Tecnologico
- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **State**: Zustand 5
- **Validation**: Zod 4
- **PDF Generation**: jsPDF + html2canvas
- **Payments**: Mercado Pago SDK + Wompi Colombia
- **Deployment**: Vercel / GitHub Pages

---

## Branding JCV Fitness

### Colores (del index.html original)
```css
--bg-primary: #000000
--bg-secondary: #0a0a0a
--bg-card: rgba(15, 25, 45, 0.8)
--accent-cyan: #22d3ee
--accent-blue: #3b82f6
--accent-green: #39ff14
--accent-orange: #f59e0b
--accent-pink: #ec4899
--accent-purple: #8b5cf6
--accent-red: #ef4444
```

### Tipografia
- Bebas Neue (titulos)
- Inter (cuerpo)

---

## Funcionalidades Core del Wizard

### Paso 1: Nivel de Entrenamiento
- Principiante: "Tu primer paso"
- Basico: "Con algo de experiencia"
- Intermedio: "Entrenas regularmente"
- Avanzado: "Atleta experimentado"
- Elite: "Nivel competicion"

### Paso 2: Objetivo Principal
- Quemar Grasa (perder_grasa)
- Ganar Musculo (ganar_musculo)
- Tonificar
- Resistencia
- Flexibilidad
- Fuerza Pura
- Mas Energia
- Salud General

### Paso 3: Tiempo por Sesion
- 15, 20, 30, 45, 60, 90 minutos

### Paso 4: Equipamiento Disponible
- Sin Equipo
- Mancuernas
- Bandas elasticas
- Barra olimpica
- Banco
- Barra de dominadas
- Kettlebell
- Maquinas de gym
- TRX
- Step/Cajon
- Balon medicinal
- Cuerda de saltar

### Paso 5: Duracion del Programa
- 1 dia, 3 dias, 1 semana, 2 semanas, 1 mes, 6 semanas, 2 meses, 3 meses

### Paso 6: Seleccion de Ejercicios
- Categorias: Piernas, Pecho, Espalda, Brazos, Core, Cardio, Cuerpo Completo
- 100+ ejercicios con nombres en espanol, alternativos y tecnicos
- Filtro por equipamiento disponible

### Paso 7: Resumen y Generacion PDF
- Vista previa de selecciones
- Campo nombre personalizado
- Generacion PDF con diseno JCV Fitness

---

## Fases del Proyecto

### FASE 1: Reset y Configuracion Base
- [x] 1.1 Limpiar estructura existente y preparar nueva
- [ ] 1.2 Actualizar globals.css con colores originales del index.html
- [ ] 1.3 Crear tipos TypeScript para Wizard state
- [ ] 1.4 Crear store Zustand para wizard state

### FASE 2: Wizard - Componentes UI
- [ ] 2.1 Crear componente WizardProgress (stepper con 7 pasos)
- [ ] 2.2 Crear componente OptionCard (tarjeta seleccionable con icono)
- [ ] 2.3 Crear componente NavigationButtons (anterior/siguiente)
- [ ] 2.4 Crear layout WizardLayout con fondo animado

### FASE 3: Wizard - Pasos 1-4
- [ ] 3.1 Crear componente StepLevel (seleccion de nivel)
- [ ] 3.2 Crear componente StepGoal (seleccion de objetivo)
- [ ] 3.3 Crear componente StepTime (seleccion tiempo con slider)
- [ ] 3.4 Crear componente StepEquipment (multi-seleccion equipamiento)

### FASE 4: Wizard - Pasos 5-7
- [ ] 4.1 Crear componente StepDuration (seleccion duracion programa)
- [ ] 4.2 Crear data exercises.ts con 100+ ejercicios
- [ ] 4.3 Crear componente ExerciseCard (tarjeta de ejercicio)
- [ ] 4.4 Crear componente StepExercises (selector con filtros por categoria)
- [ ] 4.5 Crear componente StepSummary (resumen de selecciones)

### FASE 5: Generacion PDF
- [ ] 5.1 Instalar jspdf y html2canvas
- [ ] 5.2 Crear componente PDFContent (template del PDF)
- [ ] 5.3 Crear funcion generatePDF con soporte iOS/Safari
- [ ] 5.4 Crear componente LoadingOverlay animado
- [ ] 5.5 Implementar descarga PDF con nombre personalizado

### FASE 6: Landing Page
- [ ] 6.1 Crear seccion HeroSection con CTA animado
- [ ] 6.2 Crear seccion TestimonialsSection con cards
- [ ] 6.3 Crear seccion StatsSection (transformaciones, etc)
- [ ] 6.4 Crear boton WhatsApp flotante
- [ ] 6.5 Integrar wizard en landing o pagina separada /generar

### FASE 7: Plan de Alimentacion
- [ ] 7.1 Mantener MealPlanSection existente
- [ ] 7.2 Mantener FoodExchangeTable existente
- [ ] 7.3 Agregar navegacion a /alimentacion
- [ ] 7.4 Agregar link desde wizard completado

### FASE 8: Plan de Entrenamiento
- [ ] 8.1 Mantener WorkoutPlanSection existente (gym/casa)
- [ ] 8.2 Agregar VideoPlaceholder para cada ejercicio
- [ ] 8.3 Agregar navegacion a /entrenamiento
- [ ] 8.4 Integrar ejercicios seleccionados del wizard

### FASE 9: Integracion Pasarela de Pagos - Mercado Pago
- [ ] 9.1 Crear cuenta Mercado Pago developer
- [ ] 9.2 Instalar @mercadopago/sdk-react
- [ ] 9.3 Crear variables de entorno NEXT_PUBLIC_MP_PUBLIC_KEY
- [ ] 9.4 Crear componente MercadoPagoCheckout
- [ ] 9.5 Crear API route /api/payments/mercadopago/create-preference
- [ ] 9.6 Crear API route /api/payments/mercadopago/webhook
- [ ] 9.7 Crear pagina /pago/exito y /pago/error
- [ ] 9.8 Testear flujo completo con tarjetas de prueba

### FASE 10: Integracion Pasarela de Pagos - Wompi Colombia
- [ ] 10.1 Crear cuenta Wompi sandbox
- [ ] 10.2 Obtener llaves publica/privada de sandbox
- [ ] 10.3 Crear variables NEXT_PUBLIC_WOMPI_PUBLIC_KEY y WOMPI_PRIVATE_KEY
- [ ] 10.4 Crear componente WompiCheckout con widget
- [ ] 10.5 Crear API route /api/payments/wompi/create-transaction
- [ ] 10.6 Crear API route /api/payments/wompi/webhook para eventos
- [ ] 10.7 Implementar verificacion de firma Wompi
- [ ] 10.8 Crear selector de metodo de pago (Mercado Pago / Wompi)
- [ ] 10.9 Testear flujo con sandbox

### FASE 11: Pricing y Checkout
- [ ] 11.1 Actualizar PricingSection con precios en COP
- [ ] 11.2 Crear pagina /checkout/[planId]
- [ ] 11.3 Integrar seleccion de pasarela
- [ ] 11.4 Guardar transacciones en estado/local
- [ ] 11.5 Mostrar confirmacion post-pago

### FASE 12: Testing y Deploy
- [ ] 12.1 Agregar tests para wizard store
- [ ] 12.2 Agregar tests para generacion PDF
- [ ] 12.3 Agregar tests para APIs de pago
- [ ] 12.4 Configurar GitHub Actions para deploy
- [ ] 12.5 Deploy final y verificacion

---

## Estructura de Carpetas

```
src/
├── app/
│   ├── page.tsx (landing + wizard)
│   ├── layout.tsx
│   ├── globals.css
│   ├── generar/
│   │   └── page.tsx (wizard standalone)
│   ├── alimentacion/
│   │   └── page.tsx
│   ├── entrenamiento/
│   │   └── page.tsx
│   ├── checkout/
│   │   └── [planId]/page.tsx
│   ├── pago/
│   │   ├── exito/page.tsx
│   │   └── error/page.tsx
│   └── api/
│       └── payments/
│           ├── mercadopago/
│           │   ├── create-preference/route.ts
│           │   └── webhook/route.ts
│           └── wompi/
│               ├── create-transaction/route.ts
│               └── webhook/route.ts
├── features/
│   ├── wizard/
│   │   ├── components/
│   │   │   ├── WizardProgress.tsx
│   │   │   ├── OptionCard.tsx
│   │   │   ├── NavigationButtons.tsx
│   │   │   ├── StepLevel.tsx
│   │   │   ├── StepGoal.tsx
│   │   │   ├── StepTime.tsx
│   │   │   ├── StepEquipment.tsx
│   │   │   ├── StepDuration.tsx
│   │   │   ├── StepExercises.tsx
│   │   │   ├── StepSummary.tsx
│   │   │   └── index.ts
│   │   ├── store/
│   │   │   └── wizard-store.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── data/
│   │   │   └── exercises.ts
│   │   └── utils/
│   │       └── pdf-generator.ts
│   ├── meal-plan/ (existente)
│   ├── workout-plan/ (existente)
│   ├── payment/
│   │   ├── components/
│   │   │   ├── MercadoPagoCheckout.tsx
│   │   │   ├── WompiCheckout.tsx
│   │   │   ├── PaymentSelector.tsx
│   │   │   └── index.ts
│   │   └── types/
│   │       └── index.ts
│   └── landing/
│       └── components/
│           ├── HeroSection.tsx
│           ├── TestimonialsSection.tsx
│           ├── WhatsAppButton.tsx
│           └── index.ts
└── shared/
    ├── components/ui/
    ├── lib/
    └── types/
```

---

## Datos de Ejercicios (Estructura)

```typescript
interface Exercise {
  id: string;
  name: string;           // "Sentadillas"
  altName: string;        // "Cuclillas"
  techName: string;       // "Squat"
  emoji: string;          // "🦵"
  category: ExerciseCategory;
  muscle: string;         // "Cuadriceps, Gluteos"
  equipment: EquipmentType[];
}

type ExerciseCategory =
  | "piernas" | "pecho" | "espalda"
  | "brazos" | "core" | "cardio" | "cuerpo_completo";

type EquipmentType =
  | "sin_equipo" | "mancuernas" | "bandas" | "barra"
  | "banco" | "pull_up_bar" | "kettlebell" | "maquinas"
  | "trx" | "step" | "pelota" | "cuerda";
```

---

## Pasarelas de Pago - Detalles

### Mercado Pago (Argentina, Mexico, Brasil, Colombia)
- **SDK**: `@mercadopago/sdk-react`
- **Checkout Pro**: Redireccion a MP
- **Checkout Bricks**: Embebido en sitio
- **Tarjetas de prueba**:
  - Visa: 4509 9535 6623 3704
  - Mastercard: 5031 7557 3453 0604

### Wompi (Colombia)
- **Widget**: Embebido en pagina
- **Metodos**: PSE, Nequi, Bancolombia, Tarjetas
- **Sandbox URL**: https://sandbox.wompi.co
- **Production URL**: https://production.wompi.co
- **Eventos Webhook**:
  - transaction.updated
  - nequi_token.updated

---

## Variables de Entorno Requeridas

```env
# Mercado Pago
NEXT_PUBLIC_MP_PUBLIC_KEY=
MP_ACCESS_TOKEN=

# Wompi Colombia
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_EVENTS_SECRET=

# App
NEXT_PUBLIC_BASE_URL=https://felixagl.github.io/jcv-fitness
```
