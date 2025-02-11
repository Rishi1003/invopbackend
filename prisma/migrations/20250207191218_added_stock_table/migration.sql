-- CreateTable
CREATE TABLE "material_stock" (
    "materialId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "material_stock_pkey" PRIMARY KEY ("materialId")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_stock_materialId_key" ON "material_stock"("materialId");
