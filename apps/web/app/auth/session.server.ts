import * as jose from "jose";

const JWT_SECRET =
  process.env.JWT_SECRET || "development-secret-change-in-production";
const JWT_ISSUER = "ai-interviewer";
const JWT_AUDIENCE = "ai-interviewer-users";
const COOKIE_NAME = "session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);

  const jwt = await new jose.SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime("30d")
    .sign(secret);

  return jwt;
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export function createSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = secure ? "Lax" : "Lax";

  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${COOKIE_MAX_AGE}${secure ? "; Secure" : ""}`;
}

export function createLogoutCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getSessionFromCookie(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (!sessionCookie) return null;

  return sessionCookie.slice(COOKIE_NAME.length + 1);
}

export async function getSessionFromRequest(
  request: Request
): Promise<SessionPayload | null> {
  const cookieHeader = request.headers.get("Cookie");
  const token = getSessionFromCookie(cookieHeader);

  if (!token) return null;

  return verifySession(token);
}

// OAuth state cookie helpers
const STATE_COOKIE_NAME = "oauth_state";
const VERIFIER_COOKIE_NAME = "oauth_verifier";
const STATE_COOKIE_MAX_AGE = 60 * 10; // 10 minutes

export function createOAuthStateCookies({
  state,
  codeVerifier,
}: {
  state: string;
  codeVerifier: string;
}): string[] {
  const secure = process.env.NODE_ENV === "production";
  return [
    `${STATE_COOKIE_NAME}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${STATE_COOKIE_MAX_AGE}${secure ? "; Secure" : ""}`,
    `${VERIFIER_COOKIE_NAME}=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${STATE_COOKIE_MAX_AGE}${secure ? "; Secure" : ""}`,
  ];
}

export function getOAuthStateFromCookies(cookieHeader: string | null): {
  state: string | null;
  codeVerifier: string | null;
} {
  if (!cookieHeader) return { state: null, codeVerifier: null };

  const cookies = cookieHeader.split(";").map((c) => c.trim());

  const stateCookie = cookies.find((c) =>
    c.startsWith(`${STATE_COOKIE_NAME}=`)
  );
  const verifierCookie = cookies.find((c) =>
    c.startsWith(`${VERIFIER_COOKIE_NAME}=`)
  );

  return {
    state: stateCookie ? stateCookie.slice(STATE_COOKIE_NAME.length + 1) : null,
    codeVerifier: verifierCookie
      ? verifierCookie.slice(VERIFIER_COOKIE_NAME.length + 1)
      : null,
  };
}

export function clearOAuthStateCookies(): string[] {
  return [
    `${STATE_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `${VERIFIER_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  ];
}
