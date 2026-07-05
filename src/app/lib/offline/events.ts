export const OUTBOX_CHANGED_EVENT = "webino-outbox-changed";

export function notifyOutboxChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OUTBOX_CHANGED_EVENT));
}
