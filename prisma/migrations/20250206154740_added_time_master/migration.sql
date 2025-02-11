-- CreateTable
CREATE TABLE "time_master" (
    "Time_Id" TEXT NOT NULL,
    "Month" TEXT NOT NULL,
    "Year" INTEGER NOT NULL,

    CONSTRAINT "time_master_pkey" PRIMARY KEY ("Time_Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "time_master_Time_Id_key" ON "time_master"("Time_Id");
