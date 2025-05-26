import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Get the first user (assuming you have a user already)
  const user = await prisma.user.findFirst();

  if (!user) {
    console.log("❌ No user found. Please create a user first.");
    return;
  }

  console.log(`👤 Found user: ${user.name} (${user.email})`);

  // Create sample folders
  const folders = [
    {
      name: "Math Quizzes",
      description: "Mathematical problem sets and quizzes",
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Science Worksheets",
      description: "Science experiments and worksheets",
      color: "from-green-500 to-green-600",
    },
    {
      name: "History Tests",
      description: "Historical events and timeline quizzes",
      color: "from-purple-500 to-purple-600",
    },
    {
      name: "Language Practice",
      description: "Language learning exercises",
      color: "from-orange-500 to-orange-600",
    },
    {
      name: "Art Projects",
      description: "Creative art and design templates",
      color: "from-pink-500 to-pink-600",
    },
  ];

  console.log("📁 Creating folders...");
  const createdFolders = [];

  for (const folderData of folders) {
    try {
      const folder = await prisma.folder.create({
        data: {
          ...folderData,
          userId: user.id,
        },
      });
      createdFolders.push(folder);
      console.log(`✅ Created folder: ${folder.name}`);
    } catch (error) {
      console.log(
        `⚠️ Folder "${folderData.name}" might already exist, skipping...`
      );
    }
  }

  // Create sample templates
  const templates = [
    {
      name: "Algebra Basics Quiz",
      description: "Basic algebraic equations and problem solving",
      downloadCount: 45,
      viewCount: 234,
    },
    {
      name: "Geometry Shapes Test",
      description: "Identifying and calculating geometric shapes",
      downloadCount: 32,
      viewCount: 189,
    },
    {
      name: "Chemistry Elements",
      description: "Periodic table and chemical reactions",
      downloadCount: 28,
      viewCount: 156,
    },
    {
      name: "World War II Timeline",
      description: "Major events of World War II",
      downloadCount: 67,
      viewCount: 345,
    },
    {
      name: "English Grammar Rules",
      description: "Basic grammar and sentence structure",
      downloadCount: 89,
      viewCount: 567,
    },
    {
      name: "Spanish Vocabulary",
      description: "Common Spanish words and phrases",
      downloadCount: 123,
      viewCount: 678,
    },
    {
      name: "Color Theory Basics",
      description: "Understanding color relationships",
      downloadCount: 34,
      viewCount: 198,
    },
    {
      name: "Drawing Techniques",
      description: "Fundamental drawing skills and methods",
      downloadCount: 56,
      viewCount: 289,
    },
  ];

  console.log("📄 Creating templates...");

  for (let i = 0; i < templates.length; i++) {
    const templateData = templates[i];
    const folder = createdFolders[i % createdFolders.length]; // Distribute templates across folders

    try {
      const template = await prisma.template.create({
        data: {
          ...templateData,
          userId: user.id,
          folderId: folder?.id,
        },
      });
      console.log(
        `✅ Created template: ${template.name} in folder: ${
          folder?.name || "No folder"
        }`
      );
    } catch (error) {
      console.log(
        `⚠️ Template "${templateData.name}" might already exist, skipping...`
      );
    }
  }

  // Create some question images
  const questionImages = [
    { name: "Math Problem 1", imageUrl: "/images/math-1.jpg" },
    { name: "Science Diagram", imageUrl: "/images/science-1.jpg" },
    { name: "History Map", imageUrl: "/images/history-1.jpg" },
    { name: "Language Exercise", imageUrl: "/images/language-1.jpg" },
    { name: "Art Reference", imageUrl: "/images/art-1.jpg" },
  ];

  console.log("🖼️ Creating question images...");

  for (const imageData of questionImages) {
    try {
      const questionImage = await prisma.questionImage.create({
        data: {
          ...imageData,
          userId: user.id,
        },
      });
      console.log(`✅ Created question image: ${questionImage.name}`);
    } catch (error) {
      console.log(
        `⚠️ Question image "${imageData.name}" might already exist, skipping...`
      );
    }
  }

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
