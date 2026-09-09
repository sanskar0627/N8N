import assert from "node:assert/strict";
import test from "node:test";
import {
  readCredentialValue,
  storeCredentialValue,
} from "../src/features/credentials/lib/credential-value";
import {
  persistNodeSecret,
  readNodeSecret,
  readNodeSecretSafe,
} from "../src/features/credentials/lib/node-secret";
import {
  decrypt,
  encrypt,
  isEncryptedCredentialValue,
} from "../src/lib/encryption";

const withEncryptionKey = async (
  key: string,
  run: () => void | Promise<void>,
) => {
  const previousKey = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = key;

  try {
    await run();
  } finally {
    if (previousKey === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = previousKey;
    }
  }
};

test("encrypts credential values with a versioned payload", async () => {
  await withEncryptionKey("m9m-test-encryption-key", () => {
    const stored = storeCredentialValue("sk-ant-secret");

    assert.equal(isEncryptedCredentialValue(stored), true);
    assert.notEqual(stored, "sk-ant-secret");
    assert.equal(readCredentialValue(stored), "sk-ant-secret");
  });
});

test("uses a new iv so identical secrets do not look the same at rest", async () => {
  await withEncryptionKey("m9m-test-encryption-key", () => {
    const first = encrypt("sk-or-v1-same");
    const second = encrypt("sk-or-v1-same");

    assert.notEqual(first, second);
    assert.equal(decrypt(first), "sk-or-v1-same");
    assert.equal(decrypt(second), "sk-or-v1-same");
  });
});

test("keeps existing plaintext credentials readable", async () => {
  await withEncryptionKey("m9m-test-encryption-key", () => {
    assert.equal(readCredentialValue("sk-ant-legacy"), "sk-ant-legacy");
  });
});

test("fails closed when the encryption key is missing", () => {
  const previousKey = process.env.ENCRYPTION_KEY;
  delete process.env.ENCRYPTION_KEY;

  try {
    assert.throws(
      () => storeCredentialValue("sk-ant-secret"),
      /ENCRYPTION_KEY/,
    );
  } finally {
    if (previousKey !== undefined) {
      process.env.ENCRYPTION_KEY = previousKey;
    }
  }
});

test("encrypts node-stored webhook secrets and decrypts them for use", async () => {
  await withEncryptionKey("m9m-test-encryption-key", () => {
    const stored = persistNodeSecret("whsec_plain");

    assert.equal(isEncryptedCredentialValue(stored), true);
    assert.equal(persistNodeSecret(stored), stored);
    assert.equal(readNodeSecret(stored), "whsec_plain");
    assert.equal(readNodeSecretSafe(stored), "whsec_plain");
    assert.equal(readNodeSecretSafe("not-encrypted"), "not-encrypted");
    assert.equal(readNodeSecretSafe(undefined), "");
  });
});

test("rejects ciphertext produced with a different key", async () => {
  let stored = "";

  await withEncryptionKey("m9m-test-encryption-key", () => {
    stored = storeCredentialValue("sk-ant-secret");
  });

  await withEncryptionKey("m9m-other-encryption-key", () => {
    assert.throws(() => readCredentialValue(stored), /Could not decrypt/);
  });
});
