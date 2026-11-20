/**
 * Client-Side Security & Input Sanitization
 * Protects against XSS, Open Redirects, and URL Query Parameter Manipulation.
 */

/**
 * Validates invite tokens to strictly alphanumeric characters.
 * Prevents path traversal, prototype pollution, and URL injection.
 */
export function isValidInviteToken(token: unknown): token is string {
  if (typeof token !== "string") return false;
  const trimmed = token.trim();
  return /^[a-zA-Z0-9_-]{6,64}$/.test(trimmed);
}

/**
 * Validates space ID format.
 */
export function isValidSpaceId(spaceId: unknown): spaceId is string {
  if (typeof spaceId !== "string") return false;
  const trimmed = spaceId.trim();
  return /^[a-zA-Z0-9_\-]{3,64}$/.test(trimmed);
}

/**
 * Sanitizes internal navigation targets to prevent open redirects.
 * Disallows protocol-relative URLs (//attacker.com), backslashes (/\attacker.com),
 * and pseudo-protocols (javascript:).
 */
export function getSafeInternalRedirect(target: string | null | undefined, fallback = "/"): string {
  if (!target || typeof target !== "string") return fallback;
  const trimmed = target.trim();
  // Must start with a single '/' followed by valid URL path/query characters
  if (/^\/[a-zA-Z0-9_?&=#-][a-zA-Z0-9_\-\/?&=#.]*$/.test(trimmed) || trimmed === "/") {
    return trimmed;
  }
  return fallback;
}

/**
 * Strips HTML tags and potential script injection strings from plain text inputs.
 */
export function sanitizePlainText(input: string | null | undefined, maxLength = 200): string {
  if (!input) return "";
  return input
    .replace(/[<>]/g, "") // remove < and >
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates avatar image URLs to ensure they only come from trusted HTTPS origins.
 */
export function isValidAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname.endsWith(".googleusercontent.com") ||
        parsed.hostname.endsWith(".githubusercontent.com") ||
        parsed.hostname.endsWith(".firebaseapp.com") ||
        parsed.hostname === "splitspace-9d28f.web.app")
    );
  } catch {
    return false;
  }
}
