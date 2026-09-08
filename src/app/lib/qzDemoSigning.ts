/**
 * QZ Tray official demo certificate + client-side SHA512 signature
 * (same approach as sample.html / assets/signing/sign-message.js).
 */

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

const QZ_DEMO_CERTIFICATE =
  "-----BEGIN CERTIFICATE-----\n" +
  "MIIFAzCCAuugAwIBAgICEAIwDQYJKoZIhvcNAQEFBQAwgZgxCzAJBgNVBAYTAlVT\n" +
  "MQswCQYDVQQIDAJOWTEbMBkGA1UECgwSUVogSW5kdXN0cmllcywgTExDMRswGQYD\n" +
  "VQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxGTAXBgNVBAMMEHF6aW5kdXN0cmllcy5j\n" +
  "b20xJzAlBgkqhkiG9w0BCQEWGHN1cHBvcnRAcXppbmR1c3RyaWVzLmNvbTAeFw0x\n" +
  "NTAzMTkwMjM4NDVaFw0yNTAzMTkwMjM4NDVaMHMxCzAJBgNVBAYTAkFBMRMwEQYD\n" +
  "VQQIDApTb21lIFN0YXRlMQ0wCwYDVQQKDAREZW1vMQ0wCwYDVQQLDAREZW1vMRIw\n" +
  "EAYDVQQDDAlsb2NhbGhvc3QxHTAbBgkqhkiG9w0BCQEWDnJvb3RAbG9jYWxob3N0\n" +
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtFzbBDRTDHHmlSVQLqjY\n" +
  "aoGax7ql3XgRGdhZlNEJPZDs5482ty34J4sI2ZK2yC8YkZ/x+WCSveUgDQIVJ8oK\n" +
  "D4jtAPxqHnfSr9RAbvB1GQoiYLxhfxEp/+zfB9dBKDTRZR2nJm/mMsavY2DnSzLp\n" +
  "t7PJOjt3BdtISRtGMRsWmRHRfy882msBxsYug22odnT1OdaJQ54bWJT5iJnceBV2\n" +
  "1oOqWSg5hU1MupZRxxHbzI61EpTLlxXJQ7YNSwwiDzjaxGrufxc4eZnzGQ1A8h1u\n" +
  "jTaG84S1MWvG7BfcPLW+sya+PkrQWMOCIgXrQnAsUgqQrgxQ8Ocq3G4X9UvBy5VR\n" +
  "CwIDAQABo3sweTAJBgNVHRMEAjAAMCwGCWCGSAGG+EIBDQQfFh1PcGVuU1NMIEdl\n" +
  "bmVyYXRlZCBDZXJ0aWZpY2F0ZTAdBgNVHQ4EFgQUpG420UhvfwAFMr+8vf3pJunQ\n" +
  "gH4wHwYDVR0jBBgwFoAUkKZQt4TUuepf8gWEE3hF6Kl1VFwwDQYJKoZIhvcNAQEF\n" +
  "BQADggIBAFXr6G1g7yYVHg6uGfh1nK2jhpKBAOA+OtZQLNHYlBgoAuRRNWdE9/v4\n" +
  "J/3Jeid2DAyihm2j92qsQJXkyxBgdTLG+ncILlRElXvG7IrOh3tq/TttdzLcMjaR\n" +
  "8w/AkVDLNL0z35shNXih2F9JlbNRGqbVhC7qZl+V1BITfx6mGc4ayke7C9Hm57X0\n" +
  "ak/NerAC/QXNs/bF17b+zsUt2ja5NVS8dDSC4JAkM1dD64Y26leYbPybB+FgOxFu\n" +
  "wou9gFxzwbdGLCGboi0lNLjEysHJBi90KjPUETbzMmoilHNJXw7egIo8yS5eq8RH\n" +
  "i2lS0GsQjYFMvplNVMATDXUPm9MKpCbZ7IlJ5eekhWqvErddcHbzCuUBkDZ7wX/j\n" +
  "unk/3DyXdTsSGuZk3/fLEsc4/YTujpAjVXiA1LCooQJ7SmNOpUa66TPz9O7Ufkng\n" +
  "+CoTSACmnlHdP7U9WLr5TYnmL9eoHwtb0hwENe1oFC5zClJoSX/7DRexSJfB7YBf\n" +
  "vn6JA2xy4C6PqximyCPisErNp85GUcZfo33Np1aywFv9H+a83rSUcV6kpE/jAZio\n" +
  "5qLpgIOisArj1HTM6goDWzKhLiR/AeG3IJvgbpr9Gr7uZmfFyQzUjvkJ9cybZRd+\n" +
  "G8azmpBBotmKsbtbAU/I/LVk8saeXznshOVVpDRYtVnjZeAneso7\n" +
  "-----END CERTIFICATE-----\n" +
  "--START INTERMEDIATE CERT--\n" +
  "-----BEGIN CERTIFICATE-----\n" +
  "MIIFEjCCA/qgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwgawxCzAJBgNVBAYTAlVT\n" +
  "MQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYDVQQKDBJRWiBJ\n" +
  "bmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMsIExMQzEZMBcG\n" +
  "A1UEAwwQcXppbmR1c3RyaWVzLmNvbTEnMCUGCSqGSIb3DQEJARYYc3VwcG9ydEBx\n" +
  "emluZHVzdHJpZXMuY29tMB4XDTE1MDMwMjAwNTAxOFoXDTM1MDMwMjAwNTAxOFow\n" +
  "gZgxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJOWTEbMBkGA1UECgwSUVogSW5kdXN0\n" +
  "cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxGTAXBgNVBAMM\n" +
  "EHF6aW5kdXN0cmllcy5jb20xJzAlBgkqhkiG9w0BCQEWGHN1cHBvcnRAcXppbmR1\n" +
  "c3RyaWVzLmNvbTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBANTDgNLU\n" +
  "iohl/rQoZ2bTMHVEk1mA020LYhgfWjO0+GsLlbg5SvWVFWkv4ZgffuVRXLHrwz1H\n" +
  "YpMyo+Zh8ksJF9ssJWCwQGO5ciM6dmoryyB0VZHGY1blewdMuxieXP7Kr6XD3GRM\n" +
  "GAhEwTxjUzI3ksuRunX4IcnRXKYkg5pjs4nLEhXtIZWDLiXPUsyUAEq1U1qdL1AH\n" +
  "EtdK/L3zLATnhPB6ZiM+HzNG4aAPynSA38fpeeZ4R0tINMpFThwNgGUsxYKsP9kh\n" +
  "0gxGl8YHL6ZzC7BC8FXIB/0Wteng0+XLAVto56Pyxt7BdxtNVuVNNXgkCi9tMqVX\n" +
  "xOk3oIvODDt0UoQUZ/umUuoMuOLekYUpZVk4utCqXXlB4mVfS5/zWB6nVxFX8Io1\n" +
  "9FOiDLTwZVtBmzmeikzb6o1QLp9F2TAvlf8+DIGDOo0DpPQUtOUyLPCh5hBaDGFE\n" +
  "ZhE56qPCBiQIc4T2klWX/80C5NZnd/tJNxjyUyk7bjdDzhzT10CGRAsqxAnsjvMD\n" +
  "2KcMf3oXN4PNgyfpbfq2ipxJ1u777Gpbzyf0xoKwH9FYigmqfRH2N2pEdiYawKrX\n" +
  "6pyXzGM4cvQ5X1Yxf2x/+xdTLdVaLnZgwrdqwFYmDejGAldXlYDl3jbBHVM1v+uY\n" +
  "5ItGTjk+3vLrxmvGy5XFVG+8fF/xaVfo5TW5AgMBAAGjUDBOMB0GA1UdDgQWBBSQ\n" +
  "plC3hNS56l/yBYQTeEXoqXVUXDAfBgNVHSMEGDAWgBQDRcZNwPqOqQvagw9BpW0S\n" +
  "BkOpXjAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQAJIO8SiNr9jpLQ\n" +
  "eUsFUmbueoxyI5L+P5eV92ceVOJ2tAlBA13vzF1NWlpSlrMmQcVUE/K4D01qtr0k\n" +
  "gDs6LUHvj2XXLpyEogitbBgipkQpwCTJVfC9bWYBwEotC7Y8mVjjEV7uXAT71GKT\n" +
  "x8XlB9maf+BTZGgyoulA5pTYJ++7s/xX9gzSWCa+eXGcjguBtYYXaAjjAqFGRAvu\n" +
  "pz1yrDWcA6H94HeErJKUXBakS0Jm/V33JDuVXY+aZ8EQi2kV82aZbNdXll/R6iGw\n" +
  "2ur4rDErnHsiphBgZB71C5FD4cdfSONTsYxmPmyUb5T+KLUouxZ9B0Wh28ucc1Lp\n" +
  "rbO7BnjW\n" +
  "-----END CERTIFICATE-----\n";

