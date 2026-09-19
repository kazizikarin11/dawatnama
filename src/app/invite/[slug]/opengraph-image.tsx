import { ImageResponse } from "next/og";
import { coupleNames, formatLongDate } from "@/lib/wedding/format";
import { loadInvitationBySlug } from "@/lib/wedding/load-invitation";
import { effectiveDate } from "@/lib/wedding/sections";

/**
 * Social preview card, rendered as a real PNG so WhatsApp, Instagram and
 * Facebook all show a proper image — no dependency on the author having uploaded
 * a correctly-proportioned photograph.
 */
export const alt = "Wedding invitation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invitation = await loadInvitationBySlug(slug, { allowDraft: true });

  const names = invitation ? coupleNames(invitation) : null;
  const date = invitation ? formatLongDate(effectiveDate(invitation)) : null;
  const hijri = invitation?.hijriDate ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#08241d",
          color: "#f5efe3",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Gold double frame */}
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: "1px solid rgba(201,162,39,0.55)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 40,
            border: "1px solid rgba(201,162,39,0.25)",
          }}
        />

        <div
          style={{
            fontSize: 20,
            letterSpacing: 12,
            textTransform: "uppercase",
            color: "#c9a227",
            display: "flex",
          }}
        >
          Wedding Invitation
        </div>

        <div
          style={{
            marginTop: 38,
            fontSize: 86,
            lineHeight: 1.05,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span style={{ display: "flex" }}>{names?.firstShort || "Bride"}</span>
          <span
            style={{ display: "flex", fontSize: 46, color: "#c9a227", margin: "6px 0" }}
          >
            &
          </span>
          <span style={{ display: "flex" }}>{names?.secondShort || "Groom"}</span>
        </div>

        <div
          style={{
            marginTop: 42,
            width: 260,
            height: 1,
            backgroundColor: "rgba(201,162,39,0.6)",
            display: "flex",
          }}
        />

        {date && (
          <div
            style={{
              marginTop: 30,
              fontSize: 26,
              letterSpacing: 6,
              color: "#dcd3c2",
              display: "flex",
            }}
          >
            {date}
          </div>
        )}

        {hijri && (
          <div
            style={{
              marginTop: 10,
              fontSize: 18,
              letterSpacing: 4,
              color: "#a8a08d",
              display: "flex",
            }}
          >
            {hijri}
          </div>
        )}
      </div>
    ),
    size,
  );
}
