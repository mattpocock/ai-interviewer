import { redirect } from "react-router";
import { createGoogleAuthUrl } from "~/auth/google.server";
import { createOAuthStateCookies } from "~/auth/session.server";

export async function loader() {
  const { url, state, codeVerifier } = createGoogleAuthUrl();
  const stateCookies = createOAuthStateCookies(state, codeVerifier);

  return redirect(url.toString(), {
    headers: stateCookies.map((cookie): [string, string] => [
      "Set-Cookie",
      cookie,
    ]),
  });
}
