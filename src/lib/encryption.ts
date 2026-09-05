import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ENCRYPTED_PREFIX = "enc:v1:";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const HEX_KEY_PATTERN = /^[0-9a-fA-F]{64}$/;

const getEncryptionKey = () => {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  if (HEX_KEY_PATTERN.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  if (raw.length < 16) {
    throw new Error("ENCRYPTION_KEY must be at least 16 characters");
  }

  return createHash("sha256").update(raw).digest();
};

export const isEncryptedCredentialValue = (value: string) =>
  value.startsWith(ENCRYPTED_PREFIX);

export const encrypt = (plaintext: string) => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTED_PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
};

export const decrypt = (value: string) => {
  if (!isEncryptedCredentialValue(value)) {
    return value;
  }

  const payload = value.slice(ENCRYPTED_PREFIX.length).split(":");
  if (payload.length !== 3) {
    throw new Error("Encrypted credential value is malformed");
  }

  const [encodedIv, encodedTag, encodedCiphertext] = payload;
  const iv = Buffer.from(encodedIv, "base64url");
  const tag = Buffer.from(encodedTag, "base64url");
  const ciphertext = Buffer.from(encodedCiphertext, "base64url");

  if (
    iv.length !== IV_LENGTH ||
    tag.length !== AUTH_TAG_LENGTH ||
    ciphertext.length === 0
  ) {
    throw new Error("Encrypted credential value is malformed");
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Could not decrypt credential value");
  }
};
