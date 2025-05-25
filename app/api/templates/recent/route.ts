import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/templates/recent - Get recent templates for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "6");

    const templates = await prisma.template.findMany({
      where: {
        userId: user.userId,
        isActive: true,
      },
      include: {
        folder: {
          select: {
            name: true,
          },
        },
        backgroundImage: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Transform the data
    const templatesResponse = templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      backgroundUrl: template.backgroundUrl,
      backgroundImage: template.backgroundImage,
      questionUrl: template.questionUrl,
      thumbnailUrl: template.thumbnailUrl,
      downloadCount: template.downloadCount,
      viewCount: template.viewCount,
      isActive: template.isActive,
      userId: template.userId,
      folderId: template.folderId,
      folderName: template.folder?.name,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    }));

    return NextResponse.json({ templates: templatesResponse });
  } catch (error) {
    console.error("Error fetching recent templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
