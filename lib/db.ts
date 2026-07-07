import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

let prismaInstance: any = null;

// Create a safe, non-throwing mock Prisma client for Sandbox/Bypass Mode
function createMockPrisma() {
  return new Proxy({} as any, {
    get(target, prop: string) {
      if (prop === "$connect" || prop === "$disconnect") {
        return async () => {};
      }
      if (prop.startsWith("$")) {
        return async () => [];
      }
      
      // For model queries (e.g., db.user.findUnique)
      return new Proxy({}, {
        get(modelTarget, modelProp: string) {
          return async () => {
            if (modelProp.includes("count")) return 0;
            if (modelProp.includes("findMany")) return [];
            if (modelProp.includes("findFirst")) return null;
            if (modelProp.includes("findUnique")) return null;
            if (modelProp.includes("create")) {
              return { id: "demo-" + Math.random().toString(36).substring(2, 9) };
            }
            if (modelProp.includes("update")) {
              return { id: "demo-" + Math.random().toString(36).substring(2, 9) };
            }
            if (modelProp.includes("delete")) return {};
            if (modelProp.includes("aggregate")) return { _sum: { fileSize: 0 } };
            return null;
          };
        }
      });
    }
  });
}

// Export db as a lazy Proxy to prevent immediate PrismaClient instantiation on startup
export const db = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    if (!prismaInstance) {
      try {
        const dbUrl = process.env.DATABASE_URL;
        
        // If DATABASE_URL is mock or local developer template, use simulation client
        if (!dbUrl || dbUrl.includes("localhost") || dbUrl.includes("username:password") || dbUrl.startsWith("prisma+postgres")) {
          console.warn("Using simulation Prisma client (no live remote PostgreSQL database configured).");
          prismaInstance = createMockPrisma();
        } else {
          // Initialize PostgreSQL connection pool and adapter for Prisma 7
          const pool = new Pool({
            connectionString: dbUrl,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          });
          const adapter = new PrismaPg(pool);
          prismaInstance = new PrismaClient({ adapter });
        }
      } catch (err) {
        console.warn("Failed to initialize live PrismaClient, falling back to simulation client:", err);
        prismaInstance = createMockPrisma();
      }
    }
    return Reflect.get(prismaInstance, prop, receiver);
  },
});
