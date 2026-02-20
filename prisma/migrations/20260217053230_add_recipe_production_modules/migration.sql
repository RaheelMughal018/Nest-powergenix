/*
  Warnings:

  - You are about to drop the column `total_cost` on the `recipes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "total_cost";

-- CreateTable
CREATE TABLE "production_ingredients" (
    "id" SERIAL NOT NULL,
    "production_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "is_from_recipe" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "production_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "production_ingredients_production_id_idx" ON "production_ingredients"("production_id");

-- CreateIndex
CREATE INDEX "production_ingredients_item_id_idx" ON "production_ingredients"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_ingredients_production_id_item_id_key" ON "production_ingredients"("production_id", "item_id");

-- AddForeignKey
ALTER TABLE "production_ingredients" ADD CONSTRAINT "production_ingredients_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "productions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_ingredients" ADD CONSTRAINT "production_ingredients_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
