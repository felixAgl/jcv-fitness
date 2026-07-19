import type { Lang } from "@/features/exercises";

/**
 * Landing page strings. Spanish is the source of truth (approved copy,
 * intentionally written without accents). English keeps the same energy,
 * not a literal word-by-word translation.
 *
 * `LandingStrings` is inferred from the Spanish object so a missing key in
 * `en` (or a typo when reading from a component) is a compile error.
 */
const es = {
  header: {
    navMeals: "Alimentacion",
    navWorkout: "Entrenamiento",
    navPricing: "Planes",
    myPanel: "Mi Panel",
    signOut: "Salir",
    signIn: "Iniciar sesion",
    register: "Registrarse",
    toggleMenu: "Abrir o cerrar menu",
    languageToggle: "Idioma / Language",
  },
  hero: {
    titleLine1Pre: "TRANSFORMA TU",
    titleLine1Highlight: "CUERPO",
    titleLine2Pre: "TRANSFORMA TU",
    titleLine2Highlight: "VIDA",
    subtitle:
      "Plan de alimentacion y entrenamiento personalizado. Resultados reales con JCV Fitness.",
    videoCaption: "Mira como funciona en 1 minuto",
    videoNotSupported: "Tu navegador no soporta videos.",
    ctaStart: "COMENZAR AHORA",
    ctaPlans: "Ver planes",
    badgeNutrition: "Plan nutricional",
    badgeWorkout: "Rutinas de ejercicio",
  },
  problem: {
    titlePre: "No basta con ",
    titleHighlight: "QUERER",
    titlePost: " cambiar...",
    subtitle: "Sin un plan estructurado, terminas perdiendo tiempo y motivacion",
    beforeAlt: "Antes de JCV Fitness",
    beforeBadge: "Sin plan",
    beforeItems: [
      "Dietas genericas de internet",
      "Rutinas que no van con tu nivel",
      "Sin seguimiento ni calendario",
      "Abandonas en 2 semanas",
    ],
    afterAlt: "Despues de JCV Fitness",
    afterBadge: "Con JCV Fitness",
    afterItems: [
      "Plan 100% personalizado",
      "Adaptado a TU nivel y objetivo",
      "Calendario con checkboxes",
      "PDF profesional descargable",
    ],
    vs: "VS",
  },
  features: {
    titlePre: "Todo lo que ",
    titleHighlight: "INCLUYE",
    titlePost: " tu plan",
    subtitle: "Un sistema completo para transformar tu cuerpo de manera profesional",
    items: [
      {
        title: "Tu Objetivo",
        description: "Perder grasa, ganar musculo o mantenerte. Todo adaptado a ti.",
      },
      {
        title: "Plan de Ejercicios",
        description: "Rutinas con series, repeticiones y descansos detallados.",
      },
      {
        title: "Plan Nutricional",
        description: "5 comidas diarias con macros y calorias calculadas.",
      },
      {
        title: "Calendario Semanal",
        description: "Checkboxes de progreso para cada dia de entrenamiento.",
      },
      {
        title: "PDF Profesional",
        description: "Descarga tu plan completo en formato PDF elegante.",
      },
      {
        title: "Seguimiento",
        description: "Dashboard para ver tu progreso y mantener la motivacion.",
      },
    ],
  },
  howItWorks: {
    titleHighlight: "3 PASOS",
    titlePost: " para tu transformacion",
    subtitle: "Tan simple que puedes empezar ahora mismo",
    steps: [
      {
        title: "Completa el Wizard",
        description:
          "Responde 6 preguntas sobre tu objetivo, nivel, y preferencias. Solo toma 2 minutos.",
      },
      {
        title: "Generamos tu Plan",
        description:
          "Nuestro sistema crea un plan de alimentacion y ejercicios 100% personalizado para ti.",
      },
      {
        title: "Descarga tu PDF",
        description:
          "Recibe un documento profesional con todo detallado: ejercicios, comidas, calendario y mas.",
      },
    ],
    cta: "COMENZAR MI PLAN AHORA",
    ctaNote: "Solo toma 2 minutos completar el wizard",
  },
  pdfShowcase: {
    titlePre: "Tu ",
    titleHighlight: "PDF PROFESIONAL",
    titlePost: " listo para descargar",
    subtitle: "Mira lo que recibiras: un documento completo y personalizado",
    pages: [
      { title: "Portada Personalizada", description: "Tu nombre, objetivo y nivel" },
      { title: "Plan de Entrenamiento", description: "Ejercicios con series y repeticiones" },
      { title: "Calendario Semanal", description: "Checkboxes de progreso diario" },
      { title: "Plan de Alimentacion", description: "5 comidas con macros detallados" },
    ],
    ctaTitle: "Quieres ver un ejemplo?",
    ctaText:
      "Mira como luce un plan generado por JCV Fitness. Profesional, detallado y facil de seguir.",
    ctaExample: "VER EJEMPLO",
    ctaCreate: "CREAR MI PLAN",
  },
  socialProof: {
    stats: [
      { value: "+500", label: "Usuarios activos" },
      { value: "+1,200", label: "Planes generados" },
      { value: "4.9", label: "Calificacion promedio" },
    ],
    titlePre: "Lo que dicen ",
    titleHighlight: "NUESTROS USUARIOS",
    subtitle: "Personas reales con resultados reales",
    testimonials: [
      {
        name: "Maria Garcia",
        date: "Enero 2025",
        text: "El plan de alimentacion es super completo. Me encanta que puedo ver las calorias de cada comida y el calendario me ayuda a no perder el ritmo.",
        avatar: "MG",
      },
      {
        name: "Carlos Rodriguez",
        date: "Diciembre 2024",
        text: "Las rutinas estan muy bien estructuradas. Los videos explicativos de cada ejercicio son un plus. Ya llevo 3 meses y los resultados se notan.",
        avatar: "CR",
      },
      {
        name: "Ana Martinez",
        date: "Enero 2025",
        text: "Lo mejor es que todo viene en PDF. Lo tengo en mi celular y puedo ver mi rutina en cualquier momento. Muy profesional.",
        avatar: "AM",
      },
    ],
  },
  gallery: {
    title1: "RESULTADOS",
    title2: "REALES",
    introPre: "Personas ",
    introHighlight: "reales como tu",
    introPost: ", que ya iniciaron su transformacion. Esto dicen algunas de ellas:",
    imageAlts: {
      "camilo-before": "Camilo - Inicio del proceso de transformacion",
      "camilo-after": "Camilo - Resultado despues del entrenamiento con JCV",
      "jcv-physique-1": "JCV Fitness - Resultados reales",
      "jcv-physique-2": "JCV Fitness - Definicion muscular",
    } as Record<string, string>,
    statClients: "Clientes transformados",
    statDays: "Días de programa",
    statCommitment: "Compromiso",
    trainerAlt: "JCV - Entrenador Personal",
    trainerTitle: "Entrena conmigo - JCV 24 Fitness",
    trainerText:
      "Cupos limitados para quienes realmente quieren un cambio. No busco clientes, busco guerreros dispuestos a transformar su vida.",
    legalNote: "Los resultados varian segun cada persona",
  },
  whatsapp: {
    // Prefilled chat messages (the user sees them inside WhatsApp before sending).
    genericMessage: "Hola JCV! Quiero empezar mi transformacion de 40 dias",
    // "{plan}" is replaced with the subscription plan name at render time.
    planMessage:
      "Hola JCV! Me interesa el plan {plan}. Quiero empezar mi transformacion de 40 dias",
    chatLabel: "Escribir por WhatsApp",
    sla: "Respondo en menos de 30 minutos",
  },
  stickyCta: {
    createPlan: "Crear mi plan — desde $49.900",
  },
  guarantee: {
    // NOTE: business commitment pending owner confirmation before production.
    text: "Si no ves resultados en 40 dias, rehacemos tu plan gratis",
  },
  pricing: {
    titlePre: "Elige tu ",
    titleHighlight: "plan",
    subtitle: "Invierte en tu salud. Elige el plan que mejor se adapte a tus objetivos.",
    popularBadge: "Mas popular",
    perMonth: "COP/mes",
    selectPlan: "Seleccionar plan",
    securePayment: "Pago seguro con Mercado Pago o Wompi",
    whatsappAsk: "Tienes dudas? Escribeme por WhatsApp",
    // Display copy for SUBSCRIPTION_PLANS (checkout keeps its own Spanish
    // plan names; these are landing-only labels keyed by PlanType).
    planNames: {
      PLAN_BASICO: "Basico",
      PLAN_PRO: "Pro",
      PLAN_PREMIUM: "Premium",
    },
    planFeatures: {
      PLAN_BASICO: [
        "Plan de alimentacion 7 dias",
        "Rutina de entrenamiento casa",
        "Acceso a la app",
        "Soporte por email",
      ],
      PLAN_PRO: [
        "Plan de alimentacion personalizado",
        "Rutina gimnasio + casa",
        "Videos de ejercicios",
        "Soporte prioritario",
        "Seguimiento semanal",
      ],
      PLAN_PREMIUM: [
        "Todo lo del plan Pro",
        "Coaching 1 a 1",
        "Ajustes mensuales",
        "Acceso a comunidad VIP",
        "Garantia de resultados",
      ],
    },
  },
  mealPlan: {
    titlePre: "Plan de ",
    titleHighlight: "Alimentacion",
    // "{phase}", "{duration}" and "{meals}" are replaced at render time.
    subtitle:
      "{phase} - {duration}. {meals} comidas diarias diseñadas para optimizar tu metabolismo y resultados.",
    previewLabel: "Vista previa del plan semanal",
    lockedDayTooltip: "Desbloquea el plan completo",
    // "{count}" is replaced at render time.
    lockedTitle: "+{count} dias de plan nutricional",
    lockedText:
      "Accede al plan completo con todas las comidas, recetas detalladas y tabla de intercambios de alimentos.",
    unlockCta: "Desbloquear Plan Completo",
  },
  workoutPlan: {
    titlePre: "Plan de ",
    titleHighlight: "Entrenamiento",
    // "{gymDays}" and "{homeDays}" are replaced at render time.
    subtitle:
      "Elige entre nuestro plan de gimnasio de {gymDays} dias o el plan para casa de {homeDays} dias. Ambos diseñados para maximizar resultados.",
    // "{days}" is replaced at render time.
    gymButton: "Gimnasio ({days} dias)",
    homeButton: "Casa ({days} dias)",
    lockedDayTooltip: "Desbloquea el plan completo",
    // "{count}" is replaced at render time.
    lockedTitle: "+{count} dias de entrenamiento",
    lockedText:
      "Accede al plan completo con todos los ejercicios, series, repeticiones y videos demostrativos.",
    unlockCta: "Desbloquear Plan Completo",
    // Labels rendered next to data-driven values (sets/reps come from data).
    setsLabel: "series",
    repsLabel: "reps",
    cardioTitle: "Cardio",
    intensityLabel: "Intensidad",
  },
  faq: {
    titlePre: "Preguntas ",
    titleHighlight: "FRECUENTES",
    subtitle: "Todo lo que necesitas saber antes de empezar",
    items: [
      {
        question: "Como funciona el plan personalizado?",
        answer:
          "Completas un wizard de 6 preguntas sobre tu objetivo (perder grasa, ganar musculo, etc), tu nivel de experiencia, dias disponibles para entrenar, y preferencias alimenticias. Con esa informacion, generamos un plan de alimentacion y ejercicios 100% adaptado a ti.",
      },
      {
        question: "Que incluye el PDF que descargo?",
        answer:
          "El PDF incluye: tu plan de alimentacion con 5 comidas diarias y macros detallados, tu rutina de ejercicios con series, repeticiones y descansos, un calendario semanal con checkboxes para marcar tu progreso, y recomendaciones personalizadas segun tu objetivo.",
      },
      {
        question: "Puedo usar el plan en mi celular?",
        answer:
          "Si. El PDF es compatible con cualquier dispositivo. Ademas, desde tu dashboard puedes ver tu plan de alimentacion y ejercicios de forma interactiva, con videos de cada ejercicio.",
      },
      {
        question: "Que pasa si tengo restricciones alimenticias?",
        answer:
          "En el wizard puedes indicar si eres vegetariano, vegano, o tienes alergias. El plan se ajusta automaticamente para excluir esos alimentos y sugerirte alternativas.",
      },
      {
        question: "Cuanto tiempo dura la suscripcion?",
        answer:
          "Ofrecemos planes mensuales, trimestrales y anuales. Puedes cancelar en cualquier momento desde tu dashboard. Mientras tu suscripcion este activa, tienes acceso a tu plan, dashboard, y puedes regenerar tu plan si cambias de objetivo.",
      },
      {
        question: "Puedo cambiar mi plan si no me gusta?",
        answer:
          "Si. Puedes volver a completar el wizard y regenerar tu plan cuantas veces quieras mientras tu suscripcion este activa. Esto es util si cambias de objetivo o quieres probar una rutina diferente.",
      },
      {
        question: "Como me contacto si tengo dudas?",
        answer:
          "Puedes escribirnos por WhatsApp o email. Respondemos en menos de 24 horas. El link de contacto esta en el footer de la pagina.",
      },
    ],
  },
  footer: {
    description:
      "Transforma tu cuerpo con planes de alimentacion personalizados y rutinas de entrenamiento disenadas por JCV 24 Fitness.",
    linksTitle: "Enlaces",
    linkMeals: "Plan Alimenticio",
    linkWorkout: "Plan de Entrenamiento",
    linkPricing: "Precios",
    linkGenerator: "Generador de Rutinas",
    linkNutrition: "Nutricion",
    contactTitle: "Contacto",
    rightsReserved: "Todos los derechos reservados.",
    madeWithPre: "Desarrollado con",
    madeWithHeart: "amor",
    madeWithPost: "para guerreros",
  },
};

