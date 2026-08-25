-- Revistoria de conferencia: vinculo entre uma vistoria e a que ela veio
-- conferir, e entre cada item/ocorrencia e seu correspondente na original.
-- Tudo anulavel e SetNull: apagar a vistoria de origem nao derruba a
-- revistoria, so a deixa sem o "antes".
-- AlterTable
ALTER TABLE "Finding" ADD COLUMN     "sourceFindingId" TEXT;

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "parentInspectionId" TEXT;

-- AlterTable
ALTER TABLE "InspectionItem" ADD COLUMN     "sourceItemId" TEXT,
ADD COLUMN     "sourceStatus" TEXT;

-- CreateIndex
CREATE INDEX "Finding_sourceFindingId_idx" ON "Finding"("sourceFindingId");

-- CreateIndex
CREATE INDEX "Inspection_parentInspectionId_idx" ON "Inspection"("parentInspectionId");

-- CreateIndex
CREATE INDEX "InspectionItem_sourceItemId_idx" ON "InspectionItem"("sourceItemId");

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_parentInspectionId_fkey" FOREIGN KEY ("parentInspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionItem" ADD CONSTRAINT "InspectionItem_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "InspectionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_sourceFindingId_fkey" FOREIGN KEY ("sourceFindingId") REFERENCES "Finding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
