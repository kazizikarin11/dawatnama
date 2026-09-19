/** Stable, dependency-free id generator that works on server and client. */
export function createId(prefix = "id"): string {
  const globalCrypto =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (globalCrypto && typeof globalCrypto.randomUUID === "function") {
    return `${prefix}_${globalCrypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  }

  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
