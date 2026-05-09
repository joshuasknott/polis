function toBase64(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer));
}

function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

async function deriveKey(encryptionKeyStr: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(encryptionKeyStr);
  const hash = await crypto.subtle.digest("SHA-256", keyData);
  return crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(
  plaintext: string,
  encryptionKey: string,
): Promise<string> {
  const key = await deriveKey(encryptionKey);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  );
  const result = {
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(encrypted)),
  };
  return JSON.stringify(result);
}

export async function decrypt(
  ciphertext: string,
  encryptionKey: string,
): Promise<string> {
  const key = await deriveKey(encryptionKey);
  const parsed = JSON.parse(ciphertext) as { iv: string; data: string };
  const iv = fromBase64(parsed.iv);
  const data = fromBase64(parsed.data);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer,
  );
  return new TextDecoder().decode(decrypted);
}
