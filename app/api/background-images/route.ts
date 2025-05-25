import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/background-images - Get all background images for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backgroundImages = await prisma.backgroundImage.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ backgroundImages });
  } catch (error) {
    console.error("Error fetching background images:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/background-images - Upload a new background image
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // For now, we'll store the file as base64 in the database
    // In production, you'd upload to cloud storage (AWS S3, Cloudinary, etc.)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const imageUrl = `data:${file.type};base64,${base64}`;

    // Create the background image record
    const backgroundImage = await prisma.backgroundImage.create({
      data: {
        name: name || file.name,
        imageUrl,
        userId: user.userId,
      },
    });

    return NextResponse.json({ backgroundImage }, { status: 201 });
  } catch (error) {
    console.error("Error uploading background image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
