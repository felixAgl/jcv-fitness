"use client";

import { useState, useEffect } from "react";
import {
  loadMercadoPagoSDK,
  JCV_PRODUCTS,
} from "../utils/mercado-pago";
import {
  openWompiCheckout,
  generateReference,
  formatCOP,
  JCV_PRODUCTS_COP,
  type WompiWidgetResult,
} from "../utils/wompi";

type PaymentProvider = "mercadopago" | "wompi";
type PlanType = "PLAN_BASICO" | "PLAN_PRO" | "PLAN_PREMIUM";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: PlanType;
  customerEmail?: string;
  customerName?: string;
  userId?: string;
  onPaymentSuccess?: (transactionId: string, provider: PaymentProvider) => void;
  onPaymentError?: (error: string) => void;
  showStepIndicator?: boolean;
}

export function CheckoutModal({
  isOpen,
  onClose,
  selectedPlan = "PLAN_PRO",
  customerEmail = "",
  customerName = "",
  userId,
  onPaymentSuccess,
  onPaymentError,
  showStepIndicator = false,
}: CheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
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
      // Use Cloudflare Worker for static hosting
      const workerUrl = process.env.NEXT_PUBLIC_MP_WORKER_URL;

      console.log("[MP] Worker URL:", workerUrl);
      console.log("[MP] Product:", product);

      if (!workerUrl) {
        console.error("[MP] Missing NEXT_PUBLIC_MP_WORKER_URL");
        throw new Error("Pago no disponible temporalmente. Intenta con Wompi.");
      }

      const requestBody = {
        items: [product],
        planType: selectedPlan,
        userId: userId,
        payer: customerEmail ? { email: customerEmail, name: customerName } : undefined,
        backUrls: {
          success: `${window.location.origin}/payment/success`,
          failure: `${window.location.origin}/payment/failure`,
          pending: `${window.location.origin}/payment/pending`,
        },
      };

      console.log("[MP] Request body:", requestBody);

      const response = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("[MP] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[MP] Error response:", errorData);
        throw new Error(errorData.error || `Error ${response.status}: Error al crear preferencia de pago`);
      }

      const preference = await response.json();
      console.log("[MP] Preference created:", preference);

      // Default to sandbox in development, production otherwise
      const isSandbox = process.env.NEXT_PUBLIC_MP_SANDBOX === "true" ||
        (typeof window !== "undefined" && window.location.hostname === "localhost");

      const checkoutUrl = isSandbox
        ? preference.sandboxInitPoint || preference.sandbox_init_point
        : preference.initPoint || preference.init_point;

      console.log("[MP] Redirecting to:", checkoutUrl, "(sandbox:", isSandbox, ")");

      if (!checkoutUrl) {
        throw new Error("No se recibio URL de pago. Verifica la configuracion del servidor.");
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("[MP] Error:", err);
      const message = err instanceof Error ? err.message : "Error procesando pago con MercadoPago";
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
            setError("Pago rechazado. Por favor intenta con otro método.");
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

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setSelectedProvider(null);
      setError(null);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar modal"
      />

      <div
        className="relative bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {showStepIndicator && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white font-bold flex items-center justify-center text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-green-400 text-sm font-medium">Cuenta</span>
              </div>
              <div className="w-8 h-0.5 bg-accent-cyan" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent-cyan text-black font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <span className="text-white text-sm font-medium">Pago</span>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500">Paso 2 de 2 - Ultimo paso</p>
          </div>
        )}

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
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" fill="none"/>
                <rect x="4" y="4" width="16" height="16" rx="3" fill="white" opacity="0.2"/>
                <text x="12" y="16" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">MP</text>
              </svg>
            )}
            Pagar con Mercado Pago
          </button>

          {/* TODO: Habilitar Wompi cuando esté configurado
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
          */}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex items-center gap-1 text-gray-500">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs">SSL Seguro</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs">Datos protegidos</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Pago seguro procesado por pasarelas certificadas PCI DSS.
          </p>
        </div>
      </div>
    </div>
  );
}
