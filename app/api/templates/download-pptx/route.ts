import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// POST /api/templates/download-pptx - Download multiple templates as PPTX
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateIds, fileName } = await request.json();

    if (
      !templateIds ||
      !Array.isArray(templateIds) ||
      templateIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Template IDs are required" },
        { status: 400 }
      );
    }

    // Fetch all templates
    const templates = await prisma.template.findMany({
      where: {
        id: { in: templateIds },
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
      orderBy: {
        createdAt: "asc",
      },
    });

    if (templates.length === 0) {
      return NextResponse.json(
        { error: "No templates found" },
        { status: 404 }
      );
    }

    // Import PptxGenJS for PowerPoint generation
    const PptxGenJS = (await import("pptxgenjs")).default;
    const pptx = new PptxGenJS();

    // Set presentation properties
    pptx.author = user.name || "Templatr";
    pptx.company = "Templatr";
    pptx.subject = fileName || "Generated Templates";
    pptx.title = fileName || "Generated Templates";

    // Process each template
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];

      // Create a new slide
      const slide = pptx.addSlide();

      try {
        // If we have both background and question images, create merged image
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
            const canvas = createCanvas(
              backgroundImg.width,
              backgroundImg.height
            );
            const ctx = canvas.getContext("2d");

            // Draw background image
            ctx.drawImage(backgroundImg, 0, 0);

            // Calculate question image dimensions and position
            const padding = 16;
            const maxQuestionWidth = canvas.width * 0.7;
            const maxQuestionHeight = canvas.height * 0.8;

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

            // Draw question image
            ctx.drawImage(
              questionImg,
              questionX,
              questionY,
              questionWidth,
              questionHeight
            );

            // Convert canvas to base64
            const mergedImageBase64 = canvas.toDataURL("image/png");

            // Add merged image to slide - fill entire slide
            slide.addImage({
              data: mergedImageBase64,
              x: 0,
              y: 0,
              w: "100%",
              h: "100%",
            });
          } catch (imageError) {
            console.error("Error processing images for slide:", imageError);

            // Fallback: add background image only - fill entire slide
            if (template.backgroundImage?.imageUrl) {
              slide.addImage({
                data: template.backgroundImage.imageUrl,
                x: 0,
                y: 0,
                w: "100%",
                h: "100%",
              });
            }
          }
        } else if (template.backgroundImage?.imageUrl) {
          // Add background image only - fill entire slide
          slide.addImage({
            data: template.backgroundImage.imageUrl,
            x: 0,
            y: 0,
            w: "100%",
            h: "100%",
          });
        }
      } catch (slideError) {
        console.error(`Error creating slide ${i + 1}:`, slideError);
        // Skip this slide if there's an error
      }
    }

    // Generate PPTX buffer
    const pptxBuffer = await pptx.write("nodebuffer");

    // Return PPTX file
    return new NextResponse(pptxBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${
          fileName || "templates"
        }.pptx"`,
      },
    });
  } catch (error) {
    console.error("Error generating PPTX:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
