-- CreateTable
CREATE TABLE "material_consumption" (
    "timeId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "consumedQuantity" INTEGER NOT NULL,

    CONSTRAINT "material_consumption_pkey" PRIMARY KEY ("timeId","materialId")
);

-- AddForeignKey
ALTER TABLE "material_consumption" ADD CONSTRAINT "material_consumption_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "time_master"("Time_Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_consumption" ADD CONSTRAINT "material_consumption_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_master"("materialId") ON DELETE RESTRICT ON UPDATE CASCADE;
