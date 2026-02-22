/*
  Warnings:

  - You are about to alter the column `quantity` on the `recipe_ingredients` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,3)` to `Decimal(15,2)`.

*/
-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('PCS', 'SET');

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "unit_type" "UnitType" NOT NULL DEFAULT 'PCS';

-- AlterTable
ALTER TABLE "recipe_ingredients" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(15,2);
