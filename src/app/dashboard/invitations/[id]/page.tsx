import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/actions/auth";
import { getRepository } from "@/lib/repository";
import { EditorShell } from "@/components/editor/editor-shell";

export const metadata: Metadata = {
  title: "Edit invitation",
  robots: { index: false, follow: false },
};

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const repository = await getRepository();

  const invitation = await repository.getById(id, session.userId);
  if (!invitation) notFound();

  const responses = await repository.listResponses(id, session.userId);

  return (
    <EditorShell
      invitation={invitation}
      ownerId={session.userId}
      rsvpCount={responses.length}
    />
  );
}
