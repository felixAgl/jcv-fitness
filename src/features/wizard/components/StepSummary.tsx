"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWizardStore } from "../store/wizard-store";
import { exercises } from "../data/exercises";
import { foods, FOOD_TRANSLATIONS, type FoodCategory } from "../data/foods";
import { TRANSLATIONS } from "../types";
import { useAuth, AuthModal } from "@/features/auth";
import { usePlan } from "@/features/plans/hooks/usePlan";

interface SummarySectionProps {
  title: string;
  value: string;
  icon?: string;
}

function SummarySection({ title, value, icon }: SummarySectionProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800">
      <span className="text-gray-400 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {title}
      </span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

export function StepSummary() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { canCreatePlan, canCreateReason, createPlan, isLoading: isPlanLoading } = usePlan();

  const [isSaving, setIsSaving] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = useWizardStore();
  const {
    level,
    goal,
    time,
    equipment,
    duration,
    selectedExercises,
    selectedFoods,
    userName,
    setUserName,
    userBodyData,
    prevStep,
    calculateCalories,
  } = state;

  const selectedExercisesList = exercises.filter((ex) =>
    selectedExercises.includes(ex.id)
  );

  const calories = calculateCalories();

  const groupedExercises = selectedExercisesList.reduce((acc, exercise) => {
    if (!acc[exercise.category]) {
      acc[exercise.category] = [];
    }
    acc[exercise.category].push(exercise);
    return acc;
  }, {} as Record<string, typeof selectedExercisesList>);

  const selectedFoodsList = foods.filter((food) =>
    selectedFoods.includes(food.id)
  );

  const groupedFoods = selectedFoodsList.reduce((acc, food) => {
    if (!acc[food.category]) {
      acc[food.category] = [];
    }
    acc[food.category].push(food);
    return acc;
  }, {} as Record<FoodCategory, typeof selectedFoodsList>);

  const handleSavePlan = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const planData = {
        currentStep: state.currentStep,
        level: state.level,
        goal: state.goal,
        time: state.time,
        equipment: state.equipment,
        duration: state.duration,
        selectedExercises: state.selectedExercises,
        selectedFoods: state.selectedFoods,
        userName: state.userName,
        userBodyData: state.userBodyData,
      };

      const result = await createPlan(planData, "free");

      if (result.success) {
        // Redirect to plan viewer
        router.push("/plan/view");
      } else {
        setError(result.error || "Error al guardar el plan");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = () => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

    handleSavePlan();
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    // After auth, save the plan
    handleSavePlan();
  };

  // Show upgrade message if user already used their free plan
  if (isAuthenticated && !canCreatePlan && canCreateReason === "free_used") {
    return (
      <div className="space-y-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Ya usaste tu plan gratuito
        </h2>
        <p className="text-gray-400">
          Tu plan de prueba ha expirado. Actualiza a Premium para acceder a planes ilimitados, descarga de PDFs y soporte personalizado.
        </p>
        <div className="grid gap-4 mt-6">
          <Link
            href="/pricing"
            className="px-8 py-4 rounded-xl font-bold bg-accent-cyan text-black hover:shadow-lg hover:shadow-accent-cyan/50 transition-all text-center"
          >
            Ver Planes Premium
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg font-semibold border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-all text-center"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Show message if user already has an active plan
  if (isAuthenticated && !canCreatePlan && canCreateReason === "already_has_plan") {
    return (
      <div className="space-y-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-accent-cyan/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Ya tienes un plan activo
        </h2>
        <p className="text-gray-400">
          Puedes ver tu plan actual en el dashboard o esperar a que expire para crear uno nuevo.
        </p>
        <div className="grid gap-4 mt-6">
          <Link
            href="/plan/view"
            className="px-8 py-4 rounded-xl font-bold bg-accent-cyan text-black hover:shadow-lg hover:shadow-accent-cyan/50 transition-all text-center"
          >
            Ver Mi Plan
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg font-semibold border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-all text-center"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {userName ? `${userName}, ` : ""}Resumen de tu programa
        </h2>
        <p className="text-gray-400">
          Revisa los detalles antes de guardar tu rutina personalizada
        </p>
      </div>

      <div className="bg-gradient-to-r from-accent-cyan/10 to-accent-green/10 rounded-xl p-6 border border-accent-cyan/30">
        <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2">
          Tu nombre (para personalizar el plan)
        </label>
        <input
          id="userName"
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Ej: Juan Carlos"
          className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
        />
        <p className="text-xs text-gray-500 mt-2">
          Este nombre aparecera en tu plan personalizado
        </p>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-accent-cyan mb-4">Configuracion del Entrenamiento</h3>
        <SummarySection
          title="Nivel"
          value={level ? TRANSLATIONS.levels[level] : "-"}
          icon="🎯"
        />
        <SummarySection
          title="Objetivo"
          value={goal ? TRANSLATIONS.goals[goal] : "-"}
          icon="💪"
        />
        <SummarySection
          title="Tiempo por sesion"
          value={`${time} minutos`}
          icon="⏱️"
        />
        <SummarySection
          title="Duracion del programa"
          value={duration ? TRANSLATIONS.durations[duration] : "-"}
          icon="📅"
        />
        <SummarySection
          title="Equipo disponible"
          value={equipment.map((e) => TRANSLATIONS.equipment[e]).join(", ")}
          icon="🏋️"
        />
      </div>

      {userBodyData && (
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-accent-cyan mb-4">Datos Corporales</h3>
          <SummarySection
            title="Genero"
            value={userBodyData.gender === "masculino" ? "Masculino" : "Femenino"}
            icon="👤"
          />
          <SummarySection
            title="Edad"
            value={`${userBodyData.age} años`}
            icon="🎂"
          />
          <SummarySection
            title="Altura"
            value={`${userBodyData.height} cm`}
            icon="📏"
          />
          <SummarySection
            title="Peso actual"
            value={`${userBodyData.currentWeight} kg`}
            icon="⚖️"
          />
          <SummarySection
            title="Peso objetivo"
            value={`${userBodyData.targetWeight} kg`}
            icon="🎯"
          />
          {calories && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-gray-400">{calories.bmr}</div>
                  <div className="text-xs text-gray-500">BMR</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{calories.tdee}</div>
                  <div className="text-xs text-gray-400">TDEE</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-accent-green">{calories.target}</div>
                  <div className="text-xs text-accent-green">Objetivo</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-accent-cyan mb-4">
          Ejercicios seleccionados ({selectedExercises.length})
        </h3>
        {Object.entries(groupedExercises).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedExercises).map(([category, exList]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
                  {TRANSLATIONS.categories[category as keyof typeof TRANSLATIONS.categories]}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {exList.map((ex) => (
                    <span
                      key={ex.id}
                      className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300"
                    >
                      {ex.emoji} {ex.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No has seleccionado ejercicios. Se generara una rutina automatica basada en tu nivel y objetivo.
          </p>
        )}
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-accent-green mb-4">
          Alimentos seleccionados ({selectedFoods.length})
        </h3>
        {Object.entries(groupedFoods).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedFoods).map(([category, foodList]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
                  {FOOD_TRANSLATIONS[category as FoodCategory]}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {foodList.map((food) => (
                    <span
                      key={food.id}
                      className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300"
                    >
                      {food.emoji} {food.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No has seleccionado alimentos. Se generara un plan basico con alimentos recomendados.
          </p>
        )}
      </div>

      <div className="bg-gradient-to-r from-accent-cyan/10 to-accent-green/10 rounded-xl p-6 border border-accent-cyan/30">
        <div className="text-center">
          <p className="text-gray-300 mb-2">
            Tu plan estara disponible por <span className="text-accent-cyan font-bold">5 semanas</span> de forma gratuita.
          </p>
          <p className="text-gray-500 text-sm">
            Podras ver tu rutina y plan alimenticio en la web. Para descargar el PDF, actualiza a Premium.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 pt-6">
        <button
          type="button"
          onClick={prevStep}
          disabled={isSaving}
          className="px-6 py-3 rounded-lg font-semibold border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white hover:bg-gray-800/50 transition-all disabled:opacity-50"
        >
          Atras
        </button>
        <button
          type="button"
          onClick={handleFinalize}
          disabled={isSaving || isPlanLoading}
          className="px-8 py-3 rounded-lg font-bold bg-accent-green text-black hover:shadow-lg hover:shadow-accent-green/50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <span className="animate-spin inline-block w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
              Guardando...
            </>
          ) : (
            <>
              {isAuthenticated ? "Guardar Mi Plan" : "Crear Cuenta y Guardar"}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        defaultMode="register"
        onSuccess={handleAuthSuccess}
        showStepIndicator={false}
      />
    </div>
  );
}
