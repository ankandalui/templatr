import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// PUT /api/folders/[id] - Update a folder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, color } = body;

    // Check if folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!existingFolder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // If name is being updated, check for duplicates
    if (name && name.trim() !== existingFolder.name) {
      const duplicateFolder = await prisma.folder.findUnique({
        where: {
          userId_name: {
            userId: user.userId,
            name: name.trim(),
          },
        },
      });

      if (duplicateFolder) {
        return NextResponse.json(
          { error: "A folder with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Update the folder
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(color && { color }),
      },
      include: {
        _count: {
          select: {
            templates: true,
          },
        },
      },
    });

    // Transform the response
    const folderResponse = {
      id: updatedFolder.id,
      name: updatedFolder.name,
      description: updatedFolder.description,
      color: updatedFolder.color,
      userId: updatedFolder.userId,
      templateCount: updatedFolder._count.templates,
      createdAt: updatedFolder.createdAt.toISOString(),
      updatedAt: updatedFolder.updatedAt.toISOString(),
    };

    return NextResponse.json({ folder: folderResponse });
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/folders/[id] - Delete a folder and all its templates
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id,
        userId: user.userId,
      },
      include: {
        templates: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            templates: true,
          },
        },
      },
    });

    if (!existingFolder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Use a transaction to ensure both folder and templates are deleted together
    await prisma.$transaction(async (tx) => {
      // First, soft delete all templates in the folder by setting isActive to false
      if (existingFolder.templates.length > 0) {
        await tx.template.updateMany({
          where: {
            folderId: id,
            userId: user.userId,
          },
          data: {
            isActive: false,
          },
        });
      }

      // Then delete the folder
      await tx.folder.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      message: "Folder deleted successfully",
      deletedTemplatesCount: existingFolder._count.templates,
      folderName: existingFolder.name,
    });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
