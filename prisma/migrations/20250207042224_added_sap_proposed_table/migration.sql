-- CreateTable
CREATE TABLE "material_delivery" (
    "materialId" TEXT NOT NULL,
    "supplierPlant" TEXT NOT NULL,
    "stillToBeDelivered" INTEGER NOT NULL,

    CONSTRAINT "material_delivery_pkey" PRIMARY KEY ("materialId","supplierPlant")
);

-- CreateTable
CREATE TABLE "proposed_sap" (
    "materialNo" TEXT NOT NULL,
    "reorderPt" INTEGER NOT NULL,
    "maxStk" INTEGER NOT NULL,

    CONSTRAINT "proposed_sap_pkey" PRIMARY KEY ("materialNo")
);

-- CreateIndex
CREATE UNIQUE INDEX "proposed_sap_materialNo_key" ON "proposed_sap"("materialNo");

-- AddForeignKey
ALTER TABLE "material_delivery" ADD CONSTRAINT "material_delivery_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material_master"("materialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposed_sap" ADD CONSTRAINT "proposed_sap_materialNo_fkey" FOREIGN KEY ("materialNo") REFERENCES "material_master"("materialId") ON DELETE RESTRICT ON UPDATE CASCADE;
