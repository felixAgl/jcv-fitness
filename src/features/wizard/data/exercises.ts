import type { Exercise } from "../types";

export const exercises: Exercise[] = [
  // PIERNAS
  { id: "sentadilla", name: "Sentadillas", altName: "Cuclillas", techName: "Squat", emoji: "🦵", category: "piernas", muscle: "Cuadriceps, Gluteos", equipment: ["sin_equipo", "mancuernas", "barra"] },
  { id: "sentadilla_sumo", name: "Sentadilla Sumo", altName: "Cuclilla abierta", techName: "Sumo Squat", emoji: "🦵", category: "piernas", muscle: "Aductores, Gluteos", equipment: ["sin_equipo", "mancuernas", "kettlebell"] },
  { id: "sentadilla_bulgara", name: "Sentadilla Bulgara", altName: "Zancada elevada", techName: "Bulgarian Split Squat", emoji: "🦵", category: "piernas", muscle: "Cuadriceps, Gluteos", equipment: ["sin_equipo", "mancuernas", "banco"] },
  { id: "zancadas", name: "Zancadas", altName: "Estocadas / Lunges", techName: "Lunges", emoji: "🚶", category: "piernas", muscle: "Cuadriceps, Gluteos", equipment: ["sin_equipo", "mancuernas"] },
  { id: "zancada_lateral", name: "Zancada Lateral", altName: "Estocada de lado", techName: "Lateral Lunge", emoji: "🚶", category: "piernas", muscle: "Aductores, Cuadriceps", equipment: ["sin_equipo", "mancuernas"] },
  { id: "zancada_reversa", name: "Zancada Reversa", altName: "Estocada hacia atras", techName: "Reverse Lunge", emoji: "🚶", category: "piernas", muscle: "Gluteos, Cuadriceps", equipment: ["sin_equipo", "mancuernas"] },
  { id: "peso_muerto", name: "Peso Muerto", altName: "Levantamiento de tierra", techName: "Deadlift", emoji: "🏋️", category: "piernas", muscle: "Isquiotibiales, Espalda baja, Gluteos", equipment: ["barra", "mancuernas", "kettlebell"] },
  { id: "peso_muerto_rumano", name: "Peso Muerto Rumano", altName: "Peso muerto piernas rigidas", techName: "Romanian Deadlift", emoji: "🏋️", category: "piernas", muscle: "Isquiotibiales, Gluteos", equipment: ["barra", "mancuernas"] },
  { id: "elevacion_talones", name: "Elevacion de Talones", altName: "Pararse en puntas", techName: "Calf Raises", emoji: "🦶", category: "piernas", muscle: "Pantorrillas", equipment: ["sin_equipo", "mancuernas", "step"] },
  { id: "puente_gluteo", name: "Puente de Gluteo", altName: "Elevacion de cadera", techName: "Glute Bridge", emoji: "🍑", category: "piernas", muscle: "Gluteos, Isquiotibiales", equipment: ["sin_equipo", "mancuernas", "barra"] },
  { id: "hip_thrust", name: "Hip Thrust", altName: "Empuje de cadera con banco", techName: "Hip Thrust", emoji: "🍑", category: "piernas", muscle: "Gluteos", equipment: ["banco", "barra", "mancuernas"] },
  { id: "patada_gluteo", name: "Patada de Gluteo", altName: "Kickback", techName: "Glute Kickback", emoji: "🍑", category: "piernas", muscle: "Gluteos", equipment: ["sin_equipo", "bandas"] },
  { id: "sentadilla_salto", name: "Sentadilla con Salto", altName: "Cuclilla explosiva", techName: "Jump Squat", emoji: "🦘", category: "piernas", muscle: "Cuadriceps, Gluteos, Cardio", equipment: ["sin_equipo"] },
  { id: "step_up", name: "Step Up", altName: "Subida al cajon/escalon", techName: "Step Up", emoji: "📦", category: "piernas", muscle: "Cuadriceps, Gluteos", equipment: ["step", "banco", "mancuernas"] },
  { id: "wall_sit", name: "Wall Sit", altName: "Silla en la pared", techName: "Wall Sit", emoji: "🪑", category: "piernas", muscle: "Cuadriceps", equipment: ["sin_equipo"] },
  { id: "prensa", name: "Prensa de Piernas", altName: "Leg Press", techName: "Leg Press", emoji: "🦵", category: "piernas", muscle: "Cuadriceps, Gluteos", equipment: ["maquinas"] },
  { id: "extension_pierna", name: "Extension de Pierna", altName: "Leg Extension", techName: "Leg Extension", emoji: "🦵", category: "piernas", muscle: "Cuadriceps", equipment: ["maquinas"] },
  { id: "curl_femoral", name: "Curl Femoral", altName: "Curl de pierna", techName: "Leg Curl", emoji: "🦵", category: "piernas", muscle: "Isquiotibiales", equipment: ["maquinas"] },

  // PECHO
  { id: "flexiones", name: "Flexiones de Pecho", altName: "Lagartijas / Planchas", techName: "Push-Ups", emoji: "💪", category: "pecho", muscle: "Pectorales, Triceps, Hombros", equipment: ["sin_equipo"] },
  { id: "flexiones_rodillas", name: "Flexiones en Rodillas", altName: "Lagartijas faciles", techName: "Knee Push-Ups", emoji: "💪", category: "pecho", muscle: "Pectorales, Triceps", equipment: ["sin_equipo"] },
  { id: "flexiones_inclinadas", name: "Flexiones Inclinadas", altName: "Lagartijas en pendiente", techName: "Incline Push-Ups", emoji: "💪", category: "pecho", muscle: "Pectorales inferior", equipment: ["sin_equipo", "banco"] },
  { id: "flexiones_declinadas", name: "Flexiones Declinadas", altName: "Lagartijas pies arriba", techName: "Decline Push-Ups", emoji: "💪", category: "pecho", muscle: "Pectorales superior", equipment: ["sin_equipo", "step"] },
  { id: "flexiones_diamante", name: "Flexiones Diamante", altName: "Lagartijas manos juntas", techName: "Diamond Push-Ups", emoji: "💎", category: "pecho", muscle: "Triceps, Pectorales", equipment: ["sin_equipo"] },
  { id: "flexiones_anchas", name: "Flexiones Anchas", altName: "Lagartijas manos separadas", techName: "Wide Push-Ups", emoji: "💪", category: "pecho", muscle: "Pectorales", equipment: ["sin_equipo"] },
  { id: "press_banca", name: "Press de Banca", altName: "Pecho plano con barra", techName: "Bench Press", emoji: "🏋️", category: "pecho", muscle: "Pectorales, Triceps", equipment: ["barra", "banco"] },
  { id: "press_mancuernas", name: "Press con Mancuernas", altName: "Pecho con pesas", techName: "Dumbbell Press", emoji: "🏋️", category: "pecho", muscle: "Pectorales, Triceps", equipment: ["mancuernas", "banco"] },
  { id: "press_inclinado", name: "Press Inclinado", altName: "Pecho superior", techName: "Incline Press", emoji: "🏋️", category: "pecho", muscle: "Pectorales superior", equipment: ["mancuernas", "banco", "barra"] },
  { id: "aperturas", name: "Aperturas", altName: "Flies / Cruces", techName: "Dumbbell Flyes", emoji: "🦅", category: "pecho", muscle: "Pectorales", equipment: ["mancuernas", "banco"] },
  { id: "pullover", name: "Pullover", altName: "Pesa por encima de la cabeza", techName: "Pullover", emoji: "🏋️", category: "pecho", muscle: "Pectorales, Dorsales", equipment: ["mancuernas", "banco"] },
  { id: "fondos_pecho", name: "Fondos en Paralelas", altName: "Dips", techName: "Chest Dips", emoji: "💪", category: "pecho", muscle: "Pectorales, Triceps", equipment: ["pull_up_bar", "maquinas"] },

  // ESPALDA
  { id: "dominadas", name: "Dominadas", altName: "Pull-ups / Jalones arriba", techName: "Pull-Ups", emoji: "🦍", category: "espalda", muscle: "Dorsales, Biceps", equipment: ["pull_up_bar"] },
  { id: "dominadas_asistidas", name: "Dominadas Asistidas", altName: "Pull-ups con banda", techName: "Assisted Pull-Ups", emoji: "🦍", category: "espalda", muscle: "Dorsales, Biceps", equipment: ["pull_up_bar", "bandas"] },
  { id: "dominadas_neutras", name: "Dominadas Neutras", altName: "Pull-ups agarre paralelo", techName: "Neutral Grip Pull-Ups", emoji: "🦍", category: "espalda", muscle: "Dorsales, Biceps", equipment: ["pull_up_bar"] },
  { id: "remo_mancuerna", name: "Remo con Mancuerna", altName: "Jalon de pesa inclinado", techName: "Dumbbell Row", emoji: "🚣", category: "espalda", muscle: "Dorsales, Romboides", equipment: ["mancuernas", "banco"] },
  { id: "remo_barra", name: "Remo con Barra", altName: "Remo inclinado", techName: "Barbell Row", emoji: "🚣", category: "espalda", muscle: "Dorsales, Romboides", equipment: ["barra"] },
  { id: "remo_invertido", name: "Remo Invertido", altName: "Remo australiano", techName: "Inverted Row", emoji: "🚣", category: "espalda", muscle: "Dorsales, Romboides", equipment: ["pull_up_bar", "trx"] },
  { id: "superman", name: "Superman", altName: "Extension de espalda boca abajo", techName: "Superman", emoji: "🦸", category: "espalda", muscle: "Espalda baja, Gluteos", equipment: ["sin_equipo"] },
  { id: "bird_dog", name: "Bird Dog", altName: "Perro-Pajaro / Cuatro puntos", techName: "Bird Dog", emoji: "🐕", category: "espalda", muscle: "Core, Espalda baja", equipment: ["sin_equipo"] },
  { id: "face_pull", name: "Face Pull", altName: "Jalon a la cara", techName: "Face Pull", emoji: "🎯", category: "espalda", muscle: "Deltoides posterior, Romboides", equipment: ["bandas", "maquinas"] },
  { id: "jalon_polea", name: "Jalon en Polea", altName: "Lat Pulldown", techName: "Lat Pulldown", emoji: "🏋️", category: "espalda", muscle: "Dorsales", equipment: ["maquinas"] },
  { id: "remo_polea", name: "Remo en Polea", altName: "Cable Row", techName: "Seated Cable Row", emoji: "🚣", category: "espalda", muscle: "Dorsales, Romboides", equipment: ["maquinas"] },
  { id: "encogimientos", name: "Encogimientos", altName: "Shrugs", techName: "Shrugs", emoji: "🤷", category: "espalda", muscle: "Trapecios", equipment: ["mancuernas", "barra"] },

  // BRAZOS
  { id: "curl_bicep", name: "Curl de Biceps", altName: "Flexion de codo con peso", techName: "Bicep Curl", emoji: "💪", category: "brazos", muscle: "Biceps", equipment: ["mancuernas", "barra", "bandas"] },
  { id: "curl_martillo", name: "Curl Martillo", altName: "Curl agarre neutro", techName: "Hammer Curl", emoji: "🔨", category: "brazos", muscle: "Biceps, Braquial", equipment: ["mancuernas"] },
  { id: "curl_concentrado", name: "Curl Concentrado", altName: "Curl apoyado en pierna", techName: "Concentration Curl", emoji: "💪", category: "brazos", muscle: "Biceps", equipment: ["mancuernas"] },
  { id: "tricep_fondos", name: "Fondos de Triceps", altName: "Dips en banco/silla", techName: "Tricep Dips", emoji: "💪", category: "brazos", muscle: "Triceps", equipment: ["sin_equipo", "banco"] },
  { id: "extension_tricep", name: "Extension de Triceps", altName: "Patada de triceps", techName: "Tricep Extension", emoji: "💪", category: "brazos", muscle: "Triceps", equipment: ["mancuernas", "bandas"] },
  { id: "tricep_overhead", name: "Triceps Overhead", altName: "Extension sobre la cabeza", techName: "Overhead Tricep Extension", emoji: "🙆", category: "brazos", muscle: "Triceps", equipment: ["mancuernas"] },
  { id: "press_frances", name: "Press Frances", altName: "Skull Crusher", techName: "Skull Crusher", emoji: "💀", category: "brazos", muscle: "Triceps", equipment: ["barra", "mancuernas", "banco"] },
  { id: "press_militar", name: "Press Militar", altName: "Press de hombros", techName: "Overhead Press", emoji: "🎖️", category: "brazos", muscle: "Hombros, Triceps", equipment: ["mancuernas", "barra"] },
  { id: "elevaciones_laterales", name: "Elevaciones Laterales", altName: "Vuelos laterales", techName: "Lateral Raises", emoji: "🦅", category: "brazos", muscle: "Deltoides lateral", equipment: ["mancuernas", "bandas"] },
  { id: "elevaciones_frontales", name: "Elevaciones Frontales", altName: "Vuelos al frente", techName: "Front Raises", emoji: "🦅", category: "brazos", muscle: "Deltoides anterior", equipment: ["mancuernas", "bandas"] },
  { id: "pajaros", name: "Pajaros", altName: "Elevaciones posteriores", techName: "Reverse Flyes", emoji: "🐦", category: "brazos", muscle: "Deltoides posterior", equipment: ["mancuernas", "bandas"] },
  { id: "curl_muneca", name: "Curl de Muneca", altName: "Flexion de antebrazo", techName: "Wrist Curl", emoji: "✊", category: "brazos", muscle: "Antebrazos", equipment: ["mancuernas"] },

  // CORE / ABDOMEN
  { id: "plancha", name: "Plancha", altName: "Tabla / Plank", techName: "Plank", emoji: "🧘", category: "core", muscle: "Core completo", equipment: ["sin_equipo"] },
  { id: "plancha_lateral", name: "Plancha Lateral", altName: "Tabla de lado", techName: "Side Plank", emoji: "🧘", category: "core", muscle: "Oblicuos", equipment: ["sin_equipo"] },
  { id: "plancha_dinamica", name: "Plancha Dinamica", altName: "Plancha con movimiento", techName: "Plank to Push-Up", emoji: "🧘", category: "core", muscle: "Core, Triceps", equipment: ["sin_equipo"] },
  { id: "crunch", name: "Crunch Abdominal", altName: "Abdominales cortos", techName: "Crunch", emoji: "🎯", category: "core", muscle: "Recto abdominal", equipment: ["sin_equipo"] },
  { id: "crunch_bicicleta", name: "Crunch Bicicleta", altName: "Abdominales de bicicleta", techName: "Bicycle Crunch", emoji: "🚴", category: "core", muscle: "Oblicuos, Recto abdominal", equipment: ["sin_equipo"] },
  { id: "crunch_inverso", name: "Crunch Inverso", altName: "Abdominales de piernas", techName: "Reverse Crunch", emoji: "🔄", category: "core", muscle: "Abdominales inferiores", equipment: ["sin_equipo"] },
  { id: "elevacion_piernas", name: "Elevacion de Piernas", altName: "Levantamiento de piernas", techName: "Leg Raises", emoji: "🦵", category: "core", muscle: "Abdominales inferiores", equipment: ["sin_equipo", "pull_up_bar"] },
  { id: "russian_twist", name: "Russian Twist", altName: "Giro ruso / Torsion", techName: "Russian Twist", emoji: "🔄", category: "core", muscle: "Oblicuos", equipment: ["sin_equipo", "pelota", "mancuernas"] },
  { id: "mountain_climber", name: "Mountain Climbers", altName: "Escaladores", techName: "Mountain Climbers", emoji: "🧗", category: "core", muscle: "Core, Cardio", equipment: ["sin_equipo"] },
  { id: "dead_bug", name: "Dead Bug", altName: "Bicho muerto", techName: "Dead Bug", emoji: "🪲", category: "core", muscle: "Core profundo", equipment: ["sin_equipo"] },
  { id: "v_ups", name: "V-Ups", altName: "Abdominales en V", techName: "V-Ups", emoji: "✌️", category: "core", muscle: "Core completo", equipment: ["sin_equipo"] },
  { id: "hollow_body", name: "Hollow Body Hold", altName: "Posicion hueca", techName: "Hollow Body Hold", emoji: "🥄", category: "core", muscle: "Core completo", equipment: ["sin_equipo"] },
  { id: "ab_wheel", name: "Rueda Abdominal", altName: "Ab Wheel Rollout", techName: "Ab Wheel Rollout", emoji: "🛞", category: "core", muscle: "Core completo", equipment: ["sin_equipo"] },
  { id: "pallof_press", name: "Pallof Press", altName: "Press anti-rotacion", techName: "Pallof Press", emoji: "🎯", category: "core", muscle: "Core, Anti-rotacion", equipment: ["bandas", "maquinas"] },

  // CARDIO
  { id: "burpees", name: "Burpees", altName: "Sapito / Salto con lagartija", techName: "Burpees", emoji: "🐸", category: "cardio", muscle: "Cuerpo completo, Cardio", equipment: ["sin_equipo"] },
  { id: "jumping_jacks", name: "Jumping Jacks", altName: "Polichinelas / Titeres", techName: "Jumping Jacks", emoji: "⭐", category: "cardio", muscle: "Cardio, Cuerpo completo", equipment: ["sin_equipo"] },
  { id: "high_knees", name: "High Knees", altName: "Rodillas arriba / Skiping", techName: "High Knees", emoji: "🏃", category: "cardio", muscle: "Cardio, Core", equipment: ["sin_equipo"] },
  { id: "butt_kicks", name: "Butt Kicks", altName: "Talones al gluteo", techName: "Butt Kicks", emoji: "🏃", category: "cardio", muscle: "Cardio, Isquiotibiales", equipment: ["sin_equipo"] },
  { id: "saltar_cuerda", name: "Saltar la Cuerda", altName: "Saltar lazo", techName: "Jump Rope", emoji: "🪢", category: "cardio", muscle: "Cardio, Pantorrillas", equipment: ["cuerda"] },
  { id: "box_jumps", name: "Box Jumps", altName: "Saltos al cajon", techName: "Box Jumps", emoji: "📦", category: "cardio", muscle: "Piernas, Cardio", equipment: ["step"] },
  { id: "sprint", name: "Sprints", altName: "Carreras cortas / Piques", techName: "Sprints", emoji: "🏃‍♂️", category: "cardio", muscle: "Cardio, Piernas", equipment: ["sin_equipo"] },
  { id: "skaters", name: "Skaters", altName: "Saltos de patinador", techName: "Skaters", emoji: "⛸️", category: "cardio", muscle: "Cardio, Piernas", equipment: ["sin_equipo"] },
  { id: "tuck_jumps", name: "Tuck Jumps", altName: "Saltos con rodillas al pecho", techName: "Tuck Jumps", emoji: "🦘", category: "cardio", muscle: "Cardio, Piernas", equipment: ["sin_equipo"] },
  { id: "battle_ropes", name: "Battle Ropes", altName: "Cuerdas de batalla", techName: "Battle Ropes", emoji: "🪢", category: "cardio", muscle: "Brazos, Cardio", equipment: ["maquinas"] },
  { id: "rowing", name: "Remo Maquina", altName: "Maquina de remo", techName: "Rowing Machine", emoji: "🚣", category: "cardio", muscle: "Cuerpo completo, Cardio", equipment: ["maquinas"] },

  // CUERPO COMPLETO
  { id: "kettlebell_swing", name: "Kettlebell Swing", altName: "Balanceo de pesa rusa", techName: "Kettlebell Swing", emoji: "🔔", category: "cuerpo_completo", muscle: "Gluteos, Core, Cardio", equipment: ["kettlebell"] },
  { id: "clean_press", name: "Clean and Press", altName: "Cargada y empuje", techName: "Clean and Press", emoji: "🏋️", category: "cuerpo_completo", muscle: "Cuerpo completo", equipment: ["barra", "mancuernas", "kettlebell"] },
  { id: "thruster", name: "Thrusters", altName: "Sentadilla + Press", techName: "Thrusters", emoji: "🚀", category: "cuerpo_completo", muscle: "Piernas, Hombros", equipment: ["mancuernas", "barra", "kettlebell"] },
  { id: "turkish_getup", name: "Turkish Get Up", altName: "Levantada turca", techName: "Turkish Get Up", emoji: "🇹🇷", category: "cuerpo_completo", muscle: "Cuerpo completo", equipment: ["kettlebell", "mancuernas"] },
  { id: "man_maker", name: "Man Makers", altName: "Burpee con pesas", techName: "Man Makers", emoji: "🦸‍♂️", category: "cuerpo_completo", muscle: "Cuerpo completo", equipment: ["mancuernas"] },
  { id: "bear_crawl", name: "Bear Crawl", altName: "Caminar como oso", techName: "Bear Crawl", emoji: "🐻", category: "cuerpo_completo", muscle: "Core, Hombros", equipment: ["sin_equipo"] },
  { id: "inchworm", name: "Inchworm", altName: "Gusanito", techName: "Inchworm", emoji: "🐛", category: "cuerpo_completo", muscle: "Core, Isquiotibiales", equipment: ["sin_equipo"] },
  { id: "devil_press", name: "Devil Press", altName: "Press del diablo", techName: "Devil Press", emoji: "😈", category: "cuerpo_completo", muscle: "Cuerpo completo", equipment: ["mancuernas"] },
  { id: "farmers_walk", name: "Farmers Walk", altName: "Caminata del granjero", techName: "Farmers Walk", emoji: "🚶", category: "cuerpo_completo", muscle: "Agarre, Core, Piernas", equipment: ["mancuernas", "kettlebell"] },
  { id: "squat_press", name: "Squat to Press", altName: "Sentadilla con press", techName: "Squat to Press", emoji: "🏋️", category: "cuerpo_completo", muscle: "Piernas, Hombros", equipment: ["mancuernas", "kettlebell"] },
];

export const getExercisesByCategory = (category: string) =>
  exercises.filter((e) => category === "todos" || e.category === category);

export const getExercisesByEquipment = (equipment: string[]) =>
  exercises.filter((e) => e.equipment.some((eq) => equipment.includes(eq)));

export const getFilteredExercises = (category: string, equipment: string[]) => {
  let filtered = exercises;
  if (category !== "todos") {
    filtered = filtered.filter((e) => e.category === category);
  }
  filtered = filtered.filter((e) => e.equipment.some((eq) => equipment.includes(eq)));
  return filtered;
};