export type LandingStrings = typeof es;

const en: LandingStrings = {
  header: {
    navMeals: "Nutrition",
    navWorkout: "Training",
    navPricing: "Plans",
    myPanel: "My Dashboard",
    signOut: "Sign out",
    signIn: "Sign in",
    register: "Sign up",
    toggleMenu: "Toggle menu",
    languageToggle: "Idioma / Language",
  },
  hero: {
    titleLine1Pre: "TRANSFORM YOUR",
    titleLine1Highlight: "BODY",
    titleLine2Pre: "TRANSFORM YOUR",
    titleLine2Highlight: "LIFE",
    subtitle:
      "Personalized nutrition and training plan. Real results with JCV Fitness.",
    videoCaption: "See how it works in 1 minute",
    videoNotSupported: "Your browser does not support videos.",
    ctaStart: "START NOW",
    ctaPlans: "See plans",
    badgeNutrition: "Nutrition plan",
    badgeWorkout: "Workout routines",
  },
  problem: {
    titlePre: "It takes more than ",
    titleHighlight: "WANTING",
    titlePost: " to change...",
    subtitle: "Without a structured plan, you end up wasting time and motivation",
    beforeAlt: "Before JCV Fitness",
    beforeBadge: "No plan",
    beforeItems: [
      "Generic diets from the internet",
      "Routines that don't match your level",
      "No tracking, no calendar",
      "You quit after 2 weeks",
    ],
    afterAlt: "After JCV Fitness",
    afterBadge: "With JCV Fitness",
    afterItems: [
      "100% personalized plan",
      "Adapted to YOUR level and goal",
      "Calendar with checkboxes",
      "Downloadable professional PDF",
    ],
    vs: "VS",
  },
  features: {
    titlePre: "Everything your plan ",
    titleHighlight: "INCLUDES",
    titlePost: "",
    subtitle: "A complete system to transform your body like a pro",
    items: [
      {
        title: "Your Goal",
        description: "Lose fat, build muscle or maintain. Everything tailored to you.",
      },
      {
        title: "Workout Plan",
        description: "Routines with detailed sets, reps and rest times.",
      },
      {
        title: "Nutrition Plan",
        description: "5 daily meals with calculated macros and calories.",
      },
      {
        title: "Weekly Calendar",
        description: "Progress checkboxes for every training day.",
      },
      {
        title: "Professional PDF",
        description: "Download your full plan as a polished PDF.",
      },
      {
        title: "Tracking",
        description: "A dashboard to watch your progress and stay motivated.",
      },
    ],
  },
  howItWorks: {
    titleHighlight: "3 STEPS",
    titlePost: " to your transformation",
    subtitle: "So simple you can start right now",
    steps: [
      {
        title: "Complete the Wizard",
        description:
          "Answer 6 questions about your goal, level and preferences. It only takes 2 minutes.",
      },
      {
        title: "We Build Your Plan",
        description:
          "Our system creates a nutrition and workout plan 100% personalized for you.",
      },
      {
        title: "Download Your PDF",
        description:
          "Get a professional document with everything laid out: workouts, meals, calendar and more.",
      },
    ],
    cta: "START MY PLAN NOW",
    ctaNote: "The wizard only takes 2 minutes to complete",
  },
  pdfShowcase: {
    titlePre: "Your ",
    titleHighlight: "PROFESSIONAL PDF",
    titlePost: " ready to download",
    subtitle: "Here's what you'll get: a complete, personalized document",
    pages: [
      { title: "Personalized Cover", description: "Your name, goal and level" },
      { title: "Workout Plan", description: "Exercises with sets and reps" },
      { title: "Weekly Calendar", description: "Daily progress checkboxes" },
      { title: "Nutrition Plan", description: "5 meals with detailed macros" },
    ],
    ctaTitle: "Want to see an example?",
    ctaText:
      "See what a plan generated by JCV Fitness looks like. Professional, detailed and easy to follow.",
    ctaExample: "SEE EXAMPLE",
    ctaCreate: "CREATE MY PLAN",
  },
  socialProof: {
    stats: [
      { value: "+500", label: "Active users" },
      { value: "+1,200", label: "Plans generated" },
      { value: "4.9", label: "Average rating" },
    ],
    titlePre: "What ",
    titleHighlight: "OUR USERS",
    subtitle: "Real people with real results",
    testimonials: [
      {
        name: "Maria Garcia",
        date: "January 2025",
        text: "The nutrition plan is super complete. I love that I can see the calories in every meal, and the calendar keeps me on track.",
        avatar: "MG",
      },
      {
        name: "Carlos Rodriguez",
        date: "December 2024",
        text: "The routines are really well structured. The video explanations for each exercise are a plus. Three months in and the results show.",
        avatar: "CR",
      },
      {
        name: "Ana Martinez",
        date: "January 2025",
        text: "The best part is that everything comes as a PDF. I keep it on my phone and can check my routine anytime. Very professional.",
        avatar: "AM",
      },
    ],
  },
  gallery: {
    title1: "REAL",
    title2: "RESULTS",
    introPre: "Real people ",
    introHighlight: "just like you",
    introPost: " who already started their transformation. Here's what some of them say:",
    imageAlts: {
      "camilo-before": "Camilo - Start of his transformation journey",
      "camilo-after": "Camilo - Result after training with JCV",
      "jcv-physique-1": "JCV Fitness - Real results",
      "jcv-physique-2": "JCV Fitness - Muscle definition",
    } as Record<string, string>,
    statClients: "Clients transformed",
    statDays: "Program days",
    statCommitment: "Commitment",
    trainerAlt: "JCV - Personal Trainer",
    trainerTitle: "Train with me - JCV 24 Fitness",
    trainerText:
      "Limited spots for those who truly want a change. I'm not looking for clients, I'm looking for warriors ready to transform their lives.",
    legalNote: "Results vary from person to person",
  },
  whatsapp: {
    genericMessage: "Hi JCV! I want to start my 40-day transformation",
    planMessage: "Hi JCV! I'm interested in the {plan} plan. I want to start my 40-day transformation",
    chatLabel: "Chat on WhatsApp",
    sla: "I reply within 30 minutes",
  },
  stickyCta: {
    createPlan: "Create my plan — from $49.900",
  },
  guarantee: {
    text: "If you don't see results in 40 days, we redo your plan for free",
  },
  pricing: {
    titlePre: "Choose your ",
    titleHighlight: "plan",
    subtitle: "Invest in your health. Pick the plan that best fits your goals.",
    popularBadge: "Most popular",
    perMonth: "COP/month",
    selectPlan: "Select plan",
    securePayment: "Secure payment with Mercado Pago or Wompi",
    whatsappAsk: "Questions? Message me on WhatsApp",
    planNames: {
      PLAN_BASICO: "Basic",
      PLAN_PRO: "Pro",
      PLAN_PREMIUM: "Premium",
    },
    planFeatures: {
      PLAN_BASICO: [
        "7-day nutrition plan",
        "Home workout routine",
        "App access",
        "Email support",
      ],
      PLAN_PRO: [
        "Personalized nutrition plan",
        "Gym + home routine",
        "Exercise videos",
        "Priority support",
        "Weekly check-ins",
      ],
      PLAN_PREMIUM: [
        "Everything in Pro",
        "1-on-1 coaching",
        "Monthly adjustments",
        "VIP community access",
        "Results guarantee",
      ],
    },
  },
  mealPlan: {
    titlePre: "Nutrition ",
    titleHighlight: "Plan",
    subtitle:
      "{phase} - {duration}. {meals} daily meals designed to optimize your metabolism and results.",
    previewLabel: "Weekly plan preview",
    lockedDayTooltip: "Unlock the full plan",
    lockedTitle: "+{count} days of nutrition plan",
    lockedText:
      "Get the full plan with every meal, detailed recipes and the food exchange table.",
    unlockCta: "Unlock Full Plan",
  },
  workoutPlan: {
    titlePre: "Workout ",
    titleHighlight: "Plan",
    subtitle:
      "Choose between our {gymDays}-day gym plan or the {homeDays}-day home plan. Both designed to maximize results.",
    gymButton: "Gym ({days} days)",
    homeButton: "Home ({days} days)",
    lockedDayTooltip: "Unlock the full plan",
    lockedTitle: "+{count} training days",
    lockedText:
      "Get the full plan with every exercise, sets, reps and demo videos.",
    unlockCta: "Unlock Full Plan",
    setsLabel: "sets",
    repsLabel: "reps",
    cardioTitle: "Cardio",
    intensityLabel: "Intensity",
  },
  faq: {
    titlePre: "Frequently asked ",
    titleHighlight: "QUESTIONS",
    subtitle: "Everything you need to know before getting started",
    items: [
      {
        question: "How does the personalized plan work?",
        answer:
          "You complete a 6-question wizard about your goal (lose fat, build muscle, etc.), your experience level, available training days, and food preferences. With that information, we generate a nutrition and workout plan 100% adapted to you.",
      },
      {
        question: "What does the PDF include?",
        answer:
          "The PDF includes: your nutrition plan with 5 daily meals and detailed macros, your workout routine with sets, reps and rest times, a weekly calendar with checkboxes to track your progress, and personalized recommendations based on your goal.",
      },
      {
        question: "Can I use the plan on my phone?",
        answer:
          "Yes. The PDF works on any device. Plus, from your dashboard you can view your nutrition and workout plan interactively, with videos for every exercise.",
      },
      {
        question: "What if I have dietary restrictions?",
        answer:
          "In the wizard you can indicate if you are vegetarian, vegan, or have allergies. The plan adjusts automatically to exclude those foods and suggest alternatives.",
      },
      {
        question: "How long does the subscription last?",
        answer:
          "We offer monthly, quarterly and annual plans. You can cancel anytime from your dashboard. While your subscription is active, you have access to your plan and dashboard, and you can regenerate your plan if your goal changes.",
      },
      {
        question: "Can I change my plan if I don't like it?",
        answer:
          "Yes. You can retake the wizard and regenerate your plan as many times as you want while your subscription is active. This is useful if you change your goal or want to try a different routine.",
      },
      {
        question: "How do I get in touch if I have questions?",
        answer:
          "You can reach us via WhatsApp or email. We reply within 24 hours. The contact link is in the page footer.",
      },
    ],
  },
  footer: {
    description:
      "Transform your body with personalized nutrition plans and training routines designed by JCV 24 Fitness.",
    linksTitle: "Links",
    linkMeals: "Nutrition Plan",
    linkWorkout: "Workout Plan",
    linkPricing: "Pricing",
    linkGenerator: "Routine Generator",
    linkNutrition: "Nutrition",
    contactTitle: "Contact",
    rightsReserved: "All rights reserved.",
    madeWithPre: "Built with",
    madeWithHeart: "love",
    madeWithPost: "for warriors",
  },
};

export const LANDING_STRINGS: Record<Lang, LandingStrings> = { es, en };
