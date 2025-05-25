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
        // Create editable PowerPoint with separate layers
        if (template.backgroundImage?.imageUrl && template.questionUrl) {
          try {
            // Add background image as base layer - fill entire slide
            slide.addImage({
              data: template.backgroundImage.imageUrl,
              x: 0,
              y: 0,
              w: "100%",
              h: "100%",
            });

            // Calculate question image position and size for PowerPoint
            // Standard slide dimensions in PowerPoint: 10" x 7.5" (720 x 540 points)
            const slideWidth = 10; // inches
            const slideHeight = 7.5; // inches

            // Convert padding from pixels to inches (assuming 96 DPI)
            const paddingInches = 16 / 96; // 16px = ~0.167 inches

            // Calculate maximum question image size (70% of slide width, 80% of slide height)
            const maxQuestionWidthInches = slideWidth * 0.7;
            const maxQuestionHeightInches = slideHeight * 0.8;

            // Load question image to get dimensions
            const { loadImage } = await import("canvas");
            const questionImg = await loadImage(template.questionUrl);

            // Calculate aspect ratio
            const questionAspectRatio = questionImg.width / questionImg.height;

            // Calculate scaled dimensions maintaining aspect ratio
            let questionWidthInches = Math.min(
              maxQuestionWidthInches,
              questionImg.width / 96
            );
            let questionHeightInches =
              questionWidthInches / questionAspectRatio;

            // If height exceeds max, scale down based on height
            if (questionHeightInches > maxQuestionHeightInches) {
              questionHeightInches = maxQuestionHeightInches;
              questionWidthInches = questionHeightInches * questionAspectRatio;
            }

            // Add question image as separate, editable object positioned at top-left with padding
            slide.addImage({
              data: template.questionUrl,
              x: paddingInches, // Position from left edge
              y: paddingInches, // Position from top edge
              w: questionWidthInches, // Width in inches
              h: questionHeightInches, // Height in inches
              // Make it movable and resizable in PowerPoint
              sizing: {
                type: "contain",
                w: questionWidthInches,
                h: questionHeightInches,
              },
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
