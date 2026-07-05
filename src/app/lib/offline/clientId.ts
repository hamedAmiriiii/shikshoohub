/** شناسه یکتا برای idempotency — backend باید client_id را unique نگه دارد */
export function generateClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cid_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
