-- CreateTable
CREATE TABLE "material_ppo" (
    "materialId" INTEGER NOT NULL,
    "pendingQuantity" INTEGER NOT NULL,
    "supplier" TEXT NOT NULL,

    CONSTRAINT "material_ppo_pkey" PRIMARY KEY ("materialId")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_ppo_materialId_key" ON "material_ppo"("materialId");
