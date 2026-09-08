import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const readDatabaseUrl = () => {
  // Bracket access so Next.js does not inline DATABASE_URL at build time.
  // biome-ignore lint/complexity/useLiteralKeys: keep runtime env lookup
  const raw = process.env["DATABASE_URL"] ?? "";
  return raw.trim().replace(/^['"]+|['"]+$/g, "");
};

const createPool = () => {
  const connectionString = readDatabaseUrl();

  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      console.error("[db] DATABASE_URL is missing at runtime");
    }
    return new Pool();
  }

  let hostname = "";
  try {
    hostname = new URL(connectionString).hostname;
    console.log("[db] postgres host:", hostname);
  } catch {
    console.error(
      "[db] DATABASE_URL is not a valid URL. If this file is quoted, remove the quotes.",
    );
  }

  return new Pool({
    connectionString,
    ssl:
      hostname.endsWith(".neon.tech") || hostname.endsWith(".neon.build")
        ? { rejectUnauthorized: true }
        : undefined,
    max: 10,
    connectionTimeoutMillis: 15_000,
  });
};

const pool = createPool();
const adapter = new PrismaPg(pool);
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
