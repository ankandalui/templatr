import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/folders/[id]/templates - Get folder with its templates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch folder with templates
    const folder = await prisma.folder.findFirst({
      where: {
        id: id,
        userId: user.userId,
      },
      include: {
        templates: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
            downloadCount: true,
            viewCount: true,
            createdAt: true,
            isActive: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Format the response
    const folderData = {
      id: folder.id,
      name: folder.name,
      color: folder.color,
      templateCount: folder.templates.length,
      templates: folder.templates,
    };

    return NextResponse.json({
      folder: folderData,
    });
  } catch (error) {
    console.error("Error fetching folder templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
