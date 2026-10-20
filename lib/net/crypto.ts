/**
 * The socket service broadcasts every message to the whole room and does not authenticate
 * anyone. To keep hands private (and to know who really sent an action), each guest and the
 * host agree a shared AES-GCM key via ECDH, and everything sensitive travels sealed with it.
 */

export interface Identity {
  id: string;
  pub: JsonWebKey;
  priv: JsonWebKey;
}

export interface SealedBox {
  iv: string;
  ct: string;
}

const ECDH = { name: "ECDH", namedCurve: "P-256" } as const;
const IDENTITY_STORAGE_KEY = "532cards:identity";

// ----------------------------------------------------------------- encoding

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ------------------------------------------------------------------- random

/** Unbiased random integer in [0, n) from the platform CSPRNG. */
export function secureRandomInt(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % n;
}

export function randomId(length: number, alphabet: string): string {
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[secureRandomInt(alphabet.length)];
  return out;
}

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const newRoomCode = () => randomId(6, CODE_ALPHABET);
export const normalizeRoomCode = (text: string) =>
  text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

// ----------------------------------------------------------------- identity

async function createIdentity(): Promise<Identity> {
  const pair = await crypto.subtle.generateKey(ECDH, true, ["deriveKey"]);
  const [pub, priv] = await Promise.all([
    crypto.subtle.exportKey("jwk", pair.publicKey),
    crypto.subtle.exportKey("jwk", pair.privateKey),
  ]);
  return { id: randomId(12, ID_ALPHABET), pub: stripPublic(pub), priv };
}

/** Only the fields needed to import an ECDH public key. */
function stripPublic(jwk: JsonWebKey): JsonWebKey {
  return { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, ext: true };
}

/**
 * One identity per browser tab, so a refresh rejoins the same seat while two tabs can
 * still play against each other.
 */
export async function loadIdentity(): Promise<Identity> {
  try {
    const saved = sessionStorage.getItem(IDENTITY_STORAGE_KEY);
    if (saved) return JSON.parse(saved) as Identity;
  } catch {
    // Storage unavailable or corrupt: fall through and mint a fresh identity.
  }
  const identity = await createIdentity();
  try {
    sessionStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Not persisting just means a refresh gets a new seat.
  }
  return identity;
}

export function isPublicKey(value: unknown): value is JsonWebKey {
  if (typeof value !== "object" || value === null) return false;
  const k = value as Record<string, unknown>;
  return k.kty === "EC" && k.crv === "P-256" && typeof k.x === "string" && typeof k.y === "string";
}

export const samePublicKey = (a: JsonWebKey, b: JsonWebKey) => a.x === b.x && a.y === b.y;

// ------------------------------------------------------------------ sealing

export async function deriveSharedKey(priv: JsonWebKey, peerPub: JsonWebKey): Promise<CryptoKey> {
  const [privateKey, publicKey] = await Promise.all([
    crypto.subtle.importKey("jwk", priv, ECDH, false, ["deriveKey"]),
    crypto.subtle.importKey("jwk", stripPublic(peerPub), ECDH, false, []),
  ]);
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function seal(key: CryptoKey, value: unknown): Promise<SealedBox> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  return { iv: toBase64(iv), ct: toBase64(new Uint8Array(cipher)) };
}

/** Returns null if the box was not sealed with this key (tampered, or from someone else). */
export async function open(key: CryptoKey, box: SealedBox): Promise<unknown> {
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(box.iv) },
      key,
      fromBase64(box.ct),
    );
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null;
  }
}
