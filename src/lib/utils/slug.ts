const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "dashboard",
  "invite",
  "login",
  "logout",
  "new",
  "preview",
  "signup",
  "templates",
]);

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
}

/** Builds a couple slug such as `ahmed-and-fatima`. */
export function buildCoupleSlug(first: string, second: string): string {
  const a = slugify(first);
  const b = slugify(second);
  if (a && b) return `${a}-and-${b}`;
  return a || b || "";
}

export type SlugValidation = { valid: boolean; reason: string | null };

export function validateSlug(slug: string): SlugValidation {
  if (!slug) return { valid: false, reason: "A link is required." };
  if (slug.length < 3)
    return { valid: false, reason: "Use at least 3 characters." };
  if (slug.length > 60)
    return { valid: false, reason: "Keep it under 60 characters." };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    return {
      valid: false,
      reason: "Use lowercase letters, numbers and single hyphens only.",
    };
  if (RESERVED_SLUGS.has(slug))
    return { valid: false, reason: "That link is reserved." };
  return { valid: true, reason: null };
}
