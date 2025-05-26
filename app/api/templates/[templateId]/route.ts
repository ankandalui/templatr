import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/templates/[templateId] - Get a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await params;

    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
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

    // Transform the response
    const templateResponse = {
      id: template.id,
      name: template.name,
      description: template.description,
      backgroundImage: template.backgroundImage,
      questionUrl: template.questionUrl,
      thumbnailUrl: template.thumbnailUrl,
      downloadCount: template.downloadCount,
      viewCount: template.viewCount + 1, // Include the incremented view
      isActive: template.isActive,
      userId: template.userId,
      folderId: template.folderId,
      folderName: template.folder?.name,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };

    return NextResponse.json({ template: templateResponse });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[templateId] - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await params;
    const { name, folderId } = await request.json();

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: templateId,
        userId: user.userId,
        isActive: true,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Update template
    const updatedTemplate = await prisma.template.update({
      where: { id: templateId },
      data: {
        name: name?.trim(),
        folderId: folderId === "no-folder" ? null : folderId || null,
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
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      description: updatedTemplate.description,
      backgroundImage: updatedTemplate.backgroundImage,
      questionUrl: updatedTemplate.questionUrl,
      thumbnailUrl: updatedTemplate.thumbnailUrl,
      downloadCount: updatedTemplate.downloadCount,
      viewCount: updatedTemplate.viewCount,
      isActive: updatedTemplate.isActive,
      userId: updatedTemplate.userId,
      folderId: updatedTemplate.folderId,
      folderName: updatedTemplate.folder?.name,
      createdAt: updatedTemplate.createdAt.toISOString(),
      updatedAt: updatedTemplate.updatedAt.toISOString(),
    };

    return NextResponse.json({ template: templateResponse });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[templateId] - Delete a template
export async function DELETE(
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
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.template.update({
      where: { id: templateId },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
