import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// Helper function to retry database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Try to connect first with timeout
      const connectPromise = prisma.$connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 10000)
      );

      await Promise.race([connectPromise, timeoutPromise]);

      // Execute the operation
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.log(
        `Database operation failed (attempt ${attempt}/${maxRetries}):`,
        error.message
      );

      // Disconnect on error to clean up
      try {
        await prisma.$disconnect();
      } catch {
        // Ignore disconnect errors
      }

      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  throw lastError!;
}

export default prisma;
