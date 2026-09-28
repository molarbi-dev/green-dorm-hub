// Password hashing using Web Crypto API — works natively in Cloudflare Workers.
// Uses PBKDF2 with SHA-256, 100k iterations — strong enough for passwords.

const ITERATIONS = 100_000;
const KEY_LENGTH = 32; // bytes
const SALT_LENGTH = 16; // bytes

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, hash: "SHA-256", iterations: ITERATIONS },
    keyMaterial,
    KEY_LENGTH * 8,
  );
  // Store as: iterations:saltHex:hashHex
  return `${ITERATIONS}:${bufToHex(salt.buffer)}:${bufToHex(derived)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  const [iters, saltHex, hashHex] = parts;
  const salt = hexToBuf(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, hash: "SHA-256", iterations: Number(iters) },
    keyMaterial,
    KEY_LENGTH * 8,
  );
  return bufToHex(derived) === hashHex;
}

// AES-GCM encryption for router passwords — matches WiFi provisioning service
export async function encryptValue(value: string, keyBase64: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(value);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, encoded);
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}
