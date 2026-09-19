/** Share helpers. Safe to import from client components. */

export function whatsappShareUrl(url: string, message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`;
}

export function shareMessage(names: string, date: string | null): string {
  const when = date ? ` on ${date}` : "";
  return `${names} invite you to their wedding${when}. Please open the invitation:`;
}

export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Falls through to the legacy path below.
  }

  try {
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

export function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function nativeShare(payload: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (!canNativeShare()) return false;
  try {
    await navigator.share(payload);
    return true;
  } catch {
    // The guest dismissed the sheet; not an error worth surfacing.
    return false;
  }
}
