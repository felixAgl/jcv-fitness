"use client";

import { useState } from "react";
import { useWizardStore } from "../store/wizard-store";
import { exercises } from "../data/exercises";
import { foods, FOOD_TRANSLATIONS, type FoodCategory } from "../data/foods";
import { TRANSLATIONS } from "../types";
import { generateWorkoutPDF } from "../utils/generate-pdf";
import { CheckoutModal } from "@/features/payment/components/CheckoutModal";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
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

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await generateWorkoutPDF({
        state: {
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
        },
        exercises: selectedExercisesList,
        calories,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalize = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (transactionId: string, provider: string) => {
    console.log(`Pago exitoso: ${transactionId} via ${provider}`);
    setPaymentSuccess(true);
    setShowCheckout(false);
    // Generar PDF automaticamente tras pago exitoso
    await handleGeneratePDF();
  };

  const handlePaymentError = (error: string) => {
    console.error("Error en pago:", error);
  };

  if (paymentSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-accent-green/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Pago Exitoso
        </h2>
        <p className="text-gray-400">
          Tu PDF ha sido generado y descargado automaticamente.
        </p>
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <p className="text-gray-300 text-sm">
            Revisa tu carpeta de descargas. Si tienes dudas, contactanos:
          </p>
          <p className="text-accent-cyan font-bold mt-2">WhatsApp: 314 382 64 30</p>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Completa tu compra
          </h2>
          <p className="text-gray-400">
            Elige tu metodo de pago preferido
          </p>
        </div>

        <div className="grid gap-4">
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold text-accent-cyan mb-4">Plan Premium</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-black text-white">$99.900</span>
              <span className="text-gray-500">COP</span>
            </div>
            <ul className="space-y-2 text-gray-300 text-sm mb-6">
              <li className="flex items-center gap-2">
                <span className="text-accent-green">+</span>
                Rutina personalizada PDF con videos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-green">+</span>
                Plan alimenticio semanal detallado
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-green">+</span>
                Calculo de calorias y macros
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-green">+</span>
                Soporte por WhatsApp
              </li>
            </ul>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => setShowCheckout(true)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#009ee3] to-[#00b1ff] text-white font-bold text-lg hover:from-[#00b1ff] hover:to-[#009ee3] transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              Pagar con Mercado Pago
            </button>

            <button
              type="button"
              onClick={() => setShowCheckout(true)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00c389] to-[#00a86b] text-white font-bold text-lg hover:from-[#00d499] hover:to-[#00b97c] transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Pagar con Wompi (PSE, Nequi, Tarjetas)
            </button>
          </div>

          <div className="text-center pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="text-accent-cyan hover:underline text-sm flex items-center justify-center gap-2 mx-auto"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-accent-cyan border-t-transparent rounded-full" />
                  Generando...
                </>
              ) : (
                "Generar PDF de prueba (gratis)"
              )}
            </button>
            <p className="text-xs text-gray-600 mt-1">
              Version limitada sin soporte
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPayment(false)}
          className="w-full py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          Volver al resumen
        </button>

        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          selectedPlan="PLAN_PREMIUM"
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
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
          Revisa los detalles antes de generar tu rutina personalizada
        </p>
      </div>

      <div className="bg-gradient-to-r from-accent-cyan/10 to-accent-green/10 rounded-xl p-6 border border-accent-cyan/30">
        <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2">
          Tu nombre (para personalizar el PDF)
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
          Este nombre aparecera en tu PDF personalizado
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
            value={`${userBodyData.age} anos`}
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
        <p className="text-center text-gray-300">
          Al finalizar, podras generar tu <span className="text-accent-cyan font-bold">PDF personalizado</span> con
          tu rutina de entrenamiento y guia alimenticia basica.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 pt-6">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-3 rounded-lg font-semibold border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white hover:bg-gray-800/50 transition-all"
        >
          Atras
        </button>
        <button
          type="button"
          onClick={handleFinalize}
          className="px-8 py-3 rounded-lg font-bold bg-accent-green text-black hover:shadow-lg hover:shadow-accent-green/50 transition-all flex items-center gap-2"
        >
          Obtener Mi Rutina
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
