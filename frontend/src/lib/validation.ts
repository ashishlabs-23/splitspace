/**
 * Secure Authentication & Input Validation Utilities
 * Follows SplitSpace Authentication Specification
 */

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

/**
 * Compulsory Username Validation Rules:
 * - Required during registration
 * - Minimum length: 2 characters
 * - Maximum length: 30 characters
 * - Allow only letters, numbers, underscores, and spaces
 * - Trim leading/trailing whitespace
 */
export function validateUsername(name: string): { valid: boolean; error?: string; sanitized: string } {
  const sanitized = name.trim();

  if (!sanitized) {
    return { valid: false, error: "Username is compulsory. Please enter your username.", sanitized };
  }

  if (sanitized.length < 2) {
    return { valid: false, error: "Username must be at least 2 characters.", sanitized };
  }

  if (sanitized.length > 30) {
    return { valid: false, error: "Username cannot exceed 30 characters.", sanitized };
  }

  const usernameRegex = /^[a-zA-Z0-9_ ]+$/;
  if (!usernameRegex.test(sanitized)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, underscores, and spaces.",
      sanitized,
    };
  }

  return { valid: true, sanitized };
}

/**
 * Email Validation Rules:
 * - Must be valid email format
 * - Normalized to lowercase
 */
export function validateEmail(email: string): { valid: boolean; error?: string; normalized: string } {
  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return { valid: false, error: "Email address is required.", normalized };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return { valid: false, error: "Please enter a valid email address.", normalized };
  }

  return { valid: true, normalized };
}

/**
 * Strict Password Policy Validation:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };

  const valid =
    checks.minLength &&
    checks.hasUppercase &&
    checks.hasLowercase &&
    checks.hasNumber &&
    checks.hasSpecial;

  let error: string | undefined;
  if (!checks.minLength) {
    error = "Password must be at least 8 characters.";
  } else if (!checks.hasUppercase || !checks.hasLowercase) {
    error = "Password must contain both uppercase and lowercase letters.";
  } else if (!checks.hasNumber) {
    error = "Password must contain at least one number.";
  } else if (!checks.hasSpecial) {
    error = "Password must contain at least one special character.";
  }

  return { valid, error, checks };
}

/**
 * Translates Firebase & system error codes into friendly user messages
 */
export function getFriendlyAuthErrorMessage(err: any): string {
  const code = err?.code || "";
  const msg = err?.message || "";

  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please sign in instead.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password. Please verify your credentials.";
    case "auth/weak-password":
      return "Password is too weak. Please include letters, numbers, and special characters.";
    case "auth/invalid-email":
      return "Invalid email format. Please check your email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/too-many-requests":
      return "Too many failed attempts. For your security, please try again in a few minutes.";
    case "auth/network-request-failed":
      return "Network connection issue. Please check your internet connection.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled before completion.";
    case "auth/popup-blocked":
      return "Google sign-in popup was blocked by your browser. Please allow popups.";
    case "auth/requires-recent-login":
      return "Please re-authenticate and try again.";
    default:
      if (msg.includes("Username is compulsory") || msg.includes("Username")) {
        return msg;
      }
      return msg || "Authentication failed. Please try again.";
  }
}
