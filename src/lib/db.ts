import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg"; //Env for database url

// Keep one Prisma instance globally in development.
// Without this, Next.js hot-reload can create many clients and too many DB connections.
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// Create a PostgreSQL pool from DATABASE_URL (.env).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Prisma 7 uses a driver adapter for direct PostgreSQL connections.
const adapter = new PrismaPg(pool);

// Reuse existing client if present, otherwise create a new one.
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

// Save client on global only in development.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Import this default export anywhere you need database queries.
export default prisma;