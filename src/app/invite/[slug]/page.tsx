import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { invitationUrl } from "@/lib/site";
import { coupleNames, formatLongDate } from "@/lib/wedding/format";
import { loadInvitationBySlug } from "@/lib/wedding/load-invitation";
import { effectiveDate } from "@/lib/wedding/sections";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ template?: string; preview?: string }>;
};

/**
 * The public invitation. Server-rendered so it is crawlable, shareable, and has
 * a rich preview in WhatsApp, Instagram and Facebook.
 */
export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { template } = await searchParams;
  const invitation = await loadInvitationBySlug(slug, {
    templateOverride: template ?? null,
    allowDraft: true,
  });

  if (!invitation) {
    return { title: "Invitation not found", robots: { index: false } };
  }

  const names = coupleNames(invitation).combined;
  const date = formatLongDate(effectiveDate(invitation));

  const title = invitation.seo.title ?? `${names} — Wedding Invitation`;
  const description =
    invitation.seo.description ??
    invitation.couple.shortDescription ??
    invitation.invitationMessage ??
    (date
      ? `${names} invite you to celebrate their wedding on ${date}.`
      : `${names} invite you to celebrate their wedding.`);

  const url = invitationUrl(invitation.slug || slug);

  return {
    title,
    description,
    alternates: { canonical: url },
    // Drafts must never be indexed.
    robots:
      invitation.status === "published"
        ? { index: true, follow: true }
        : { index: false, follow: false },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "Dawatnama",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function InvitationPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { template } = await searchParams;

  const invitation = await loadInvitationBySlug(slug, {
    templateOverride: template ?? null,
    allowDraft: true,
  });

  if (!invitation) notFound();

  return <InvitationRenderer data={invitation} mode="live" />;
}
