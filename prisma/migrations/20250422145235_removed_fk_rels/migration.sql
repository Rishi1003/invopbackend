-- DropForeignKey
ALTER TABLE "material_consumption" DROP CONSTRAINT "material_consumption_materialId_fkey";

-- DropForeignKey
ALTER TABLE "material_consumption" DROP CONSTRAINT "material_consumption_timeId_fkey";

-- DropForeignKey
ALTER TABLE "material_delivery" DROP CONSTRAINT "material_delivery_materialId_fkey";

-- DropForeignKey
ALTER TABLE "material_forecasting" DROP CONSTRAINT "material_forecasting_materialId_fkey";

-- DropForeignKey
ALTER TABLE "proposed_sap" DROP CONSTRAINT "proposed_sap_materialNo_fkey";
