import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma, { withRetry } from "@/lib/prisma";

// GET /api/folders - Get all folders for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folders = await withRetry(() =>
      prisma.folder.findMany({
        where: {
          userId: user.userId,
        },
        include: {
          _count: {
            select: {
              templates: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    );

    // Transform the data to include template count
    const foldersWithCount = folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      color: folder.color,
      userId: folder.userId,
      templateCount: folder._count.templates,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    }));

    return NextResponse.json({ folders: foldersWithCount });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Check if folder with same name already exists for this user
    const existingFolder = await withRetry(() =>
      prisma.folder.findUnique({
        where: {
          userId_name: {
            userId: user.userId,
            name: name.trim(),
          },
        },
      })
    );

    if (existingFolder) {
      return NextResponse.json(
        { error: "A folder with this name already exists" },
        { status: 400 }
      );
    }

    // Create the folder
    const folder = await withRetry(() =>
      prisma.folder.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          color: color || "from-blue-500 to-blue-600",
          userId: user.userId,
        },
        include: {
          _count: {
            select: {
              templates: true,
            },
          },
        },
      })
    );

    // Transform the response
    const folderResponse = {
      id: folder.id,
      name: folder.name,
      description: folder.description,
      color: folder.color,
      userId: folder.userId,
      templateCount: folder._count.templates,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    };

    return NextResponse.json({ folder: folderResponse }, { status: 201 });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
