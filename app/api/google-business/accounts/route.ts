import { requireActiveUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAccounts, getLocations } from "@/lib/google-business";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/google-business/accounts
 * Fetches the owner's Google Business accounts and their locations.
 */
export async function GET(req: NextRequest) {
  const owner = await requireActiveUserFromRequest(req);
  if (!owner) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ownerWithTokens = await prisma.owner.findUnique({
    where: { id: owner.id },
    select: {
      id: true,
      googleAccessToken: true,
      googleRefreshToken: true,
    },
  });

  if (!ownerWithTokens || !ownerWithTokens.googleAccessToken) {
    return NextResponse.json(
      { error: "google_not_connected" },
      { status: 400 }
    );
  }

  try {
    // Fetch accounts
    const accountsRes = await getAccounts(ownerWithTokens);
    const accounts = accountsRes.accounts || [];

    // Fetch locations for each account
    const accountsWithLocations = await Promise.all(
      accounts.map(async (account) => {
        try {
          const locationsRes = await getLocations(ownerWithTokens, account.name);
          return {
            ...account,
            locations: locationsRes.locations || [],
          };
        } catch (err) {
          console.error(
            `Failed to fetch locations for ${account.name}:`,
            err
          );
          return {
            ...account,
            locations: [],
            locationError: "Failed to fetch locations",
          };
        }
      })
    );

    return NextResponse.json({ accounts: accountsWithLocations });
  } catch (error) {
    console.error("Google Business API error:", error);
    return NextResponse.json(
      {
        error: "api_error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
