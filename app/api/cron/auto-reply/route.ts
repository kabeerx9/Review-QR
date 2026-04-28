import {
  fetchUnansweredReviews,
  getFreshAccessToken,
  postReviewReply,
} from "@/lib/google";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("missing_groq_api_key");
  }

  return new Groq({ apiKey });
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json({ error: "missing_cron_secret" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { shopId: string; repliesPosted: number; error?: string }[] = [];

  const shops = await prisma.shop.findMany({
    where: {
      isActive: true,
      googleLocationId: { not: null },
      owner: {
        autoReplyEnabled: true,
        googleRefreshToken: { not: null },
      },
    },
    include: {
      owner: {
        select: {
          googleRefreshToken: true,
          name: true,
        },
      },
    },
  });

  for (const shop of shops) {
    try {
      const accessToken = await getFreshAccessToken(shop.owner.googleRefreshToken!);

      await prisma.owner.update({
        where: { id: shop.ownerId },
        data: { googleAccessToken: accessToken },
      });

      const unansweredReviews = await fetchUnansweredReviews(
        accessToken,
        shop.googleLocationId!,
      );

      let repliesPosted = 0;

      for (const review of unansweredReviews) {
        try {
          const reply = await generateReply(
            shop.name,
            shop.owner.name,
            review.reviewer.displayName,
            review.starRating,
            review.comment,
          );

          await postReviewReply(accessToken, review.name, reply);
          repliesPosted++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (reviewErr) {
          console.error(`Failed to reply to review ${review.name}:`, reviewErr);
        }
      }

      await prisma.shop.update({
        where: { id: shop.id },
        data: { lastAutoReplyCheckAt: new Date() },
      });

      results.push({ shopId: shop.id, repliesPosted });
    } catch (shopErr) {
      const msg = shopErr instanceof Error ? shopErr.message : String(shopErr);
      console.error(`Failed to process shop ${shop.id}:`, shopErr);
      results.push({ shopId: shop.id, repliesPosted: 0, error: msg });
    }
  }

  return NextResponse.json({ success: true, processed: results.length, results });
}

async function generateReply(
  shopName: string,
  ownerName: string,
  reviewerName: string,
  starRating: string,
  reviewText: string,
): Promise<string> {
  const groq = getGroqClient();
  const stars =
    starRating === "FIVE"
      ? 5
      : starRating === "FOUR"
        ? 4
        : starRating === "THREE"
          ? 3
          : starRating === "TWO"
            ? 2
            : 1;

  const prompt = `You are the owner of "${shopName}" (Owner: ${ownerName}).
A customer named ${reviewerName} left a ${stars}-star review.

Review text: "${reviewText || "(No written review)"}"

Write a warm, genuine, human-like reply (2-4 sentences).
- Match the language of the review EXACTLY (Hindi, English, Hinglish, etc.)
- If the review is positive: thank them warmly and invite them back
- If mixed or negative: acknowledge the concern empathetically, offer to make it right
- Do NOT sound robotic or use corporate language
- Do NOT mention being an AI
- Keep it personal, like a real shop owner would write

Reply only with the reply text, nothing else.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
    temperature: 0.8,
  });

  return (
    completion.choices[0]?.message?.content?.trim() ??
    "Thank you for your feedback!"
  );
}
