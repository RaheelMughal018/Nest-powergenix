-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('DRAFT', 'IN_PROCESS', 'DONE');

-- AlterTable
ALTER TABLE "stock_adjustments" ADD COLUMN     "production_id" INTEGER;

-- CreateTable
CREATE TABLE "recipes" (
    "id" SERIAL NOT NULL,
    "final_product_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "total_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productions" (
    "id" SERIAL NOT NULL,
    "batch_number" VARCHAR(50) NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "ProductionStatus" NOT NULL DEFAULT 'DRAFT',
    "total_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cost_per_unit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(6),
    "completion_date" TIMESTAMP(6),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "productions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_items" (
    "id" SERIAL NOT NULL,
    "production_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "serial_number" VARCHAR(100) NOT NULL,
    "cost_price" DECIMAL(15,2) NOT NULL,
    "is_sold" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "production_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipes_final_product_id_key" ON "recipes"("final_product_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_item_id_idx" ON "recipe_ingredients"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ingredients_recipe_id_item_id_key" ON "recipe_ingredients"("recipe_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "productions_batch_number_key" ON "productions"("batch_number");

-- CreateIndex
CREATE INDEX "productions_recipe_id_idx" ON "productions"("recipe_id");

-- CreateIndex
CREATE INDEX "productions_status_idx" ON "productions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "production_items_serial_number_key" ON "production_items"("serial_number");

-- CreateIndex
CREATE INDEX "production_items_production_id_idx" ON "production_items"("production_id");

-- CreateIndex
CREATE INDEX "production_items_item_id_idx" ON "production_items"("item_id");

-- CreateIndex
CREATE INDEX "production_items_serial_number_idx" ON "production_items"("serial_number");

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "productions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_final_product_id_fkey" FOREIGN KEY ("final_product_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_items" ADD CONSTRAINT "production_items_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "productions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_items" ADD CONSTRAINT "production_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
