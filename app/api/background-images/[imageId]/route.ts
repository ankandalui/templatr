import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/background-images/[imageId] - Get a specific background image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageId } = await params;

    const backgroundImage = await prisma.backgroundImage.findFirst({
      where: {
        id: imageId,
        userId: user.userId,
      },
    });

    if (!backgroundImage) {
      return NextResponse.json(
        { error: "Background image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ backgroundImage });
  } catch (error) {
    console.error("Error fetching background image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/background-images/[imageId] - Delete a background image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageId } = await params;

    // Check if the background image exists and belongs to the user
    const backgroundImage = await prisma.backgroundImage.findFirst({
      where: {
        id: imageId,
        userId: user.userId,
      },
      include: {
        templates: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!backgroundImage) {
      return NextResponse.json(
        { error: "Background image not found" },
        { status: 404 }
      );
    }

    // Check if the background image is being used by any templates
    if (backgroundImage.templates.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete background image",
          message: `This background image is being used by ${backgroundImage.templates.length} template(s). Please remove it from templates first.`,
          templates: backgroundImage.templates,
        },
        { status: 400 }
      );
    }

    // Delete the background image
    await prisma.backgroundImage.delete({
      where: {
        id: imageId,
      },
    });

    return NextResponse.json({
      message: "Background image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting background image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/background-images/[imageId] - Download a background image (using POST for download)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageId } = await params;

    const backgroundImage = await prisma.backgroundImage.findFirst({
      where: {
        id: imageId,
        userId: user.userId,
      },
    });

    if (!backgroundImage) {
      return NextResponse.json(
        { error: "Background image not found" },
        { status: 404 }
      );
    }

    // For base64 images, convert back to binary
    if (backgroundImage.imageUrl.startsWith("data:")) {
      const base64Data = backgroundImage.imageUrl.split(",")[1];
      const mimeType =
        backgroundImage.imageUrl.match(/data:([^;]+)/)?.[1] || "image/png";
      const buffer = Buffer.from(base64Data, "base64");

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${
            backgroundImage.name
          }.${mimeType.split("/")[1]}"`,
        },
      });
    }

    // For URL-based images, fetch and return
    const imageResponse = await fetch(backgroundImage.imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 404 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("content-type") || "image/png";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${backgroundImage.name}.${
          contentType.split("/")[1]
        }"`,
      },
    });
  } catch (error) {
    console.error("Error downloading background image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
