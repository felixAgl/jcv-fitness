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

### FASE 4: Plan de Alimentacion
- [ ] 4.1 Crear schema de base de datos para planes de alimentacion
- [ ] 4.2 Crear tabla `meal_plans` (plan semanal)
- [ ] 4.3 Crear tabla `daily_meals` (5 comidas por dia)
- [ ] 4.4 Crear tabla `food_sources` (fuentes de proteina, carbos, grasas, vegetales)
- [ ] 4.5 Crear tabla `food_substitutions` (equivalencias de alimentos)
- [ ] 4.6 Seed de datos del plan de alimentacion (basado en PDF Fase 1)
- [ ] 4.7 Crear pagina dashboard de alimentacion
- [ ] 4.8 Crear componente de vista diaria de comidas
- [ ] 4.9 Crear componente de tabla de alimentos intercambiables
- [ ] 4.10 Crear componente de snacks permitidos
- [ ] 4.11 Crear seccion de recomendaciones y alimentos a evitar
- [ ] 4.12 Crear calculadora de porciones (pesos cocidos)

### FASE 5: Plan de Entrenamiento Gimnasio
- [ ] 5.1 Crear schema de base de datos para entrenamientos
- [ ] 5.2 Crear tabla `workout_plans` (plan semanal)
- [ ] 5.3 Crear tabla `workout_days` (Lunes a Sabado)
- [ ] 5.4 Crear tabla `exercises` (ejercicios con series, reps, descanso, observaciones)
- [ ] 5.5 Crear tabla `cardio_routines` (rutinas cardiovasculares)
- [ ] 5.6 Seed de datos del plan de gimnasio (basado en PDF Fase 1)
- [ ] 5.7 Crear pagina dashboard de entrenamiento gimnasio
- [ ] 5.8 Crear componente de rutina diaria
- [ ] 5.9 Crear componente de ejercicio individual (con espacio para video YouTube)
- [ ] 5.10 Crear componente de rutina cardiovascular
- [ ] 5.11 Crear seccion de suplementacion pre/intra/post entreno

### FASE 6: Plan de Entrenamiento Casa
- [ ] 6.1 Seed de datos del plan en casa (basado en PDF Fase 1)
- [ ] 6.2 Crear pagina dashboard de entrenamiento en casa
- [ ] 6.3 Reutilizar componentes de ejercicios adaptados
- [ ] 6.4 Crear toggle para alternar entre gimnasio/casa

### FASE 7: Tracking y Progreso
- [ ] 7.1 Crear tabla `user_progress` (peso, medidas, fotos)
- [ ] 7.2 Crear formulario de registro de pesaje semanal
- [ ] 7.3 Crear formulario de registro de medidas (biceps, pecho, cintura alta/baja, cadera, muslos)
- [ ] 7.4 Crear upload de fotos de progreso (frontal, lateral, espalda)
- [ ] 7.5 Crear grafico de evolucion de peso
- [ ] 7.6 Crear comparativa de fotos antes/despues
- [ ] 7.7 Crear recordatorios de chequeo (semana 2 y 4)

### FASE 8: Videos de Ejercicios
- [ ] 8.1 Agregar campo `video_url` a tabla exercises
- [ ] 8.2 Crear componente de video embebido (YouTube)
- [ ] 8.3 Crear modal de video para ver tecnica del ejercicio
- [ ] 8.4 Documentar proceso para agregar videos manualmente

### FASE 9: Pagina de FAQs
- [ ] 9.1 Crear pagina de preguntas frecuentes
- [ ] 9.2 Implementar accordion con todas las FAQs del PDF
- [ ] 9.3 Categorizar FAQs (alimentacion, entrenamiento, suplementos)

### FASE 10: Panel de Administracion (Basico)
- [ ] 10.1 Crear ruta protegida `/admin`
- [ ] 10.2 Crear vista de usuarios registrados
- [ ] 10.3 Crear CRUD basico para planes de alimentacion
- [ ] 10.4 Crear CRUD basico para ejercicios
- [ ] 10.5 Crear CRUD basico para agregar URLs de videos

### FASE 11: Pasarela de Pagos (Placeholder)
- [ ] 11.1 Crear pagina de planes y precios
- [ ] 11.2 Crear componente de seleccion de plan (4, 8, 12, 16 semanas)
- [ ] 11.3 Crear boton de pago (placeholder - redirige a WhatsApp temporalmente)
- [ ] 11.4 Documentar integracion futura con Mercado Pago o Wompi

### FASE 12: Optimizacion y Deploy
- [ ] 12.1 Optimizar imagenes con next/image
- [ ] 12.2 Implementar loading states y skeletons
- [ ] 12.3 Agregar meta tags SEO
- [ ] 12.4 Configurar Open Graph para redes sociales
- [ ] 12.5 Deploy a Vercel
- [ ] 12.6 Configurar dominio personalizado

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
