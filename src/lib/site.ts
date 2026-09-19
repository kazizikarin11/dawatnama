export const SITE = {
  name: "Dawatnama",
  tagline: "Digital invitations for elegant Muslim weddings",
  description:
    "Dawatnama turns your wedding details into a cinematic digital invitation. Enter your information once, then choose from five independently designed premium templates.",
} as const;

/** Public origin, without a trailing slash. */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function invitationPath(slug: string): string {
  return `/invite/${slug}`;
}

export function invitationUrl(slug: string): string {
  return absoluteUrl(invitationPath(slug));
}
