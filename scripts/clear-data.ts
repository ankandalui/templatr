import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing all seed data...");

  try {
    // Delete in correct order due to foreign key constraints
    console.log("🗑️ Deleting templates...");
    await prisma.template.deleteMany({});

    console.log("🗑️ Deleting background images...");
    await prisma.backgroundImage.deleteMany({});

    console.log("🗑️ Deleting question images...");
    await prisma.questionImage.deleteMany({});

    console.log("🗑️ Deleting folders...");
    await prisma.folder.deleteMany({});

    console.log("✅ All seed data cleared successfully!");
    console.log("📊 Database is now clean and ready for real user data.");
  } catch (error) {
    console.error("❌ Error clearing data:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
