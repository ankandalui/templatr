import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// Array of gradient color combinations for folders
const folderColors = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-green-500 to-green-600",
  "from-red-500 to-red-600",
  "from-yellow-500 to-yellow-600",
  "from-pink-500 to-pink-600",
  "from-indigo-500 to-indigo-600",
  "from-teal-500 to-teal-600",
  "from-orange-500 to-orange-600",
  "from-cyan-500 to-cyan-600",
  "from-emerald-500 to-emerald-600",
  "from-violet-500 to-violet-600",
  "from-rose-500 to-rose-600",
  "from-amber-500 to-amber-600",
  "from-lime-500 to-lime-600",
  "from-sky-500 to-sky-600",
];

// Function to get a random color
const getRandomFolderColor = () => {
  return folderColors[Math.floor(Math.random() * folderColors.length)];
};

// POST /api/folders/update-colors - Update all folders with random colors
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all folders for the user
    const folders = await prisma.folder.findMany({
      where: {
        userId: user.userId,
      },
    });

    // Update each folder with a random color
    const updatePromises = folders.map((folder) =>
      prisma.folder.update({
        where: { id: folder.id },
        data: { color: getRandomFolderColor() },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: "Folder colors updated successfully",
      updatedCount: folders.length,
    });
  } catch (error) {
    console.error("Error updating folder colors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
