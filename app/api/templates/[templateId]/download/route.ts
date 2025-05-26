import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/templates/[templateId]/download - Download a template
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
        backgroundImage: {
          select: {
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

    // Increment download count
    await prisma.template.update({
      where: { id: templateId },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    // Generate the merged image with question overlay
    if (template.backgroundImage?.imageUrl && template.questionUrl) {
      try {
        // Import canvas for server-side image processing
        const { createCanvas, loadImage } = await import("canvas");

        // Load both images
        const [backgroundImg, questionImg] = await Promise.all([
          loadImage(template.backgroundImage.imageUrl),
          loadImage(template.questionUrl),
        ]);

        // Create canvas with background image dimensions
        const canvas = createCanvas(backgroundImg.width, backgroundImg.height);
        const ctx = canvas.getContext("2d");

        // Draw background image
        ctx.drawImage(backgroundImg, 0, 0);

        // Calculate question image dimensions and position
        const padding = 16; // 16px padding from edges
        const maxQuestionWidth = canvas.width * 0.7; // 70% of canvas width
        const maxQuestionHeight = canvas.height * 0.8; // 80% of canvas height

        // Calculate scaled dimensions maintaining aspect ratio
        const questionAspectRatio = questionImg.width / questionImg.height;
        let questionWidth = Math.min(maxQuestionWidth, questionImg.width);
        let questionHeight = questionWidth / questionAspectRatio;

        // If height exceeds max, scale down based on height
        if (questionHeight > maxQuestionHeight) {
          questionHeight = maxQuestionHeight;
          questionWidth = questionHeight * questionAspectRatio;
        }

        // Position at top-left with padding
        const questionX = padding;
        const questionY = padding;

        // Draw question image directly without any background or shadow
        ctx.drawImage(
          questionImg,
          questionX,
          questionY,
          questionWidth,
          questionHeight
        );

        // Convert canvas to buffer
        const buffer = canvas.toBuffer("image/png");

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="${template.name}.png"`,
          },
        });
      } catch (canvasError) {
        console.error("Error generating merged image:", canvasError);
        // Fallback to background image only
        const imageResponse = await fetch(template.backgroundImage.imageUrl);
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          return new NextResponse(imageBuffer, {
            headers: {
              "Content-Type": "image/png",
              "Content-Disposition": `attachment; filename="${template.name}.png"`,
            },
          });
        }
      }
    }

    return NextResponse.json(
      { error: "Template image not available" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error downloading template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
