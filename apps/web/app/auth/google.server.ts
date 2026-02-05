import { Google } from "arctic";

function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables");
  }

  return new Google(clientId, clientSecret, redirectUri);
}

export function createGoogleAuthUrl(): { url: URL; state: string; codeVerifier: string } {
  const google = getGoogleClient();
  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomUUID();
  const scopes = ["openid", "profile", "email"];

  const url = google.createAuthorizationURL(state, codeVerifier, scopes);

  return { url, state, codeVerifier };
}

export async function validateGoogleCallback(code: string, codeVerifier: string) {
  const google = getGoogleClient();
  const tokens = await google.validateAuthorizationCode(code, codeVerifier);
  return tokens;
}

export interface GoogleUserInfo {
  sub: string; // Google's unique user ID
  name: string;
  email: string;
  picture?: string;
}

export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user info from Google");
  }

  return response.json();
}
