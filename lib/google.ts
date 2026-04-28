import { google } from "googleapis";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/business.manage",
];

export const GOOGLE_OAUTH_STATE_COOKIE = "rqr_google_oauth_state";

export interface GoogleBusinessLocation {
  locationId: string;
  title: string;
  address: string;
  placeId: string | null;
  googleMapsUrl: string;
  googleReviewUrl: string;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`missing_${name.toLowerCase()}`);
  }
  return value;
}

export function getOAuthClient() {
  return new google.auth.OAuth2(
    requireEnv("GOOGLE_CLIENT_ID"),
    requireEnv("GOOGLE_CLIENT_SECRET"),
    requireEnv("GOOGLE_REDIRECT_URI"),
  );
}

export function getAuthUrl(state: string): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state,
  });
}

export async function getTokensFromCode(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function getFreshAccessToken(refreshToken: string): Promise<string> {
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  if (!credentials.access_token) {
    throw new Error("missing_google_access_token");
  }
  return credentials.access_token;
}

export async function fetchGoogleBusinessLocations(
  accessToken: string,
): Promise<GoogleBusinessLocation[]> {
  const client = getOAuthClient();
  client.setCredentials({ access_token: accessToken });

  const accountsApi = google.mybusinessaccountmanagement({
    version: "v1",
    auth: client,
  });

  const businessInfoApi = google.mybusinessbusinessinformation({
    version: "v1",
    auth: client,
  });

  const accountsRes = await accountsApi.accounts.list();
  const accounts = accountsRes.data.accounts ?? [];

  if (accounts.length === 0) {
    return [];
  }

  const locations: GoogleBusinessLocation[] = [];

  for (const account of accounts) {
    if (!account.name) continue;

    try {
      const locRes = await businessInfoApi.accounts.locations.list({
        parent: account.name,
        readMask: "name,title,storefrontAddress,metadata",
      });

      for (const loc of locRes.data.locations ?? []) {
        if (!loc.name) continue;

        const storefrontAddress = loc.storefrontAddress;
        const address = storefrontAddress
          ? [
              storefrontAddress.addressLines?.join(", "),
              storefrontAddress.locality,
              storefrontAddress.administrativeArea,
            ]
              .filter(Boolean)
              .join(", ")
          : "";

        const metadata = (loc as {
          metadata?: {
            placeId?: string | null;
            mapsUri?: string | null;
            newReviewUri?: string | null;
          };
        }).metadata;

        locations.push({
          locationId: loc.name,
          title: loc.title ?? "Unnamed Location",
          address,
          placeId: metadata?.placeId ?? null,
          googleMapsUrl: metadata?.mapsUri ?? "",
          googleReviewUrl: metadata?.newReviewUri ?? "",
        });
      }
    } catch {
      // Skip accounts we cannot enumerate instead of breaking the whole sync.
    }
  }

  return locations;
}

export async function findOwnedGoogleBusinessLocation(
  accessToken: string,
  locationId: string,
): Promise<GoogleBusinessLocation | null> {
  const locations = await fetchGoogleBusinessLocations(accessToken);
  return locations.find((location) => location.locationId === locationId) ?? null;
}

export async function fetchUnansweredReviews(
  accessToken: string,
  locationName: string,
) {
  const client = getOAuthClient();
  client.setCredentials({ access_token: accessToken });

  const reviewsApi = (google as any).mybusinessreviews({
    version: "v1",
    auth: client,
  });

  const res = await (reviewsApi as any).locations.reviews.list({
    parent: locationName,
  });

  const reviews = (res.data.reviews ?? []) as Array<{
    name: string;
    reviewer: { displayName: string };
    starRating: string;
    comment: string;
    reviewReply?: { comment: string };
  }>;

  return reviews.filter((review) => !review.reviewReply);
}

export async function postReviewReply(
  accessToken: string,
  reviewName: string,
  replyText: string,
) {
  const client = getOAuthClient();
  client.setCredentials({ access_token: accessToken });

  const reviewsApi = (google as any).mybusinessreviews({
    version: "v1",
    auth: client,
  });

  await (reviewsApi as any).locations.reviews.updateReply({
    name: reviewName,
    requestBody: { comment: replyText },
  });
}
