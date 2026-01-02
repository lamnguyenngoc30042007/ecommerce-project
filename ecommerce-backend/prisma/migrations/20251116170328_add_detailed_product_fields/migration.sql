-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "detailed_description" TEXT,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
