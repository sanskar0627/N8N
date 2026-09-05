import { decrypt, encrypt } from "@/lib/encryption";

export const storeCredentialValue = (value: string) => encrypt(value);

export const readCredentialValue = (value: string) => decrypt(value);
