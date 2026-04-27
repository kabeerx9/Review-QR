import { NICHE_CATEGORIES } from "@/constants/niches";
import { getTwilioClient } from "@/lib/twilio";

export interface BadReviewAlertInput {
  /** E.164 with +, e.g. +919876543210, or 10-digit Indian mobile */
  ownerPhone: string;
  shopName: string;
  niche: string;
  ratings: [number, number, number, number];
  averageRating: number;
  customerPhone?: string;
  timestamp: Date;
}

/** Twilio `to` address for WhatsApp */
function normalizeWhatsAppTo(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (s.toLowerCase().startsWith("whatsapp:")) {
    s = s.slice("whatsapp:".length).trim();
  }
  s = s.replace(/[\s-]/g, "");
  if (!s.startsWith("+")) {
    const digits = s.replace(/\D/g, "");
    if (digits.length === 10) return `whatsapp:+91${digits}`;
    if (digits.length >= 10) return `whatsapp:+${digits}`;
    return null;
  }
  return `whatsapp:${s}`;
}

export async function sendBadReviewAlert(input: BadReviewAlertInput): Promise<void> {
  const twilioClient = getTwilioClient();
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = normalizeWhatsAppTo(input.ownerPhone);
  if (!twilioClient || !from || !to) {
    return;
  }

  const categories = NICHE_CATEGORIES[input.niche] ?? [
    "Category 1",
    "Category 2",
    "Category 3",
    "Category 4",
  ];
  const ratingsText = categories
    .map((cat, i) => `${cat}: ${input.ratings[i]}/5`)
    .join("\n");

  const time = input.timestamp.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const body = `⚠️ New private feedback for *${input.shopName}*

${ratingsText}

Overall: ${input.averageRating.toFixed(1)}/5
Received: ${time}${input.customerPhone ? `\nCustomer: ${input.customerPhone}` : ""}

This was intercepted before reaching Google. Reach out and fix it! 💪`;

  await twilioClient.messages.create({
    from,
    to,
    body,
  });
}
