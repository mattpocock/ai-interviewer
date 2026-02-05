import { useSearchParams } from "react-router";

export function meta() {
  return [{ title: "Authentication Error - AI Interviewer" }];
}

export default function AuthError() {
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    missing_params: "Missing required authentication parameters.",
    invalid_state: "Invalid authentication state. Please try again.",
    oauth_failed: "Authentication failed. Please try again.",
  };

  const message = errorParam
    ? errorMessages[errorParam] || "An unknown error occurred."
    : "An error occurred during authentication.";

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Authentication Error</h1>
      <p>{message}</p>
      <p>
        <a href="/auth/google">Try again</a> | <a href="/">Go home</a>
      </p>
    </div>
  );
}
