/**
 * Single source of truth for the JCV WhatsApp contact.
 *
 * Always use `buildWhatsAppUrl(message)` instead of hardcoding wa.me hrefs so
 * the phone number lives in exactly one place and every CTA can prefill a
 * context-specific message.
 */
export const WHATSAPP_PHONE = "573143826430";

export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_PHONE}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
