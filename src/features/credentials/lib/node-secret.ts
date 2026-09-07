import { decrypt, encrypt, isEncryptedCredentialValue } from "@/lib/encryption";

export const persistNodeSecret = (value: string) =>
  isEncryptedCredentialValue(value) ? value : encrypt(value);

export const readNodeSecret = (value: string) => decrypt(value);

export const readNodeSecretSafe = (value: unknown) => {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  try {
    return decrypt(value);
  } catch {
    return "";
  }
};
