interface JWK {
  kid: string;
  kty: string;
  alg: string;
  use: string;
  n: string;
  e: string;
}

interface JWKResponse {
  keys: JWK[];
}

let cachedKeys: JWK[] | null = null;
let cacheExpiry = 0;

async function fetchGoogleJWKs(): Promise<JWK[]> {
  const now = Date.now();
  if (cachedKeys && now < cacheExpiry) {
    return cachedKeys;
  }

  const res = await fetch(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  );
  if (!res.ok) {
    throw new Error("Failed to fetch Google JWKs");
  }

  // Parse cache-control header to determine expiry
  const cacheControl = res.headers.get("cache-control");
  let maxAge = 3600; // default to 1 hour
  if (cacheControl) {
    const match = cacheControl.match(/max-age=(\d+)/);
    if (match) {
      maxAge = parseInt(match[1], 10);
    }
  }

  const data = (await res.json()) as JWKResponse;
  cachedKeys = data.keys;
  cacheExpiry = now + maxAge * 1000;
  return cachedKeys;
}

function decodeBase64Url(str: string): ArrayBuffer {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function decodeBase64UrlToString(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64);
}

export interface FirebaseTokenPayload {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  exp: number;
  [key: string]: any;
}

export async function verifyFirebaseIdToken(
  token: string,
  projectId: string
): Promise<FirebaseTokenPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const [headerStr, payloadStr, signatureStr] = parts;
  
  const header = JSON.parse(decodeBase64UrlToString(headerStr)) as { kid: string; alg: string };
  const payload = JSON.parse(decodeBase64UrlToString(payloadStr)) as FirebaseTokenPayload;

  if (header.alg !== "RS256") {
    throw new Error("Unsupported token signature algorithm");
  }

  // Validate claims
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error("Token has expired");
  }

  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error(`Invalid token issuer: ${payload.iss}`);
  }

  if (payload.aud !== projectId) {
    throw new Error(`Invalid token audience: ${payload.aud}`);
  }

  // Fetch keys and find the matching kid
  const keys = await fetchGoogleJWKs();
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) {
    throw new Error("Key ID not found in Google JWKs list");
  }

  // Import key
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["verify"]
  );

  // Verify signature
  const dataBuffer = new TextEncoder().encode(`${headerStr}.${payloadStr}`);
  const signatureBuffer = decodeBase64Url(signatureStr);

  const isValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signatureBuffer,
    dataBuffer
  );

  if (!isValid) {
    throw new Error("Invalid token signature");
  }

  return payload;
}
