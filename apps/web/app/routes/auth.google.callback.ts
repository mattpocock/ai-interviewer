import { redirect } from "react-router";
import { Effect, Option } from "effect";
import { UserRepository, type User } from "@ai-interviewer/shared";
import {
  validateGoogleCallback,
  getGoogleUserInfo,
} from "~/auth/google.server";
import {
  createSession,
  createSessionCookie,
  getOAuthStateFromCookies,
  clearOAuthStateCookies,
} from "~/auth/session.server";
import { AllRepositoriesLive } from "~/db/repositories";
import type { Route } from "./+types/auth.google.callback";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return redirect("/auth/error?error=missing_params");
  }

  const cookieHeader = request.headers.get("Cookie");
  const { state: storedState, codeVerifier } =
    getOAuthStateFromCookies(cookieHeader);

  if (!storedState || !codeVerifier || state !== storedState) {
    return redirect("/auth/error?error=invalid_state");
  }

  try {
    // Validate OAuth callback and get tokens
    const tokens = await validateGoogleCallback(code, codeVerifier);

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokens.accessToken());

    // Find or create user in database
    const findOrCreateUser: Effect.Effect<
      User,
      never,
      typeof UserRepository.Service
    > = Effect.gen(function* () {
      const userRepo = yield* UserRepository;
      const existingUser = yield* userRepo.findByGoogleId(googleUser.sub);

      if (Option.isSome(existingUser)) {
        return existingUser.value;
      }

      // Create new user
      return yield* userRepo.create({
        googleId: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture ?? null,
      });
    });

    const user = await Effect.runPromise(
      Effect.provide(findOrCreateUser, AllRepositoriesLive)
    );

    // Create session JWT
    const sessionToken = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Clear OAuth state cookies and set session cookie
    const clearCookies = clearOAuthStateCookies();
    const sessionCookie = createSessionCookie(sessionToken);

    return redirect("/", {
      headers: [
        ...clearCookies.map((c): [string, string] => ["Set-Cookie", c]),
        ["Set-Cookie", sessionCookie],
      ],
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    return redirect("/auth/error?error=oauth_failed");
  }
}
