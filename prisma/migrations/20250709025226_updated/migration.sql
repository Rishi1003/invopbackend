-- CreateTable
CREATE TABLE "material_ams" (
    "materialId" INTEGER NOT NULL,
    "timeId" INTEGER NOT NULL,
    "forecast" DOUBLE PRECISION NOT NULL,
    "model" TEXT NOT NULL,
    "MAPE" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "material_ams_pkey" PRIMARY KEY ("materialId")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_ams_materialId_key" ON "material_ams"("materialId");
