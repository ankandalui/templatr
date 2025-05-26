import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// POST /api/templates/[templateId]/view - Increment view count
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await params;

    // Check if template exists and belongs to user
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        userId: user.userId,
        isActive: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.template.update({
      where: { id: templateId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ message: "View count incremented" });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
