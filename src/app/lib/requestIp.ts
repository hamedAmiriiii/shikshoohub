import { headers } from "next/headers";
import { cleanVisitorIp } from "./sitePageViews";

function forwardedIps(header: string | null): string[] {
  if (!header) return [];
  return header.split(",").map((part) => part.trim().replace(/^::ffff:/i, "")).filter(Boolean);
}

function isPrivateIp(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value === "::1" || value === "127.0.0.1" || value === "0.0.0.0" || value === "localhost") return true;
  if (value.startsWith("10.") || value.startsWith("192.168.") || value.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(value)) return true;
  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:")) return true;
  return false;
}

export function requestIp(): string {
  const h = headers();
  const candidates = [
    ...forwardedIps(h.get("cf-connecting-ip")),
    ...forwardedIps(h.get("true-client-ip")),
    ...forwardedIps(h.get("x-real-ip")),
    ...forwardedIps(h.get("x-forwarded-for")),
  ];
  const client = candidates.find((ip) => !isPrivateIp(ip)) || candidates.find(Boolean) || "";
  return cleanVisitorIp(client);
}
