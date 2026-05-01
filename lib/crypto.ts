import crypto from "crypto";

let _key: Buffer | null = null;

function getKey(): Buffer {
  if (!_key) {
    const envKey = process.env.ENCRYPTION_KEY;
    if (!envKey) throw new Error("ENCRYPTION_KEY env var is not set");
    _key = Buffer.from(envKey, "hex");
  }
  return _key;
}

/**
 * Encrypt a string using AES-256-GCM.
 * Output format: base64(iv[12] + authTag[16] + ciphertext)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypt a string encrypted with encrypt().
 */
export function decrypt(data: string): string {
  const buf = Buffer.from(data, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}
