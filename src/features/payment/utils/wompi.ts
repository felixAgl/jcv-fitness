/**
 * Wompi Integration - Colombia
 *
 * Documentacion: https://docs.wompi.co/
 *
 * Wompi es la pasarela de pagos de Bancolombia para Colombia.
 * Soporta: PSE, Tarjetas, Nequi, Bancolombia QR
 *
 * Variables de entorno requeridas:
 * - NEXT_PUBLIC_WOMPI_PUBLIC_KEY: Public Key de Wompi (client-side)
 * - WOMPI_PRIVATE_KEY: Private Key (solo backend)
 * - WOMPI_INTEGRITY_SECRET: Secret para validar integridad
 * - WOMPI_EVENTS_SECRET: Secret para webhooks
 */

export interface WompiConfig {
  publicKey: string;
  currency: "COP";
  environment: "sandbox" | "production";
}

export interface WompiTransaction {
  amountInCents: number;
  currency: "COP";
  customerEmail: string;
  reference: string;
  redirectUrl: string;
  customerData?: {
    fullName?: string;
    phoneNumber?: string;
    phoneNumberPrefix?: string;
  };
}

export interface WompiCheckoutOptions {
  publicKey: string;
  currency: "COP";
  amountInCents: number;
  reference: string;
  redirectUrl: string;
  customerData?: {
    email: string;
    fullName?: string;
    phoneNumber?: string;
    phoneNumberPrefix?: string;
  };
}

declare global {
  interface Window {
    WidgetCheckout?: new (options: WompiWidgetOptions) => WompiWidget;
  }
}

interface WompiWidgetOptions {
  currency: "COP";
  amountInCents: number;
  reference: string;
  publicKey: string;
  redirectUrl: string;
  customerData?: {
    email: string;
    fullName?: string;
    phoneNumber?: string;
    phoneNumberPrefix?: string;
  };
}

interface WompiWidget {
  open: (callback: (result: WompiWidgetResult) => void) => void;
}

export interface WompiWidgetResult {
  transaction: {
    id: string;
    status: "APPROVED" | "DECLINED" | "PENDING" | "VOIDED" | "ERROR";
    statusMessage: string;
    reference: string;
    amountInCents: number;
    currency: "COP";
    paymentMethod: {
      type: "CARD" | "PSE" | "NEQUI" | "BANCOLOMBIA_QR";
    };
    createdAt: string;
  };
}

const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "pub_test_xxxxxxxx";
const WOMPI_ENVIRONMENT = (process.env.NEXT_PUBLIC_WOMPI_ENVIRONMENT || "sandbox") as "sandbox" | "production";

export function getWompiConfig(): WompiConfig {
  return {
    publicKey: WOMPI_PUBLIC_KEY,
    currency: "COP",
    environment: WOMPI_ENVIRONMENT,
  };
}

/**
 * Carga el Widget de Wompi
 */
export async function loadWompiWidget(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Wompi Widget requires browser environment"));
      return;
    }

    if (window.WidgetCheckout) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.wompi.co/widget.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Wompi Widget"));
    document.body.appendChild(script);
  });
}

/**
 * Genera una referencia unica para la transaccion
 */
export function generateReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `JCV-${timestamp}-${random}`.toUpperCase();
}

/**
 * Abre el Widget de Wompi para procesar el pago
 */
export async function openWompiCheckout(
  options: WompiCheckoutOptions,
  onResult: (result: WompiWidgetResult) => void
): Promise<void> {
  await loadWompiWidget();

  if (!window.WidgetCheckout) {
    throw new Error("Wompi Widget not loaded");
  }

  const config = getWompiConfig();

  const checkout = new window.WidgetCheckout({
    currency: config.currency,
    amountInCents: options.amountInCents,
    reference: options.reference,
    publicKey: config.publicKey,
    redirectUrl: options.redirectUrl,
    customerData: options.customerData,
  });

  checkout.open(onResult);
}

/**
 * Verifica el estado de una transaccion
 */
