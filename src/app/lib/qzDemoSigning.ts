/**
 * QZ Tray certificate + client-side SHA512 signature from shop print settings.
 */

import { readSaleReceiptPrintSettings } from "@/app/lib/saleReceiptPrint";

type QzSecurityApi = {
  security: {
    setCertificatePromise: (
      handler: (resolve: (cert: string) => void, reject: (err?: unknown) => void) => void,
    ) => void;
    setSignaturePromise: (
      factory: (
        toSign: string,
      ) => (resolve: (signature: string) => void, reject: (err?: unknown) => void) => void,
    ) => void;
    setSignatureAlgorithm: (algorithm: string) => void;
  };
};

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s/g, "");
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

async function signMessageSha512(toSign: string, privateKeyPem: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(toSign),
  );
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

let appliedFingerprint = "";

export function applyQzDemoSigning(qz: QzSecurityApi): void {
  const { qzCertificate, qzPrivateKey } = readSaleReceiptPrintSettings();
  const certificate = qzCertificate.trim();
  const privateKey = qzPrivateKey.trim();
  if (!certificate || !privateKey) {
    throw new Error("QZ_CREDENTIALS_MISSING");
  }

  const fingerprint = `${certificate}\n${privateKey}`;
  if (appliedFingerprint === fingerprint) return;
  appliedFingerprint = fingerprint;

  qz.security.setCertificatePromise((resolve) => {
    resolve(certificate);
  });

  qz.security.setSignatureAlgorithm("SHA512");

  qz.security.setSignaturePromise((toSign) => {
    return (resolve, reject) => {
      void signMessageSha512(toSign, privateKey).then(resolve).catch(reject);
    };
  });
}
