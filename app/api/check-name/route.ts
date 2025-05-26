import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/check-name?name=example&type=folder - Check if name exists
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const type = searchParams.get("type"); // 'folder' or 'template' or 'both'

    if (!name) {
      return NextResponse.json(
        { error: "Name parameter is required" },
        { status: 400 }
      );
    }

    const normalizedName = name.trim().toLowerCase();
    let folderExists = false;
    let templateExists = false;

    // Check folders if type is 'folder' or 'both'
    if (type === "folder" || type === "both" || !type) {
      const existingFolder = await prisma.folder.findFirst({
        where: {
          userId: user.userId,
          name: {
            mode: "insensitive",
            equals: normalizedName,
          },
        },
      });
      folderExists = !!existingFolder;
    }

    // Check templates if type is 'template' or 'both'
    if (type === "template" || type === "both" || !type) {
      const existingTemplate = await prisma.template.findFirst({
        where: {
          userId: user.userId,
          isActive: true,
          name: {
            mode: "insensitive",
            equals: normalizedName,
          },
        },
      });
      templateExists = !!existingTemplate;
    }

    return NextResponse.json({
      exists: folderExists || templateExists,
      folderExists,
      templateExists,
      message:
        folderExists && templateExists
          ? "Both folder and template with this name exist"
          : folderExists
          ? "A folder with this name already exists"
          : templateExists
          ? "A template with this name already exists"
          : "Name is available",
    });
  } catch (error) {
    console.error("Error checking name:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
