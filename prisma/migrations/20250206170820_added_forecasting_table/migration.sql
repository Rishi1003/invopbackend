-- CreateTable
CREATE TABLE "material_forecasting" (
    "materialId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "forecastingForNextMonth" INTEGER NOT NULL,

    CONSTRAINT "material_forecasting_pkey" PRIMARY KEY ("materialId","monthYear")
);

-- AddForeignKey
ALTER TABLE "material_forecasting" ADD CONSTRAINT "material_forecasting_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_master"("materialId") ON DELETE RESTRICT ON UPDATE CASCADE;
