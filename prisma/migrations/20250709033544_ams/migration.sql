/*
  Warnings:

  - The primary key for the `material_ams` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `material_ams` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "material_ams_materialId_key";

-- AlterTable
ALTER TABLE "material_ams" DROP CONSTRAINT "material_ams_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "material_ams_pkey" PRIMARY KEY ("id");
