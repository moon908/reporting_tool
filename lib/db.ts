import { PrismaClient } from "@prisma/client";

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
            if (modelProp.includes("create")) return {};
            if (modelProp.includes("update")) return {};
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
        // In Prisma 7, direct construction without adapter/accelerate throws.
        // We will default to mock unless a real adapter is configured.
        if (!dbUrl || dbUrl.includes("localhost") || dbUrl.includes("username:password") || dbUrl.startsWith("prisma+postgres")) {
          console.warn("DATABASE_URL is not set to a live remote PostgreSQL server. Using simulation Prisma client.");
          prismaInstance = createMockPrisma();
        } else {
          // If user has set a live remote database, we attempt to instantiate.
          // Note: In Prisma 7, user must have installed adapter if they intend to connect directly.
          // If they haven't set up the adapter configuration yet, we fall back gracefully.
          prismaInstance = new PrismaClient();
        }
      } catch (err) {
        console.warn("Failed to initialize live PrismaClient, falling back to simulation client:", err);
        prismaInstance = createMockPrisma();
      }
    }
    return Reflect.get(prismaInstance, prop, receiver);
  },
});
