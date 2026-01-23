import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "",
});

interface PreferenceItem {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  currencyId: string;
}

interface CreatePreferenceBody {
  items: PreferenceItem[];
  payer?: {
    name?: string;
    email?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "MercadoPago not configured" },
        { status: 500 }
      );
    }

    const body: CreatePreferenceBody = await request.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    const preference = new Preference(client);

    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://jcvfitness.com";

    const result = await preference.create({
      body: {
        items: body.items.map((item) => ({
          id: item.title.toLowerCase().replace(/\s+/g, "-"),
          title: item.title,
          description: item.description || "",
          quantity: item.quantity,
          unit_price: item.unitPrice,
          currency_id: item.currencyId,
        })),
        payer: body.payer
          ? {
              name: body.payer.name,
              email: body.payer.email,
            }
          : undefined,
        back_urls: {
          success: `${baseUrl}/payment/success`,
          failure: `${baseUrl}/payment/failure`,
          pending: `${baseUrl}/payment/pending`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        statement_descriptor: "JCV FITNESS",
        external_reference: `jcv-${Date.now()}`,
      },
    });

    return NextResponse.json({
      id: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    });
  } catch (error) {
    console.error("Error creating MercadoPago preference:", error);
    return NextResponse.json(
      { error: "Failed to create payment preference" },
      { status: 500 }
    );
  }
}
