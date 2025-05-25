/*
  Warnings:

  - You are about to drop the column `backgroundUrl` on the `Template` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Template" DROP COLUMN "backgroundUrl",
ADD COLUMN     "backgroundImageId" TEXT;

-- CreateTable
CREATE TABLE "BackgroundImage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackgroundImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BackgroundImage" ADD CONSTRAINT "BackgroundImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_backgroundImageId_fkey" FOREIGN KEY ("backgroundImageId") REFERENCES "BackgroundImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
