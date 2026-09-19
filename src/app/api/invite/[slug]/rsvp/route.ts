import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_INVITATION_ID } from "@/lib/demo/demo-wedding";
import { getRepository } from "@/lib/repository";
import { loadInvitationBySlug } from "@/lib/wedding/load-invitation";
import { enabledEvents } from "@/lib/wedding/sections";

/**
 * Public RSVP endpoint.
 *
 * Resolves the invitation by its public slug, re-checks server-side that RSVP is
 * actually open, and only stores fields the author asked for. The client form is
 * a convenience; this is the boundary that decides what is accepted.
 */

const submissionSchema = z.object({
  guestName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).nullish(),
  attendance: z.enum(["attending", "not-attending"]),
  guestCount: z.number().int().min(0).max(50).optional(),
  eventIds: z.array(z.string().min(1)).max(50).optional(),
  mealPreference: z.string().trim().max(120).nullish(),
  message: z.string().trim().max(2000).nullish(),
  answers: z.record(z.string(), z.string().trim().max(500)).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form and try again." },
      { status: 422 },
    );
  }

  const invitation = await loadInvitationBySlug(slug);

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  if (!invitation.rsvp.enabled || !invitation.sections.rsvp) {
    return NextResponse.json(
      { error: "RSVP is not open for this invitation." },
      { status: 409 },
    );
  }

  if (invitation.rsvp.deadline) {
    const today = new Date().toISOString().slice(0, 10);
    if (invitation.rsvp.deadline < today) {
      return NextResponse.json(
        { error: "The RSVP deadline has passed." },
        { status: 409 },
      );
    }
  }

  const body = parsed.data;
  const attending = body.attendance === "attending";

  // Only keep event ids that belong to this invitation and are still enabled.
  const validEventIds = new Set(enabledEvents(invitation).map((event) => event.id));
  const eventIds = attending
    ? (body.eventIds ?? []).filter((id) => validEventIds.has(id))
    : [];

  // Honour the author's configuration rather than trusting the client.
  const guestCount = attending
    ? Math.min(
        invitation.rsvp.askGuestCount ? invitation.rsvp.maxGuests : 1,
        Math.max(1, body.guestCount ?? 1),
      )
    : 0;

  const mealPreference =
    attending && invitation.rsvp.askMealPreference && body.mealPreference
      ? invitation.rsvp.mealOptions.includes(body.mealPreference)
        ? body.mealPreference
        : null
      : null;

  const allowedQuestionIds = new Set(
    invitation.rsvp.customQuestions.map((question) => question.id),
  );
  const answers = Object.fromEntries(
    Object.entries(body.answers ?? {}).filter(([key]) => allowedQuestionIds.has(key)),
  );

  // The demonstration invitation validates a response but never stores one, so
  // the sample data stays clean and no fictional guest list accumulates.
  if (invitation.id === DEMO_INVITATION_ID) {
    return NextResponse.json({ ok: true, demo: true }, { status: 201 });
  }

  try {
    const repository = await getRepository();
    await repository.submitResponse(invitation.id, {
      guestName: body.guestName,
      phone: invitation.rsvp.askPhone ? (body.phone ?? null) : null,
      attendance: body.attendance,
      guestCount,
      eventIds,
      mealPreference,
      message: invitation.rsvp.askMessage ? (body.message ?? null) : null,
      answers,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Your response could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
