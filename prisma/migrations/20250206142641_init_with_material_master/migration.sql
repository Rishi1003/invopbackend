-- CreateTable
CREATE TABLE "material_master" (
    "materialId" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "material_master_pkey" PRIMARY KEY ("materialId")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_master_materialId_key" ON "material_master"("materialId");
