import {
  UtensilsCrossed,
  Car,
  Building2,
  Ticket,
  ShoppingBag,
  Coffee,
  Zap,
  ReceiptText,
  Plane,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export interface ExpenseCategory {
  id: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    id: "food",
    label: "Food & Dining",
    sublabel: "Meals, dining out & catering",
    icon: UtensilsCrossed,
    colorClass: "cat-food",
    badgeBg: "rgba(241, 107, 45, 0.12)",
    badgeText: "#c24912",
    badgeBorder: "rgba(241, 107, 45, 0.28)",
  },
  {
    id: "transport",
    label: "Transportation & Travel",
    sublabel: "Cabs, fuel, flights & transit",
    icon: Car,
    colorClass: "cat-transport",
    badgeBg: "rgba(13, 27, 66, 0.08)",
    badgeText: "#0d1b42",
    badgeBorder: "rgba(13, 27, 66, 0.22)",
  },
  {
    id: "accommodation",
    label: "Accommodation & Stay",
    sublabel: "Hotels, stays & venue rentals",
    icon: Building2,
    colorClass: "cat-stay",
    badgeBg: "rgba(199, 63, 49, 0.12)",
    badgeText: "#96271c",
    badgeBorder: "rgba(199, 63, 49, 0.28)",
  },
  {
    id: "entertainment",
    label: "Entertainment & Leisure",
    sublabel: "Events, tickets & activities",
    icon: Ticket,
    colorClass: "cat-entertainment",
    badgeBg: "rgba(238, 180, 142, 0.32)",
    badgeText: "#c24912",
    badgeBorder: "rgba(241, 107, 45, 0.30)",
  },
  {
    id: "shopping",
    label: "Shopping & Supplies",
    sublabel: "Equipment, gear & supplies",
    icon: ShoppingBag,
    colorClass: "cat-shopping",
    badgeBg: "rgba(241, 107, 45, 0.10)",
    badgeText: "#c24912",
    badgeBorder: "rgba(241, 107, 45, 0.22)",
  },
  {
    id: "cafe",
    label: "Cafe & Refreshments",
    sublabel: "Coffee, drinks & quick snacks",
    icon: Coffee,
    colorClass: "cat-cafe",
    badgeBg: "rgba(238, 180, 142, 0.28)",
    badgeText: "#96271c",
    badgeBorder: "rgba(199, 63, 49, 0.22)",
  },
  {
    id: "utilities",
    label: "Utilities & Operations",
    sublabel: "Electricity, internet & tools",
    icon: Zap,
    colorClass: "cat-utilities",
    badgeBg: "rgba(13, 27, 66, 0.10)",
    badgeText: "#0d1b42",
    badgeBorder: "rgba(13, 27, 66, 0.24)",
  },
  {
    id: "general",
    label: "General / Miscellaneous",
    sublabel: "Other shared expenditures",
    icon: ReceiptText,
    colorClass: "cat-general",
    badgeBg: "rgba(241, 107, 45, 0.08)",
    badgeText: "#0d1b42",
    badgeBorder: "rgba(13, 27, 66, 0.18)",
  },
];

/**
 * Normalizes any category identifier (including legacy emoji or string keys)
 * to a standardized ExpenseCategory metadata object.
 */
export function getCategoryMeta(rawCategory?: string): ExpenseCategory {
  if (!rawCategory) return EXPENSE_CATEGORIES[0];
  const trimmed = rawCategory.trim();
  const normalized = trimmed.toLowerCase();

  // Match by exact or partial ID / label
  const direct = EXPENSE_CATEGORIES.find(
    c => c.id.toLowerCase() === normalized || c.label.toLowerCase() === normalized
  );
  if (direct) return direct;

  // Legacy emoji or substring heuristic mappings
  if (
    trimmed.includes("🍽️") ||
    trimmed.includes("🍔") ||
    trimmed.includes("🍱") ||
    normalized.includes("food") ||
    normalized.includes("dinner") ||
    normalized.includes("lunch") ||
    normalized.includes("breakfast") ||
    normalized.includes("meal")
  ) {
    return EXPENSE_CATEGORIES[0]; // Food & Dining
  }

  if (
    trimmed.includes("🚕") ||
    trimmed.includes("🚗") ||
    trimmed.includes("🛵") ||
    trimmed.includes("✈️") ||
    normalized.includes("transport") ||
    normalized.includes("travel") ||
    normalized.includes("cab") ||
    normalized.includes("taxi") ||
    normalized.includes("fuel") ||
    normalized.includes("flight") ||
    normalized.includes("scooter")
  ) {
    return EXPENSE_CATEGORIES[1]; // Transportation
  }

  if (
    trimmed.includes("🏠") ||
    trimmed.includes("🏨") ||
    trimmed.includes("🏕️") ||
    normalized.includes("stay") ||
    normalized.includes("hotel") ||
    normalized.includes("villa") ||
    normalized.includes("accom") ||
    normalized.includes("rent")
  ) {
    return EXPENSE_CATEGORIES[2]; // Accommodation
  }

  if (
    trimmed.includes("🎟️") ||
    trimmed.includes("🎉") ||
    trimmed.includes("🎬") ||
    trimmed.includes("🎸") ||
    normalized.includes("entertainment") ||
    normalized.includes("event") ||
    normalized.includes("ticket") ||
    normalized.includes("movie")
  ) {
    return EXPENSE_CATEGORIES[3]; // Entertainment
  }

  if (
    trimmed.includes("🛍️") ||
    trimmed.includes("🛒") ||
    normalized.includes("shop") ||
    normalized.includes("supplies") ||
    normalized.includes("gear")
  ) {
    return EXPENSE_CATEGORIES[4]; // Shopping
  }

  if (
    trimmed.includes("☕") ||
    trimmed.includes("🥤") ||
    trimmed.includes("🍺") ||
    normalized.includes("cafe") ||
    normalized.includes("coffee") ||
    normalized.includes("snack") ||
    normalized.includes("drink")
  ) {
    return EXPENSE_CATEGORIES[5]; // Cafe
  }

  if (
    trimmed.includes("⚡") ||
    trimmed.includes("💡") ||
    trimmed.includes("💸") ||
    normalized.includes("util") ||
    normalized.includes("bill") ||
    normalized.includes("power") ||
    normalized.includes("wifi")
  ) {
    return EXPENSE_CATEGORIES[6]; // Utilities
  }

  return EXPENSE_CATEGORIES[7]; // General
}
