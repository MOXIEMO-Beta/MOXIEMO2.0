// Central translation layer: raw Supabase/network error codes → human-readable messages.
// Never show raw API error strings to users. Always run through here first.

export type AuthErrorContext =
  | "sign_in"
  | "sign_up"
  | "google"
  | "apple"
  | "forgot_password"
  | "reset_password"
  | "set_password"
  | "save_progress"
  | "generate_first_move"
  | "complete_onboarding";

// Maps a raw error message / status code to a copy that a non-technical founder can act on.
export function friendlyAuthError(context: AuthErrorContext, raw?: unknown): string {
  const msg = extractMessage(raw).toLowerCase();

  // ── Supabase Auth error strings ───────────────────────────────────────────
  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
    return "That email and password combination is not right. Double-check and try again.";
  }
  if (msg.includes("email not confirmed")) {
    return "You haven't confirmed your email yet. Check your inbox for the confirmation link.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "An account with that email already exists. Try signing in instead.";
  }
  if (msg.includes("password should be at least") || msg.includes("password is too short")) {
    return "Your password needs to be at least 8 characters with an uppercase letter and a number.";
  }
  if (msg.includes("email link is invalid") || msg.includes("token has expired") || msg.includes("otp expired")) {
    return "That link has expired. Request a new one — links are only valid for 60 minutes.";
  }
  if (msg.includes("user not found") || msg.includes("no user") || msg.includes("not found")) {
    return "No account found with that email address. Check for a typo or create a new account.";
  }
  if (msg.includes("email rate limit") || msg.includes("too many requests") || msg.includes("rate limit")) {
    return "Too many attempts in a short time. Wait a minute and try again.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("networkerror")) {
    return "No internet connection. Check your connection and try again.";
  }
  if (msg.includes("popup_closed") || msg.includes("popup closed")) {
    return "Sign-in window was closed. Click the button again to try.";
  }
  if (msg.includes("access_denied") || msg.includes("cancelled")) {
    return "Sign-in was cancelled. Click the button when you are ready.";
  }
  if (msg.includes("same password") || msg.includes("different from the old password")) {
    return "Your new password must be different from your current one.";
  }

  // ── Context-specific fallbacks ────────────────────────────────────────────
  switch (context) {
    case "sign_in":
      return "Could not sign you in. Check your email and password and try again.";
    case "sign_up":
      return "Could not create your account. Check your details and try again.";
    case "google":
      return "Google sign-in did not complete. Try again, or use email instead.";
    case "apple":
      return "Apple sign-in did not complete. Try again, or use email instead.";
    case "forgot_password":
      return "Could not send the reset email. Try again in a moment.";
    case "reset_password":
      return "Could not update your password. The link may have expired — request a new one.";
    case "set_password":
      return "Could not set your password. Try again or contact support.";
    case "save_progress":
      return "Your progress could not be saved right now. Check your connection and try again.";
    case "generate_first_move":
      return "Could not generate your first move right now. Your other answers are saved — try again in a moment.";
    case "complete_onboarding":
      return "Could not finish setting up your account. Your answers are saved — try again or refresh the page.";
  }
}

function extractMessage(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (raw instanceof Error) return raw.message ?? "";
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error_description === "string") return o.error_description;
    if (typeof o.error === "string") return o.error;
  }
  return "";
}
