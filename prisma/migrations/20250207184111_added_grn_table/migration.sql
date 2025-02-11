-- CreateTable
CREATE TABLE "material_grn" (
    "materialId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "material_grn_pkey" PRIMARY KEY ("materialId")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_grn_materialId_key" ON "material_grn"("materialId");
