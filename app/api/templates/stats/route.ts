import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/templates/stats - Get template statistics for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get template stats (only active templates)
    const templateStats = await prisma.template.aggregate({
      where: {
        userId: user.userId,
        isActive: true, // Only count active templates
      },
      _count: {
        id: true,
      },
      _sum: {
        downloadCount: true,
        viewCount: true,
      },
    });

    // Get question images count
    const questionImagesCount = await prisma.questionImage.count({
      where: {
        userId: user.userId,
      },
    });

    const stats = {
      totalTemplates: templateStats._count.id || 0,
      totalDownloads: templateStats._sum.downloadCount || 0,
      totalViews: templateStats._sum.viewCount || 0,
      totalImages: questionImagesCount || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching template stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
