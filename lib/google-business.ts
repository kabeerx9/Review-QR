import { decrypt, encrypt } from "@/lib/crypto";
import prisma from "@/lib/prisma";

interface Owner {
  id: string;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
}

// ─── Token Management ────────────────────────────────────────────

/**
 * Refresh the access token using the stored refresh token.
 * Updates the DB with the new encrypted access token.
 */
async function refreshAccessToken(owner: Owner): Promise<string> {
  if (!owner.googleRefreshToken) {
    throw new Error("no_refresh_token");
  }

  const refreshToken = decrypt(owner.googleRefreshToken);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Google token refresh failed:", error);
    throw new Error("token_refresh_failed");
  }

  const data = await res.json();
  const newAccessToken = data.access_token as string;

  // Update DB with new encrypted access token
  await prisma.owner.update({
    where: { id: owner.id },
    data: { googleAccessToken: encrypt(newAccessToken) },
  });

  return newAccessToken;
}

/**
 * Get a valid access token for the owner.
 * Always refreshes since Google tokens expire in 1 hour
 * and we don't store expiry time.
 */
export async function getAccessToken(owner: Owner): Promise<string> {
  return refreshAccessToken(owner);
}

// ─── Account & Location APIs ─────────────────────────────────────

export interface GoogleAccount {
  name: string; // e.g. "accounts/123456"
  accountName: string;
  type: string;
  role: string;
}

export interface GoogleLocation {
  name: string; // e.g. "locations/789"
  title: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
  };
}

/**
 * List all Google Business accounts for this owner.
 */
export async function getAccounts(owner: Owner): Promise<{ accounts: GoogleAccount[] }> {
  const token = await getAccessToken(owner);
  const res = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const error = await res.text();
    console.error("Failed to fetch accounts:", error);
    throw new Error("fetch_accounts_failed");
  }

  return res.json();
}

/**
 * List all locations for a given account.
 */
export async function getLocations(
  owner: Owner,
  accountId: string
): Promise<{ locations: GoogleLocation[] }> {
  const token = await getAccessToken(owner);

  // Use Business Information API to list locations
  const res = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?readMask=name,title,storefrontAddress`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const error = await res.text();
    console.error("Failed to fetch locations:", error);
    throw new Error("fetch_locations_failed");
  }

  return res.json();
}

// ─── Reviews APIs ────────────────────────────────────────────────

export interface GoogleReview {
  name: string; // e.g. "accounts/123/locations/456/reviews/789"
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

/**
 * Fetch reviews for a location.
 */
export async function getReviews(
  owner: Owner,
  accountId: string,
  locationId: string
): Promise<{ reviews: GoogleReview[]; totalReviewCount: number }> {
  const token = await getAccessToken(owner);
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const error = await res.text();
    console.error("Failed to fetch reviews:", error);
    throw new Error("fetch_reviews_failed");
  }

  return res.json();
}

/**
 * Reply to a specific review.
 */
export async function replyToReview(
  owner: Owner,
  accountId: string,
  locationId: string,
  reviewId: string,
  replyText: string
): Promise<void> {
  const token = await getAccessToken(owner);
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews/${reviewId}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: replyText }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    console.error("Failed to reply to review:", error);
    throw new Error("reply_failed");
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Convert Google star rating enum to number.
 */
export function starRatingToNumber(rating: GoogleReview["starRating"]): number {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return map[rating] ?? 0;
}

/**
 * Sleep helper for rate limiting.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
