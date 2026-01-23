/**
 * Mercado Pago Integration - Wallet Brick
 *
 * Documentacion: https://www.mercadopago.com.co/developers/en/docs/checkout-api-payments
 *
 * Para produccion necesitas:
 * 1. Crear cuenta en Mercado Pago Developers: https://www.mercadopago.com.co/developers
 * 2. Obtener credenciales de produccion (Public Key y Access Token)
 * 3. Configurar Webhook para notificaciones de pago
 *
 * Variables de entorno requeridas:
 * - NEXT_PUBLIC_MP_PUBLIC_KEY: Public Key de Mercado Pago (client-side)
 * - MP_ACCESS_TOKEN: Access Token (solo backend/API routes)
 */

export interface MercadoPagoConfig {
  publicKey: string;
  locale?: "es-CO" | "es-AR" | "es-MX" | "pt-BR";
}

export interface PreferenceItem {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  currencyId: "COP" | "ARS" | "MXN" | "BRL" | "USD";
}

export interface CreatePreferenceRequest {
  items: PreferenceItem[];
  payer?: {
    name?: string;
    email?: string;
  };
  backUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
  autoReturn?: "approved" | "all";
  notificationUrl?: string;
  purpose?: "wallet_purchase";
}

export interface CreatePreferenceResponse {
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale: string }) => MercadoPagoInstance;
  }
}

interface MercadoPagoInstance {
  bricks: () => {
    create: (
      brick: "wallet",
      containerId: string,
      options: {
        initialization: {
          preferenceId: string;
          redirectMode?: "modal" | "blank" | "self";
        };
        customization?: {
          texts?: {
            action?: string;
            valueProp?: string;
          };
          visual?: {
            buttonBackground?: "default" | "black" | "blue" | "white";
            borderRadius?: string;
          };
        };
        callbacks?: {
          onReady?: () => void;
          onSubmit?: () => void;
          onError?: (error: unknown) => void;
        };
      }
    ) => Promise<void>;
  };
}

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || "TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

export function getMercadoPagoConfig(): MercadoPagoConfig {
  return {
    publicKey: MP_PUBLIC_KEY,
    locale: "es-CO",
  };
}

/**
 * Carga el SDK de Mercado Pago desde CDN
 */
export async function loadMercadoPagoSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("MercadoPago SDK requires browser environment"));
      return;
    }

    if (window.MercadoPago) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load MercadoPago SDK"));
    document.body.appendChild(script);
  });
}

/**
 * Inicializa el SDK de Mercado Pago
 */
export function initMercadoPago(): MercadoPagoInstance | null {
  if (typeof window === "undefined" || !window.MercadoPago) {
    return null;
  }

  const config = getMercadoPagoConfig();
  return new window.MercadoPago(config.publicKey, {
    locale: config.locale || "es-CO",
  });
}

/**
 * Renderiza el Wallet Brick de Mercado Pago
 *
 * @param containerId - ID del elemento HTML donde renderizar el boton
 * @param preferenceId - ID de la preferencia creada en el backend
 */
export async function renderWalletBrick(
  containerId: string,
  preferenceId: string,
  callbacks?: {
    onReady?: () => void;
    onSubmit?: () => void;
    onError?: (error: unknown) => void;
  }
): Promise<void> {
  await loadMercadoPagoSDK();

  const mp = initMercadoPago();
  if (!mp) {
    throw new Error("Failed to initialize MercadoPago");
  }

  await mp.bricks().create("wallet", containerId, {
    initialization: {
      preferenceId,
      redirectMode: "modal",
    },
    customization: {
      texts: {
        action: "pay",
        valueProp: "security_safety",
      },
      visual: {
        buttonBackground: "default",
        borderRadius: "12px",
      },
    },
    callbacks: {
      onReady: () => {
        callbacks?.onReady?.();
      },
      onSubmit: () => {
        callbacks?.onSubmit?.();
      },
      onError: (error) => {
        console.error("MercadoPago Wallet Brick error:", error);
        callbacks?.onError?.(error);
      },
    },
  });
}

/**
 * Crear preferencia de pago en el backend
 * Esta funcion llama a tu API route que maneja la creacion con Access Token
 */
export async function createPaymentPreference(
  request: CreatePreferenceRequest
): Promise<CreatePreferenceResponse> {
  const response = await fetch("/api/payment/mercadopago/create-preference", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create payment preference");
  }

  return response.json();
}

/**
 * Productos predefinidos de JCV Fitness
 * Sincronizados con PricingSection
 */
export const JCV_PRODUCTS = {
  PLAN_BASICO: {
    title: "JCV Fitness - Plan Basico",
    description: "Plan de alimentacion 7 dias + Rutina de entrenamiento casa + Acceso a la app + Soporte por email",
    quantity: 1,
    unitPrice: 49900, // COP
    currencyId: "COP" as const,
  },
  PLAN_PRO: {
    title: "JCV Fitness - Plan Pro",
    description: "Plan de alimentacion personalizado + Rutina gimnasio + casa + Videos de ejercicios + Soporte prioritario + Seguimiento semanal",
    quantity: 1,
    unitPrice: 89900, // COP
    currencyId: "COP" as const,
  },
  PLAN_PREMIUM: {
    title: "JCV Fitness - Plan Premium",
    description: "Todo lo del plan Pro + Coaching 1 a 1 + Ajustes mensuales + Acceso a comunidad VIP + Garantia de resultados",
    quantity: 1,
    unitPrice: 149900, // COP
    currencyId: "COP" as const,
  },
};

export type PlanId = keyof typeof JCV_PRODUCTS;

/**
 * Ejemplo de API Route para crear preferencia
 *
 * Archivo: /app/api/payment/mercadopago/create-preference/route.ts
 *
 * ```typescript
 * import { MercadoPagoConfig, Preference } from 'mercadopago';
 * import { NextRequest, NextResponse } from 'next/server';
 *
 * const client = new MercadoPagoConfig({
 *   accessToken: process.env.MP_ACCESS_TOKEN!,
 * });
 *
 * export async function POST(request: NextRequest) {
 *   try {
 *     const body = await request.json();
 *     const preference = new Preference(client);
 *
 *     const result = await preference.create({
 *       body: {
 *         items: body.items.map((item: any) => ({
 *           title: item.title,
 *           description: item.description,
 *           quantity: item.quantity,
 *           unit_price: item.unitPrice,
 *           currency_id: item.currencyId,
 *         })),
 *         payer: body.payer,
 *         back_urls: {
 *           success: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
 *           failure: `${process.env.NEXT_PUBLIC_URL}/payment/failure`,
 *           pending: `${process.env.NEXT_PUBLIC_URL}/payment/pending`,
 *         },
 *         auto_return: 'approved',
 *         notification_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/mercadopago`,
 *         purpose: 'wallet_purchase', // Solo permite pago con cuenta MP
 *       },
 *     });
 *
 *     return NextResponse.json({
 *       id: result.id,
 *       initPoint: result.init_point,
 *       sandboxInitPoint: result.sandbox_init_point,
 *     });
 *   } catch (error) {
 *     console.error('Error creating preference:', error);
 *     return NextResponse.json(
 *       { error: 'Failed to create preference' },
 *       { status: 500 }
 *     );
 *   }
 * }
 * ```
 */
