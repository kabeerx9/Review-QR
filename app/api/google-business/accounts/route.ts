import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAccounts, getLocations } from "@/lib/google-business";
import { NextResponse } from "next/server";

/**
 * GET /api/google-business/accounts
 * Fetches the owner's Google Business accounts and their locations.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const owner = await prisma.owner.findUnique({
    where: { id: session.ownerId },
    select: {
      id: true,
      googleAccessToken: true,
      googleRefreshToken: true,
    },
  });

  if (!owner || !owner.googleAccessToken) {
    return NextResponse.json(
      { error: "google_not_connected" },
      { status: 400 }
    );
  }

  try {
    // Fetch accounts
    const accountsRes = await getAccounts(owner);
    const accounts = accountsRes.accounts || [];

    // Fetch locations for each account
    const accountsWithLocations = await Promise.all(
      accounts.map(async (account) => {
        try {
          const locationsRes = await getLocations(owner, account.name);
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