const QZ_DEMO_PRIVATE_KEY =
  "-----BEGIN PRIVATE KEY-----\n" +
  "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC0z9FeMynsC8+u\n" +
  "dvX+LciZxnh5uRj4C9S6tNeeAlIGCfQYk0zUcNFCoCkTknNQd/YEiawDLNbxBqut\n" +
  "bMDZ1aarys1a0lYmUeVLCIqvzBkPJTSQsCopQQ9V8WuT252zzNzs68dVGNdCJd5J\n" +
  "NRQykpwexmnjPPv0mvj7i8XgG379TyW6P+WWV5okeUkXJ9eJS2ouDYdR2SM9BoVW\n" +
  "+FgxDu6BmXhozW5EfsnajFp7HL8kQClI0QOc79yuKl3492rH6bzFsFn2lfwWy9ic\n" +
  "7cP8EpCTeFp1tFaD+vxBhPZkeTQ1HKx6hQ5zeHIB5ySJJZ7af2W8r4eTGYzbdRW2\n" +
  "4DDHCPhZAgMBAAECggEATvofR3gtrY8TLe+ET3wMDS8l3HU/NMlmKA9pxvjYfw7F\n" +
  "8h4VBw4oOWPfzU7A07syWJUR72kckbcKMfw42G18GbnBrRQG0UIgV3/ppBQQNg9Y\n" +
  "QILSR6bFXhLPnIvm/GxVa58pOEBbdec4it2Gbvie/MpJ4hn3K8atTqKk0djwxQ+b\n" +
  "QNBWtVgTkyIqMpUTFDi5ECiVXaGWZ5AOVK2TzlLRNQ5Y7US8lmGxVWzt0GONjXSE\n" +
  "iO/eBk8A7wI3zknMx5o1uZa/hFCPQH33uKeuqU5rmphi3zS0BY7iGY9EoKu/o+BO\n" +
  "HPwLQJ3wCDA3O9APZ3gmmbHFPMFPr/mVGeAeGP/BAQKBgQDaPELRriUaanWrZpgT\n" +
  "VnKKrRSqPED3anAVgmDfzTQwuR/3oD506F3AMBzloAo3y9BXmDfe8qLn6kgdZQKy\n" +
  "SFNLz888at96oi+2mEKPpvssqiwE6F3OtEM6yv4DP9KJHaHmXaWv+/sjwjzpFNjs\n" +
  "wGThBxFvrTWRJqBYsM1XNJJ2EQKBgQDUGbTSwHKqRCYWhQ1GPCZKE98l5UtMKvUb\n" +
  "hyWWOXoyoeYbJEMfG1ynX4JeXIkl6YtBjYCqszv9PjHa1rowTZaAPJ0V70zyhTcF\n" +
  "t581ii9LpiejIGrELHvJnW87QmjjStkjwGIqgKLp7Qe6CDjHI9HP1NM0uav/IQLW\n" +
  "pB6wyEz1yQKBgQCuxPut+Ax2rzM05KB9PAnWzO1zt3U/rtm8IAF8uVVGf7r+EDJ0\n" +
  "ZXJO6zj5G8WTEYHz5E86GI4ltBW0lKQoKouqdu27sMrv5trXG/CSImOcTVubQot9\n" +
  "chc1CkOKTp5IeJajafO6j817wZ4N+0gNsbYYEBUCnm/7ojdfT5ficpOoQQKBgQDB\n" +
  "PgKPmaNfGeQR1Ht5qEfCakR/RF/ML79Nq15FdmytQPBjfjBhYQ6Tt+MRkgGqtxOX\n" +
  "UBMQc2iOnGHT3puYcrhScec1GufidhjhbqDxqMrag7HNYDWmMlk+IeA7/4+Mtp8L\n" +
  "gbZuvvCvbLQDfIYueaYpUuBzQ08/jZYGdVU4/+WOcQKBgAGUN0kIB6EM1K/iZ0TN\n" +
  "jlt8P5UEV3ZCyATWFiGZRhhE2WAh8gv1jx4J26pcUs1n8sd2a1h6ZuBSqsyIlNSp\n" +
  "xtKsm3bqQFDHRrPcsBX4nanrw9DzkpH1k/I3WMSdGqkDAR3DtL7yXTJXJo2Sbrp5\n" +
  "EjzSn7DcDE1tL2En/tSVXeUY\n" +
  "-----END PRIVATE KEY-----";

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

async function signMessageSha512(toSign: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(QZ_DEMO_PRIVATE_KEY),
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

let applied = false;

export function applyQzDemoSigning(qz: QzSecurityApi): void {
  if (applied) return;
  applied = true;

  qz.security.setCertificatePromise((resolve) => {
    resolve(QZ_DEMO_CERTIFICATE);
  });

  qz.security.setSignatureAlgorithm("SHA512");

  qz.security.setSignaturePromise((toSign) => {
    return (resolve, reject) => {
      void signMessageSha512(toSign).then(resolve).catch(reject);
    };
  });
}
