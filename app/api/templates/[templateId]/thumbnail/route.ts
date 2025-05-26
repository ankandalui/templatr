import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/templates/[templateId]/thumbnail - Generate and return thumbnail
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

    // Generate the merged thumbnail with question overlay
    if (template.backgroundImage?.imageUrl && template.questionUrl) {
      try {
        // Import canvas for server-side image processing
        const { createCanvas, loadImage } = await import("canvas");

        // Load both images
        const [backgroundImg, questionImg] = await Promise.all([
          loadImage(template.backgroundImage.imageUrl),
          loadImage(template.questionUrl),
        ]);

        // Create canvas with 16:9 aspect ratio for thumbnail
        const canvasWidth = 400;
        const canvasHeight = 225;
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        // Draw background image (cover the entire canvas)
        ctx.drawImage(backgroundImg, 0, 0, canvasWidth, canvasHeight);

        // Calculate question image dimensions and position
        const padding = 16; // 16px padding from edges
        const maxQuestionWidth = canvasWidth * 0.7; // 70% of canvas width
        const maxQuestionHeight = canvasHeight * 0.8; // 80% of canvas height

        // Calculate scaled dimensions maintaining aspect ratio
        const questionAspectRatio = questionImg.width / questionImg.height;
        let questionWidth = maxQuestionWidth;
        let questionHeight = questionWidth / questionAspectRatio;

        // If height exceeds max, scale by height instead
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
        const buffer = canvas.toBuffer("image/jpeg", { quality: 0.8 });

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=3600", // Cache for 1 hour
          },
        });
      } catch (canvasError) {
        console.error("Error generating thumbnail:", canvasError);

        // Fallback to background image only
        if (template.backgroundImage?.imageUrl) {
          try {
            const imageResponse = await fetch(
              template.backgroundImage.imageUrl
            );
            if (imageResponse.ok) {
              const imageBuffer = await imageResponse.arrayBuffer();
              return new NextResponse(imageBuffer, {
                headers: {
                  "Content-Type": "image/jpeg",
                  "Cache-Control": "public, max-age=3600",
                },
              });
            }
          } catch (fetchError) {
            console.error("Error fetching background image:", fetchError);
          }
        }
      }
    }

    return NextResponse.json(
      { error: "Thumbnail not available" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
