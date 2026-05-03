import { NICHE_LABELS } from "@/constants/niches";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface ReviewInput {
  shopName: string;
  city: string;
  niche: string;
  specialties?: string | null;
  categories: [string, string, string, string];
  ratings: [number, number, number, number];
}

interface GroqChatResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
}

async function runGroqPrompt(prompt: string, temperature = 0.85): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("missing_groq_api_key");
  }

  const model = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: 512,
      seed: Math.floor(Math.random() * 1000000),
    }),
    cache: "no-store",
  });

  const raw = await res.text();
  let data: GroqChatResponse;
  try {
    data = JSON.parse(raw) as GroqChatResponse;
  } catch {
    throw new Error(`groq_invalid_json: ${raw.slice(0, 120)}`);
  }

  if (!res.ok) {
    const msg = data.error?.message ?? raw.slice(0, 200);
    throw new Error(`groq_http_${res.status}: ${msg}`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("empty_groq_response");
  }
  return text;
}

export async function generateHinglishReview(input: ReviewInput): Promise<string> {
  const REVIEW_LENGTHS = [
    "Extremely short (1-2 very short sentences max). Get straight to the point.",
    "Short and punchy (2-3 sentences max). Just the core highlight.",
    "Medium (3 sentences max). Balanced with a bit of detail."
  ];

  const REVIEW_TONES = [
    "Casual, friendly, highly colloquial Hinglish.",
    "Slightly formal but appreciative, polite.",
    "Very enthusiastic and energetic, like recommending to a best friend.",
    "Direct, practical, no-nonsense review."
  ];

  const REVIEWER_PERSONAS = [
    "A local resident who just stopped by.",
    "Someone who came with their family/friends.",
    "A first-time visitor trying it out.",
    "Someone in a rush who appreciated the quick service."
  ];

  const LANGUAGES = [
    "Hinglish (mix of Hindi and English). Keep it completely natural. Use words like 'ekdum', 'mast', 'sahi', 'zabardast' naturally. DO NOT start every sentence with 'Bhai' or 'Yaar', do not overdo the slang.",
    "Pure English. Natural, conversational, and fluent.",
    "English with a very slight local Indian flavor (using terms like 'proper', 'nice ambience')."
  ];

  const languageInstruction = LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
  const lengthInstruction = REVIEW_LENGTHS[Math.floor(Math.random() * REVIEW_LENGTHS.length)];
  const toneInstruction = REVIEW_TONES[Math.floor(Math.random() * REVIEW_TONES.length)];
  const personaInstruction = REVIEWER_PERSONAS[Math.floor(Math.random() * REVIEWER_PERSONAS.length)];
  
  // Dynamic temperature between 0.6 and 0.9 for variation
  const temperature = 0.6 + Math.random() * 0.3;

  const nicheLabel = NICHE_LABELS[input.niche] ?? input.niche;
  const specialtiesText = input.specialties ? `\n- Specializes in: ${input.specialties}` : "";

  // Filter to only include things they rated 4 or 5
  const positiveRatings = input.categories
    .map((cat, i) => ({ category: cat, rating: input.ratings[i] }))
    .filter(r => r.rating >= 4)
    .map(r => r.category);

  const ratingsText = positiveRatings.length > 0 
    ? `Specific things I liked: ${positiveRatings.join(", ")}` 
    : "Overall experience was decent.";

  const prompt = `You are a real Indian customer writing a genuine Google review.
DO NOT ACT LIKE AN AI. Act like a human (${personaInstruction}).

Context:
- Shop Name: ${input.shopName}
- City: ${input.city}
- Business Type: ${nicheLabel}${specialtiesText}
- Key Highlights: ${ratingsText}

Instructions for uniqueness & SEO (WITHOUT spamming):
- MUST DO: Explicitly highlight and praise the specific things I liked: ${positiveRatings.join(", ")}. Do not ignore this.
- Language: ${languageInstruction}
- Tone: ${toneInstruction}
- Length: ${lengthInstruction}
- MAXIMUM length: strictly under 4 sentences. Keep it highly concise.
- SEO: Naturally mention the shop name once and the city name if it makes sense. Do NOT sound like an advertisement. Use a relevant keyword naturally based on the Business Type. ${input.specialties ? `Crucially, try to naturally weave in one of these specialties into your review: "${input.specialties}".` : ""}
- Start abruptly or naturally, do NOT start with "I visited", "Great experience", or "Highly recommended" every time. Vary the opening.
- Make it sound like a unique, personal experience.
- DO NOT use hashtags.
- Use 0 to 2 emojis.
- Do NOT use robotic/marketing phrases ("This establishment", "Top-notch", "Aesthetically pleasing", "Delightful").

Output ONLY the review text. No quotes, no preamble, no markdown.`;

  return runGroqPrompt(prompt, temperature);
}

