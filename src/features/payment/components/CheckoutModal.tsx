"use client";

import { useState, useEffect } from "react";
import {
  loadMercadoPagoSDK,
  JCV_PRODUCTS,
  type CreatePreferenceResponse,
} from "../utils/mercado-pago";
import {
  openWompiCheckout,
  generateReference,
  formatCOP,
  JCV_PRODUCTS_COP,
  type WompiWidgetResult,
} from "../utils/wompi";

type PaymentProvider = "mercadopago" | "wompi";
type PlanType = "PLAN_BASICO" | "PLAN_PREMIUM" | "PLAN_40_DIAS";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: PlanType;
  customerEmail?: string;
  customerName?: string;
  onPaymentSuccess?: (transactionId: string, provider: PaymentProvider) => void;
  onPaymentError?: (error: string) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  selectedPlan = "PLAN_PREMIUM",
  customerEmail = "",
  customerName = "",
  onPaymentSuccess,
  onPaymentError,
}: CheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [mpPreference, setMpPreference] = useState<CreatePreferenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const product = JCV_PRODUCTS[selectedPlan];
  const productCOP = JCV_PRODUCTS_COP[selectedPlan];

  useEffect(() => {
    if (isOpen) {
      loadMercadoPagoSDK().catch(console.error);
    }
  }, [isOpen]);

  const handleMercadoPago = async () => {
    setIsLoading(true);
    setError(null);
    setSelectedProvider("mercadopago");

    try {
      // En produccion, llamar a tu API para crear la preferencia
      const response = await fetch("/api/payment/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [product],
          payer: customerEmail ? { email: customerEmail, name: customerName } : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Error creando preferencia de pago");
      }

      const preference = await response.json();
      setMpPreference(preference);

      // Redirigir al checkout de Mercado Pago
      window.location.href = preference.initPoint;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error procesando pago";
      setError(message);
      onPaymentError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWompi = async () => {
    setIsLoading(true);
    setError(null);
    setSelectedProvider("wompi");

    try {
      const reference = generateReference();

      await openWompiCheckout(
        {
          publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "",
          currency: "COP",
          amountInCents: productCOP.amountInCents,
          reference,
          redirectUrl: `${window.location.origin}/payment/callback`,
          customerData: customerEmail
            ? {
                email: customerEmail,
                fullName: customerName,
              }
            : undefined,
        },
        (result: WompiWidgetResult) => {
          if (result.transaction.status === "APPROVED") {
            onPaymentSuccess?.(result.transaction.id, "wompi");
          } else if (result.transaction.status === "DECLINED") {
            setError("Pago rechazado. Por favor intenta con otro metodo.");
            onPaymentError?.("Payment declined");
          } else if (result.transaction.status === "PENDING") {
            setError("Pago pendiente. Te notificaremos cuando se confirme.");
          }
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error procesando pago";
      setError(message);
      onPaymentError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Finalizar Compra</h2>
          <p className="text-gray-400">{product.title}</p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total a pagar:</span>
            <span className="text-2xl font-bold text-accent-cyan">
              {formatCOP(productCOP.amountInCents)}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleMercadoPago}
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-[#009ee3] hover:bg-[#00b1ff] text-white font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && selectedProvider === "mercadopago" ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm6.5 22.5c-.276.138-.586.207-.896.207-.621 0-1.226-.276-1.638-.793l-2.966-3.828-2.966 3.828c-.413.517-1.017.793-1.638.793-.31 0-.621-.069-.896-.207-.862-.431-1.241-1.448-.862-2.31L14.5 16l-3.862-4.19c-.379-.862 0-1.879.862-2.31.276-.138.586-.207.896-.207.621 0 1.226.276 1.638.793L17 13.914l2.966-3.828c.413-.517 1.017-.793 1.638-.793.31 0 .621.069.896.207.862.431 1.241 1.448.862 2.31L19.5 16l3.862 4.19c.379.862 0 1.879-.862 2.31z"/>
              </svg>
            )}
            Pagar con Mercado Pago
          </button>

          <button
            type="button"
            onClick={handleWompi}
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00c389] to-[#00a86b] hover:from-[#00d499] hover:to-[#00b97c] text-white font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && selectedProvider === "wompi" ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            )}
            Pagar con Wompi
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            PSE, Nequi, Tarjetas, Bancolombia QR
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Pago seguro procesado por pasarelas certificadas.
            <br />
            Tus datos estan protegidos.
          </p>
        </div>
      </div>
    </div>
  );
}
