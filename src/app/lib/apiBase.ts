/** Shared API origin for client + tooling. Desktop build sets NEXT_PUBLIC_BASE_URL. */
export function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoplus.ir").replace(
    /\/$/,
    ""
  );
}

export function apiAssetUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return pathOrUrl;
  if (
    pathOrUrl.startsWith("http") ||
    pathOrUrl.startsWith("data:") ||
    pathOrUrl.startsWith("blob:")
  ) {
    return pathOrUrl;
  }
  if (pathOrUrl.startsWith("/")) {
    return `${apiBaseUrl()}${pathOrUrl}`;
  }
  return pathOrUrl;
}
