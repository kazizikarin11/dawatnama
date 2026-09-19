import Link from "next/link";

/**
 * Shown for an unknown slug, an unpublished invitation, or a link that has been
 * taken down. Never a stack trace, never a broken layout.
 */
export default function InvitationNotFound() {
  return (
    <main className="grid min-h-screen-safe place-items-center bg-emerald-deep px-6 text-center text-bone">
      <div className="max-w-md">
        <p className="text-fluid-xs tracking-label text-brass">Dawatnama</p>

        <h1 className="mt-7 font-[family-name:var(--font-cormorant)] text-fluid-2xl font-light">
          This invitation isn&rsquo;t available
        </h1>

        <p className="mt-5 text-fluid-base leading-relaxed text-bone/70">
          The link may be mistyped, or the couple may not have published their
          invitation yet. If someone shared this with you, please ask them to
          resend the link.
        </p>

        <Link
          href="/"
          className="tap-target mt-10 inline-grid place-items-center border border-brass px-8 text-fluid-xs tracking-label text-brass transition-colors duration-300 hover:bg-brass/15"
        >
          Visit Dawatnama
        </Link>
      </div>
    </main>
  );
}
