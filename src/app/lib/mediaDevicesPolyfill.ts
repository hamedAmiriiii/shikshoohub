/**
 * react-qr-barcode-scanner calls navigator.mediaDevices.getSupportedConstraints()
 * when `torch` is a boolean. Some WebViews only expose it on MediaStreamTrack.
 */
export function ensureMediaDevicesGetSupportedConstraints(): void {
  if (typeof window === "undefined") return;

  const mediaDevices = navigator.mediaDevices;
  if (!mediaDevices || typeof mediaDevices.getSupportedConstraints === "function") {
    return;
  }

  const fromTrack =
    typeof MediaStreamTrack !== "undefined" &&
    typeof MediaStreamTrack.getSupportedConstraints === "function"
      ? MediaStreamTrack.getSupportedConstraints.bind(MediaStreamTrack)
      : null;

  mediaDevices.getSupportedConstraints = function getSupportedConstraints() {
    if (fromTrack) return fromTrack();
    return {
      width: true,
      height: true,
      aspectRatio: true,
      facingMode: true,
      frameRate: true,
    };
  };
}

export function isTorchConstraintSupported(): boolean {
  if (typeof window === "undefined") return false;
  ensureMediaDevicesGetSupportedConstraints();
  try {
    return Boolean(navigator.mediaDevices?.getSupportedConstraints?.().torch);
  } catch {
    return false;
  }
}
