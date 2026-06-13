import { Bindings } from "../types";

let _cachedToken: string | null = null;

export async function getFirebaseIdToken(env: Bindings): Promise<string> {
  if (_cachedToken) return _cachedToken;
  
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: env.FIREBASE_SCANNER_EMAIL,
        password: env.FIREBASE_SCANNER_PASSWORD,
        returnSecureToken: true,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firebase auth failed (${res.status}): ${err}`);
  }

  const data = await res.json() as any;
  _cachedToken = data.idToken as string;
  return _cachedToken;
}
