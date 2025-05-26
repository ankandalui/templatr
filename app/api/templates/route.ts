import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/templates - Get templates for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    const templates = await prisma.template.findMany({
      where: {
        userId: user.userId,
        ...(folderId && { folderId }),
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
    });

    // Transform the data
    const templatesResponse = templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      backgroundUrl: template.backgroundImage?.imageUrl,
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
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create a new template with file uploads
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse FormData
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const templateType = formData.get("templateType") as string;
    const backgroundImageId = formData.get("backgroundImageId") as string;
    const folderId = formData.get("folderId") as string;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    // Get question image files
    const questionFiles: File[] = [];
    let index = 0;
    while (true) {
      const file = formData.get(`questionImage_${index}`) as File;
      if (!file) break;
      questionFiles.push(file);
      index++;
    }

    if (questionFiles.length === 0) {
      return NextResponse.json(
        { error: "At least one question image is required" },
        { status: 400 }
      );
    }

    // Validate template type limits
    if (templateType === "standalone" && questionFiles.length > 1) {
      return NextResponse.json(
        { error: "Standalone templates can only have one question image" },
        { status: 400 }
      );
    }

    if (templateType === "folder" && questionFiles.length > 50) {
      return NextResponse.json(
        { error: "Folder templates can have maximum 50 question images" },
        { status: 400 }
      );
    }

    // If folderId is provided, verify it belongs to the user
    if (folderId && folderId !== "") {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: user.userId,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 }
        );
      }
    }

    // Upload question images and create templates
    const createdTemplates = [];

    for (let i = 0; i < questionFiles.length; i++) {
      const questionFile = questionFiles[i];

      // Upload question image to storage
      const questionImageBuffer = Buffer.from(await questionFile.arrayBuffer());
      const questionImageBase64 = questionImageBuffer.toString("base64");
      const questionImageUrl = `data:${questionFile.type};base64,${questionImageBase64}`;

      // Create template name for multiple images
      const templateName =
        templateType === "folder" && questionFiles.length > 1
          ? `${name.trim()} - Question ${i + 1}`
          : name.trim();

      // Create the template
      const template = await prisma.template.create({
        data: {
          name: templateName,
          description: null,
          backgroundImageId: backgroundImageId || null,
          questionUrl: questionImageUrl,
          thumbnailUrl: null, // Will be generated after overlay processing
          userId: user.userId,
          folderId: folderId && folderId !== "" ? folderId : null,
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
      });

      // Transform the response
      const templateResponse = {
        id: template.id,
        name: template.name,
        description: template.description,
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
      };

      createdTemplates.push(templateResponse);
    }

    // Return single template for standalone, array for folder
    if (templateType === "standalone") {
      return NextResponse.json(
        { template: createdTemplates[0] },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { templates: createdTemplates },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
