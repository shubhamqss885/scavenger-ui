import { API_BASE } from "@/components/modules/Connectors/types";

// --- Types ---

type PublicKeyResponse = Readonly<{
  keyId: string;
  publicKey: string;
  algorithm: string;
  expiresAt: string;
}>;

type EncryptedEnvelope = Readonly<{
  v: 1;
  keyId: string;
  ephemeralPublicKey: string;
  nonce: string;
  ciphertext: string;
  tag: string;
}>;

// --- Cache ---

let cachedKey: PublicKeyResponse | null = null;

// --- Helpers ---

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
};

// --- Public Key Fetching ---

export const fetchPublicKey = async (): Promise<PublicKeyResponse> => {
  // Return cached key if still valid
  if (cachedKey && new Date(cachedKey.expiresAt) > new Date()) {
    return cachedKey;
  }

  const url = `${API_BASE}/agentic/public_key`;
  console.log("[ECDH] Fetching public key from:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch public key: ${response.status}`);
  }

  const data = await response.json();

  // Check for error response (server encryption not configured)
  if (data.error || !data.publicKey) {
    throw new Error(data.error || "Invalid public key response");
  }

  cachedKey = data;

  return cachedKey!;
};

// --- Encryption ---

export const encryptForServer = async (plaintext: string): Promise<string> => {
  const { keyId, publicKey } = await fetchPublicKey();

  // Import server's public key
  const serverPublicKeyBytes = base64ToBytes(publicKey);
  const serverPublicKey = await crypto.subtle.importKey(
    "raw",
    serverPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  // Generate ephemeral key pair
  const ephemeralKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: serverPublicKey },
    ephemeralKeyPair.privateKey,
    256,
  );

  // Derive AES key using HKDF
  const sharedSecretKey = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    "HKDF",
    false,
    ["deriveKey"],
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode("scavenger-http-v1"),
    },
    sharedSecretKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  // Generate random nonce (12 bytes for AES-GCM)
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt plaintext
  const plaintextBytes = new TextEncoder().encode(plaintext);
  const ciphertextWithTag = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    plaintextBytes,
  );

  // Split ciphertext and tag (last 16 bytes is the tag)
  const ciphertextWithTagBytes = new Uint8Array(ciphertextWithTag);
  const ciphertext = ciphertextWithTagBytes.slice(0, -16);
  const tag = ciphertextWithTagBytes.slice(-16);

  // Export ephemeral public key
  const ephemeralPublicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey("raw", ephemeralKeyPair.publicKey),
  );

  // Build envelope
  const envelope: EncryptedEnvelope = {
    v: 1,
    keyId,
    ephemeralPublicKey: bytesToBase64(ephemeralPublicKeyBytes),
    nonce: bytesToBase64(nonce),
    ciphertext: bytesToBase64(ciphertext),
    tag: bytesToBase64(tag),
  };

  return JSON.stringify(envelope);
};
