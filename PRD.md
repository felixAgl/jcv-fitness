# PRD - JCV Fitness: Plataforma de Transformacion Corporal

> **NOTA**: Este PRD esta disenado para ser ejecutado por el Ralph Loop.
> Cada tarea debe ser atomica y completable en una sola iteracion.

## Vision del Producto
Plataforma web para JCV Fitness que permite a los usuarios acceder a planes de alimentacion y entrenamiento personalizados, con videos demostrativos de ejercicios y futura integracion de pagos.

El contenido se basa en el plan de transformacion corporal de 4 semanas (FASE 1) que incluye:
- Plan de alimentacion de 7 dias (5 comidas diarias)
- Plan de entrenamiento gimnasio (6 dias: Lunes a Sabado)
- Plan de entrenamiento casa (4 dias)
- Tablas de intercambio de alimentos
- Rutinas cardiovasculares

---

## Stack Tecnologico
- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **State**: Zustand 5
- **Validation**: Zod 4
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Deployment**: Vercel
- **Payments**: (Placeholder - Mercado Pago o Wompi Colombia - TBD)

---

## Branding JCV Fitness
- **Colores principales**: Negro (#000000), Cyan (#22d3ee), Rojo (#ef4444), Verde Neon (#39ff14)
- **Tipografia**: Bebas Neue (titulos), Inter (cuerpo)
- **Tono**: Profesional, motivador, cercano
- **Instagram**: @jcvfitness

---

## Fases del Proyecto

### FASE 1: Fundacion y Estructura Base
- [ ] 1.1 Inicializar proyecto Next.js 15 con App Router y TypeScript usando `npx create-next-app@latest`
- [ ] 1.2 Configurar Tailwind CSS 4 con tema personalizado JCV Fitness (colores: negro #000, cyan #22d3ee, rojo #ef4444, verde neon #39ff14)
- [ ] 1.3 Configurar ESLint y Prettier con reglas estrictas
- [ ] 1.4 Crear estructura de carpetas screaming architecture segun el diagrama abajo
- [ ] 1.5 Instalar y configurar Supabase client (`@supabase/supabase-js`)
- [ ] 1.6 Crear archivo `src/lib/supabase/client.ts` con cliente de Supabase
- [ ] 1.7 Crear layout principal `src/app/layout.tsx` con fuentes Bebas Neue e Inter
- [ ] 1.8 Crear componente `src/components/layout/Navbar.tsx` responsive con logo JCV FITNESS
- [ ] 1.9 Crear componente `src/components/layout/Footer.tsx` con redes sociales

### FASE 2: Landing Page y Branding
- [ ] 2.1 Crear pagina `src/app/page.tsx` con estructura de landing page
- [ ] 2.2 Crear componente `src/components/landing/Hero.tsx` con titulo "TRANSFORMA TU CUERPO", subtitulo y CTA "Comenzar Transformacion"
- [ ] 2.3 Crear componente `src/components/landing/About.tsx` seccion "Sobre JCV Fitness"
- [ ] 2.4 Crear componente `src/components/landing/Transformations.tsx` con grid de testimonios placeholder (antes/despues)
- [ ] 2.5 Crear componente `src/components/landing/Plans.tsx` con cards para planes de 4, 8, 12, 16 semanas
- [ ] 2.6 Crear componente `src/components/landing/Features.tsx` con iconos de alimentacion, entrenamiento, seguimiento
- [ ] 2.7 Agregar animaciones CSS con Tailwind (hover effects, transitions, gradients animados)

### FASE 3: Sistema de Autenticacion
- [ ] 3.1 Crear tabla `profiles` en Supabase con campos: id, full_name, phone, plan_type, plan_start_date, current_phase, avatar_url
- [ ] 3.2 Crear pagina `src/app/(auth)/login/page.tsx` con formulario email/password
- [ ] 3.3 Crear pagina `src/app/(auth)/register/page.tsx` con formulario de registro
- [ ] 3.4 Crear pagina `src/app/(auth)/forgot-password/page.tsx` para recuperar contrasena
- [ ] 3.5 Crear componente `src/components/auth/AuthForm.tsx` reutilizable con Zod validation
- [ ] 3.6 Crear middleware `src/middleware.ts` para proteccion de rutas /dashboard/*
- [ ] 3.7 Crear Server Actions en `src/app/(auth)/actions.ts` para login, register, logout
- [ ] 3.8 Crear hook `src/hooks/useUser.ts` para obtener usuario actual

### FASE 4: Plan de Alimentacion - Base de Datos
- [ ] 4.1 Crear tabla `food_sources` en Supabase: id, category (protein/carb/fat/vegetable), name, portion_size, unit, notes
- [ ] 4.2 Crear tabla `meal_plans` en Supabase: id, phase, day_number, created_at
- [ ] 4.3 Crear tabla `daily_meals` en Supabase: id, meal_plan_id, meal_number, protein_source, protein_grams, carb_source, carb_grams, fat_source, fat_grams, vegetables, supplements, notes
- [ ] 4.4 Crear archivo `src/lib/data/food-sources.ts` con arrays de fuentes de proteina (20 items)
- [ ] 4.5 Crear archivo `src/lib/data/food-sources.ts` agregar fuentes de carbohidratos (22 items)
- [ ] 4.6 Crear archivo `src/lib/data/food-sources.ts` agregar fuentes de grasa (17 items)
- [ ] 4.7 Crear archivo `src/lib/data/food-sources.ts` agregar vegetales (22 items)
- [ ] 4.8 Crear seed SQL para insertar food_sources en Supabase
- [ ] 4.9 Crear archivo `src/lib/data/meal-plan-phase1.ts` con los 7 dias de comidas del PDF

### FASE 4B: Plan de Alimentacion - UI
- [ ] 4.10 Crear pagina `src/app/(dashboard)/alimentacion/page.tsx` con layout de dashboard
- [ ] 4.11 Crear componente `src/components/alimentacion/DaySelector.tsx` tabs para Dia 1-7
- [ ] 4.12 Crear componente `src/components/alimentacion/MealCard.tsx` card individual de comida con iconos
- [ ] 4.13 Crear componente `src/components/alimentacion/DailyMeals.tsx` grid de 5 comidas del dia
- [ ] 4.14 Crear componente `src/components/alimentacion/FoodTable.tsx` tabla de intercambio de alimentos
- [ ] 4.15 Crear componente `src/components/alimentacion/Snacks.tsx` seccion de snacks permitidos
- [ ] 4.16 Crear componente `src/components/alimentacion/Recommendations.tsx` recomendaciones y alimentos a evitar
- [ ] 4.17 Crear componente `src/components/alimentacion/WaterTracker.tsx` recordatorio de 4-5 litros diarios

### FASE 5: Plan de Entrenamiento Gimnasio - Base de Datos
- [ ] 5.1 Crear tabla `exercises` en Supabase: id, name, muscle_group, sets, reps, rest_seconds, observations, video_url, image_url
- [ ] 5.2 Crear tabla `workout_days` en Supabase: id, workout_type, day_name, muscle_groups, exercises_order
- [ ] 5.3 Crear tabla `cardio_routines` en Supabase: id, workout_day_id, timing, duration_minutes, execution_type, observations
- [ ] 5.4 Crear archivo `src/lib/data/exercises-gym.ts` con ejercicios de Lunes (Espalda+Pierna+ABS - 8 ejercicios)
- [ ] 5.5 Agregar ejercicios de Martes (Pecho+Hombro+Pantorrillas - 8 ejercicios)
- [ ] 5.6 Agregar ejercicios de Miercoles (ABS+Triceps - 8 ejercicios)
- [ ] 5.7 Agregar ejercicios de Jueves (Pierna+Gluteo+Biceps+Pantorrilla - 7 ejercicios)
- [ ] 5.8 Agregar ejercicios de Viernes (Espalda+Pecho+ABS - 8 ejercicios)
- [ ] 5.9 Agregar rutina de Sabado (grupo muscular a eleccion)
- [ ] 5.10 Crear archivo `src/lib/data/cardio-routines.ts` con rutinas cardio por dia

### FASE 5B: Plan de Entrenamiento Gimnasio - UI
- [ ] 5.11 Crear pagina `src/app/(dashboard)/entrenamiento/gimnasio/page.tsx`
- [ ] 5.12 Crear componente `src/components/entrenamiento/DayTabs.tsx` tabs Lunes-Sabado
- [ ] 5.13 Crear componente `src/components/entrenamiento/ExerciseCard.tsx` con imagen, series, reps, descanso, observaciones
- [ ] 5.14 Agregar campo video_url en ExerciseCard con icono de play (VIDEO_URL_PLACEHOLDER)
- [ ] 5.15 Crear componente `src/components/entrenamiento/WorkoutDay.tsx` lista de ejercicios del dia
- [ ] 5.16 Crear componente `src/components/entrenamiento/CardioSection.tsx` rutina cardiovascular (ayunas + post-entreno)
- [ ] 5.17 Crear componente `src/components/entrenamiento/Supplements.tsx` suplementacion intra/post entreno

### FASE 6: Plan de Entrenamiento Casa
- [ ] 6.1 Crear archivo `src/lib/data/exercises-home.ts` con ejercicios de Lunes casa (Pierna+Gluteo+ABS - 8 ejercicios)
- [ ] 6.2 Agregar ejercicios de Martes casa (Tren Superior+Cardio - 8 ejercicios)
- [ ] 6.3 Agregar ejercicios de Miercoles casa (Pierna+Gluteo+Cardio - 6 ejercicios)
- [ ] 6.4 Agregar ejercicios de Jueves casa (Tren Superior+ABS+Cardio - 6 ejercicios)
- [ ] 6.5 Crear pagina `src/app/(dashboard)/entrenamiento/casa/page.tsx`
- [ ] 6.6 Reutilizar componentes ExerciseCard y WorkoutDay para entrenamiento casa
- [ ] 6.7 Crear componente `src/components/entrenamiento/WorkoutTypeToggle.tsx` para alternar gimnasio/casa
- [ ] 6.8 Agregar nota: "Viernes y Sabado repetir Lunes y Martes respectivamente"

### FASE 7: Tracking y Progreso
- [ ] 7.1 Crear tabla `user_progress` en Supabase: id, user_id, date, weight_kg, biceps_cm, chest_cm, waist_high_cm, waist_low_cm, hip_cm, thigh_cm, photo_front_url, photo_side_url, photo_back_url, notes
- [ ] 7.2 Crear pagina `src/app/(dashboard)/progreso/page.tsx`
- [ ] 7.3 Crear componente `src/components/progreso/WeightForm.tsx` formulario de pesaje
- [ ] 7.4 Crear componente `src/components/progreso/MeasurementsForm.tsx` formulario de medidas corporales
- [ ] 7.5 Crear componente `src/components/progreso/PhotoUpload.tsx` upload de fotos (frontal, lateral, espalda)
- [ ] 7.6 Crear componente `src/components/progreso/WeightChart.tsx` grafico de evolucion con Recharts
- [ ] 7.7 Crear componente `src/components/progreso/PhotoComparison.tsx` comparativa antes/despues
- [ ] 7.8 Crear componente `src/components/progreso/CheckInReminder.tsx` recordatorio semana 2 y 4

### FASE 8: Videos de Ejercicios (YouTube)
- [ ] 8.1 Verificar que tabla exercises tiene campo video_url (nullable)
- [ ] 8.2 Crear componente `src/components/entrenamiento/VideoEmbed.tsx` para embeber YouTube
- [ ] 8.3 Crear componente `src/components/entrenamiento/VideoModal.tsx` modal fullscreen para ver video
- [ ] 8.4 Agregar boton de play en ExerciseCard que abre VideoModal
- [ ] 8.5 Crear archivo `docs/AGREGAR_VIDEOS.md` documentando como agregar URLs de YouTube
- [ ] 8.6 Usar placeholder "VIDEO_URL_PLACEHOLDER" en ejercicios sin video asignado

### FASE 9: Pagina de FAQs
- [ ] 9.1 Crear archivo `src/lib/data/faqs.ts` con todas las preguntas del PDF (20+ preguntas)
- [ ] 9.2 Crear pagina `src/app/faqs/page.tsx`
- [ ] 9.3 Crear componente `src/components/faqs/FAQAccordion.tsx` con animacion de expand/collapse
- [ ] 9.4 Categorizar FAQs: Alimentacion (cafe, sal, comidas, peso), Entrenamiento (cardio, ejercicios, fallo muscular), Suplementos (obligatorios, edad, cual comprar)

### FASE 10: Panel de Administracion (Basico)
- [ ] 10.1 Crear pagina `src/app/admin/page.tsx` con layout de admin
- [ ] 10.2 Crear middleware para verificar rol admin en Supabase
- [ ] 10.3 Crear componente `src/components/admin/UsersList.tsx` tabla de usuarios registrados
- [ ] 10.4 Crear componente `src/components/admin/ExerciseForm.tsx` para editar ejercicios
- [ ] 10.5 Crear componente `src/components/admin/VideoUrlEditor.tsx` para agregar URLs de YouTube a ejercicios
- [ ] 10.6 Crear Server Actions para CRUD de ejercicios y videos

### FASE 11: Pasarela de Pagos (Placeholder)
- [ ] 11.1 Crear pagina `src/app/planes/page.tsx` con cards de precios
- [ ] 11.2 Crear componente `src/components/planes/PlanCard.tsx` con precio, features, CTA
- [ ] 11.3 Definir precios en COP: Plan 4 semanas, 8 semanas, 12 semanas, 16 semanas
- [ ] 11.4 Crear boton "Adquirir Plan" que redirige a WhatsApp con mensaje pre-armado
- [ ] 11.5 Crear archivo `docs/INTEGRACION_PAGOS.md` documentando Mercado Pago y Wompi para Colombia
- [ ] 11.6 Agregar banner "Proximamente pago online" en pagina de planes

### FASE 12: Optimizacion y Deploy
- [ ] 12.1 Optimizar imagenes con next/image y formato webp
- [ ] 12.2 Crear componente `src/components/ui/Skeleton.tsx` para loading states
- [ ] 12.3 Implementar Suspense boundaries en paginas de dashboard
- [ ] 12.4 Agregar meta tags SEO en layout.tsx (title, description, keywords)
- [ ] 12.5 Configurar Open Graph tags para compartir en redes sociales
- [ ] 12.6 Crear archivo `vercel.json` con configuracion de deploy
- [ ] 12.7 Deploy inicial a Vercel
- [ ] 12.8 Configurar dominio personalizado (documentar proceso)

---

## Estructura de Carpetas (Screaming Architecture)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/
│   │   ├── alimentacion/
│   │   ├── entrenamiento/
│   │   │   ├── gimnasio/
│   │   │   └── casa/
│   │   ├── progreso/
│   │   └── perfil/
│   ├── admin/
│   ├── faqs/
│   ├── planes/
│   └── layout.tsx
├── components/
│   ├── ui/ (componentes genericos)
│   ├── alimentacion/
│   ├── entrenamiento/
│   ├── progreso/
│   └── layout/
├── lib/
│   ├── supabase/
│   ├── utils/
│   └── validations/
├── stores/
│   └── user-store.ts
├── types/
│   └── database.types.ts
└── styles/
    └── globals.css
```

---

## Modelo de Datos (Supabase)

### users (gestionado por Supabase Auth)
- id, email, created_at

### profiles
- id (FK users)
- full_name
- phone
- plan_type (4_weeks, 8_weeks, 12_weeks, 16_weeks)
- plan_start_date
- current_phase
- avatar_url

### meal_plans
- id
- phase (1, 2, 3, 4)
- day_number (1-7)
- created_at

### daily_meals
- id
- meal_plan_id (FK)
- meal_number (1-5)
- protein_source
- protein_grams
- carb_source
- carb_grams
- fat_source
- fat_grams
- vegetables
- supplements (JSONB)
- notes

### food_sources
- id
- category (protein, carb, fat, vegetable)
- name
- portion_size
- unit

### exercises
- id
- name
- muscle_group
- sets
- reps (puede ser texto: "15 (x2), 12 (x2), 10 (x1)")
- rest_seconds
- observations
- video_url (nullable - para agregar despues)
- image_url

### workout_days
- id
- workout_type (gym, home)
- day_name (Lunes, Martes, etc)
- muscle_groups (array: ["Espalda", "Pierna", "ABS"])
- exercises (JSONB array de exercise_id con orden)

### cardio_routines
- id
- workout_day_id (FK)
- timing (ayunas, post_entreno)
- duration_minutes
- execution_type
- observations
- supplements (JSONB)

### user_progress
- id
- user_id (FK)
- date
- weight_kg
- biceps_cm
- chest_cm
- waist_high_cm
- waist_low_cm
- hip_cm
- thigh_cm
- photo_front_url
- photo_side_url
- photo_back_url
- notes

---

## Datos del Plan de Alimentacion (Seed)

### Fuentes de Proteina
| Alimento | Porcion |
|----------|---------|
| Carne de res | 100g |
| Pechuga de pollo | 110g |
| Tilapia | 120g |
| Claras de huevo | 3 unidades |
| Atun | 100g |
| Trucha | 100g |
| Salmon | 100g |
| Yogur griego | 1 unidad (8g azucar) |
| Yogur light | 1 unidad |
| ULTRA LEAN PRO | 1 servicio |
| Pescados blancos | 120g |
| Pechuga de pavo | 110g |
| Carne de cerdo | 100g |
| Jamon de pavo | 100g |
| Jamon de cerdo | 100g |
| Bufalo | 110g |
| Calamares | 120g |
| Barra de proteina | 1 (max 200 Cal) |
| Queso Cottage | 120g |
| Huevos | 2 unidades |

### Fuentes de Carbohidratos
| Alimento | Porcion |
|----------|---------|
| Arroz blanco | 80g |
| Papa | 100g |
| Batata | 90g |
| Avena en hojuelas | 50g |
| Cualquier cereal | 30g |
| Granola | 30g |
| Yuca | 70g |
| Lentejas | 90g |
| Frijoles | 90g |
| Garbanzos | 90g |
| Pan | 1 1/2 rebanada |
| Pan integral | 1 1/2 rebanada |
| Tortilla para burrito | 1 (Mediana) |
| Platano maduro | 80g |
| Arepa de maiz | 30g |
| Pan pita | 1 (Mediano) |
| Cualquier fruta | 150g |
| Quinoa | 90g |
| Pasta | 90g |
| Crema de arroz | 50g |
| Tostadas de arroz/maiz/quinoa | 4 Unidades |
| Jugo natural sin azucar | 250ml |

### Fuentes de Grasa
| Alimento | Porcion |
|----------|---------|
| Mantequilla de mani | 12g |
| Fruto seco natural | 30g |
| Mantequilla | 12g |
| Queso crema light | 12g |
| Queso light | 30g |
| Cuajada o requeson | 30g |
| Leche de almendras/descremada | 250ml |
| Nutella | 10g |
| Tocineta | 12g |
| Aguacate | 30g |
| Aceite de oliva, canola o coco | 1 cda |
| Linaza | 12g |
| Aceitunas | 12g |
| Chia | 12g |
| Parmesano | 12g |
| Chocolatina de Cacao 70%+ | 3 tabletas |
| Chocolatinas light | 1/2 pequena |

### Vegetales (sin limite de porcion)
- Esparragos, Habichuelas, Pepino, Coles de bruselas, Zucchini, Pepino cohombro, Tomate, Tomate Cherry, Brocoli, Coliflor, Lechuga, Repollo, Espinaca, Apio, Calabaza, Alcachofa, Col, Remolacha, Pimenton, Chile, Zanahoria, Champinones

---

## Reglas de Negocio

### Alimentacion
- Comer cada 3 horas mientras esta despierto
- 4-5 litros de agua al dia
- 1 comida libre semanal (reemplaza una comida, no suma)
- Snacks opcionales: Quest Bar o 1 fruta al dia
- Alimentos se pesan COCIDOS (excepto avena y crema de arroz)
- Maximo 3 cafes al dia sin azucar

### Entrenamiento
- 6 dias de entrenamiento (Lunes a Sabado)
- Domingo descanso
- Cardio en ayunas + post-entreno
- 60 segundos de descanso entre series (salvo indicacion)

---

## Notas Importantes
- El PDF de referencia es de Metamorfosis Diet Master, pero el branding sera **JCV Fitness**
- Los videos de ejercicios se agregaran manualmente como URLs de YouTube
- La pasarela de pagos se definira despues (Mercado Pago o Wompi)
- Por ahora el boton de pago redirige a WhatsApp

---

## Criterios de Aceptacion
- Responsive design (mobile-first)
- Loading time < 3s
- Accesibilidad basica (contraste, alt texts)
- Datos reales del plan de alimentacion y entrenamiento
- Videos de ejercicios como placeholder (campo listo para agregar URLs)
