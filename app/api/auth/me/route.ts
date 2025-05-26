import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma, { withRetry } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authUser = getUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user data from database
    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: authUser.userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      })
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
