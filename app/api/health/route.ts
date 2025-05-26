import { NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Testing database connection...");
    
    // Test database connection with retry
    const result = await withRetry(async () => {
      await prisma.$connect();
      return await prisma.$queryRaw`SELECT 1 as test`;
    });
    
    console.log("✅ Database connection successful:", result);
    
    return NextResponse.json({ 
      status: "healthy", 
      database: "connected",
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error("❌ Database health check failed:", error.message);
    
    return NextResponse.json({ 
      status: "unhealthy", 
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
