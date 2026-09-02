-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('OPENROUTER', 'ANTHROPIC', 'GEMINI');

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CredentialType" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Credential_userId_type_idx" ON "Credential"("userId", "type");
CREATE INDEX "Credential_userId_updatedAt_idx" ON "Credential"("userId", "updatedAt" DESC);

-- AddForeignKey
ALTER TABLE "Credential"
ADD CONSTRAINT "Credential_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- BackfillCredentials
INSERT INTO "Credential" (
    "id",
    "name",
    "type",
    "value",
    "createdAt",
    "updatedAt",
    "userId"
)
SELECT
    'cred_' || md5(node."id" || workflow."userId"),
    'Imported ' || INITCAP(LOWER(node."type"::text)) || ' key',
    CASE node."type"
        WHEN 'OPENAI' THEN 'OPENROUTER'::"CredentialType"
        WHEN 'ANTHROPIC' THEN 'ANTHROPIC'::"CredentialType"
        WHEN 'GEMINI' THEN 'GEMINI'::"CredentialType"
    END,
    node."data"->>'apiKey',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    workflow."userId"
FROM "Node" AS node
JOIN "Workflow" AS workflow ON workflow."id" = node."workflowId"
WHERE node."type" IN ('OPENAI', 'ANTHROPIC', 'GEMINI')
  AND COALESCE(node."data"->>'apiKey', '') <> ''
ON CONFLICT ("id") DO NOTHING;

-- LinkBackfilledCredentials
UPDATE "Node" AS node
SET "data" = (node."data" - 'apiKey') || jsonb_build_object(
    'credentialId',
    'cred_' || md5(node."id" || workflow."userId")
)
FROM "Workflow" AS workflow
WHERE workflow."id" = node."workflowId"
  AND node."type" IN ('OPENAI', 'ANTHROPIC', 'GEMINI')
  AND COALESCE(node."data"->>'apiKey', '') <> '';