export async function checkTransactionStatus(transactionId: string): Promise<{
  status: "APPROVED" | "DECLINED" | "PENDING" | "VOIDED" | "ERROR";
  statusMessage: string;
}> {
  const response = await fetch(`/api/payment/wompi/status/${transactionId}`);

  if (!response.ok) {
    throw new Error("Failed to check transaction status");
  }

  return response.json();
}

/**
 * Productos predefinidos de JCV Fitness (en centavos COP)
 */
export const JCV_PRODUCTS_COP = {
  PLAN_BASICO: {
    name: "JCV Fitness - Plan Basico",
    description: "Rutina personalizada + Guia nutricional basica",
    amountInCents: 4990000, // $49,900 COP
  },
  PLAN_PREMIUM: {
    name: "JCV Fitness - Plan Premium",
    description: "Rutina completa + Plan alimenticio + Seguimiento mensual",
    amountInCents: 9990000, // $99,900 COP
  },
  PLAN_40_DIAS: {
    name: "JCV Fitness - Entrena Conmigo 40 Dias",
    description: "Programa intensivo de transformacion con coaching personalizado",
    amountInCents: 19990000, // $199,900 COP
  },
};

/**
 * Convierte COP a centavos
 */
export function copToCents(cop: number): number {
  return cop * 100;
}

/**
 * Convierte centavos a COP formateado
 */
export function formatCOP(cents: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Ejemplo de API Route para verificar transaccion
 *
 * Archivo: /app/api/payment/wompi/status/[id]/route.ts
 *
 * ```typescript
 * import { NextRequest, NextResponse } from 'next/server';
 *
 * const WOMPI_API_URL = 'https://sandbox.wompi.co/v1'; // o production.wompi.co
 *
 * export async function GET(
 *   request: NextRequest,
 *   { params }: { params: { id: string } }
 * ) {
 *   try {
 *     const response = await fetch(
 *       `${WOMPI_API_URL}/transactions/${params.id}`,
 *       {
 *         headers: {
 *           Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
 *         },
 *       }
 *     );
 *
 *     if (!response.ok) {
 *       throw new Error('Transaction not found');
 *     }
 *
 *     const data = await response.json();
 *
 *     return NextResponse.json({
 *       status: data.data.status,
 *       statusMessage: data.data.status_message,
 *     });
 *   } catch (error) {
 *     console.error('Error checking transaction:', error);
 *     return NextResponse.json(
 *       { error: 'Failed to check transaction' },
 *       { status: 500 }
 *     );
 *   }
 * }
 * ```
 */

/**
 * Ejemplo de Webhook para recibir notificaciones de Wompi
 *
 * Archivo: /app/api/webhooks/wompi/route.ts
 *
 * ```typescript
 * import { NextRequest, NextResponse } from 'next/server';
 * import crypto from 'crypto';
 *
 * export async function POST(request: NextRequest) {
 *   try {
 *     const body = await request.json();
 *     const signature = request.headers.get('x-event-checksum');
 *
 *     // Verificar firma
 *     const properties = body.signature?.properties || [];
 *     const checksumString = properties
 *       .map((prop: string) => {
 *         const keys = prop.split('.');
 *         let value = body.data;
 *         for (const key of keys) {
 *           value = value?.[key];
 *         }
 *         return value;
 *       })
 *       .join('');
 *
 *     const timestamp = body.timestamp;
 *     const toSign = `${checksumString}${timestamp}${process.env.WOMPI_EVENTS_SECRET}`;
 *     const expectedSignature = crypto.createHash('sha256').update(toSign).digest('hex');
 *
 *     if (signature !== expectedSignature) {
 *       return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
 *     }
 *
 *     // Procesar evento
 *     const event = body.event;
 *     const transaction = body.data?.transaction;
 *
 *     if (event === 'transaction.updated' && transaction?.status === 'APPROVED') {
 *       // Activar acceso del usuario, enviar email, etc.
 *       console.log('Payment approved:', transaction.reference);
 *     }
 *
 *     return NextResponse.json({ received: true });
 *   } catch (error) {
 *     console.error('Webhook error:', error);
 *     return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
 *   }
 * }
 * ```
 */
