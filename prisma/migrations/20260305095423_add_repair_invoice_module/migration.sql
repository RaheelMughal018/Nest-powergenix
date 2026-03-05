/*
  Warnings:

  - You are about to alter the column `name` on the `expense_categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `quantity` on the `production_ingredients` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,3)`.
  - You are about to alter the column `quantity` on the `recipe_ingredients` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,3)`.

*/
-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED');

-- AlterTable
ALTER TABLE "expense_categories" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "expense_date" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "ledger_entries" ADD COLUMN     "repair_invoice_id" INTEGER;

-- AlterTable
ALTER TABLE "production_ingredients" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(15,3);

-- AlterTable
ALTER TABLE "receipts" ADD COLUMN     "repair_invoice_id" INTEGER;

-- AlterTable
ALTER TABLE "recipe_ingredients" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(15,3);

-- AlterTable
ALTER TABLE "stock_adjustments" ADD COLUMN     "repair_invoice_id" INTEGER;

-- CreateTable
CREATE TABLE "repair_invoices" (
    "id" SERIAL NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "item_type" "ItemType",
    "production_item_id" INTEGER,
    "serial_number" VARCHAR(100),
    "item_id" INTEGER,
    "item_description" VARCHAR(255),
    "is_foc" BOOLEAN NOT NULL DEFAULT false,
    "repair_status" "RepairStatus" NOT NULL DEFAULT 'PENDING',
    "received_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repair_date" TIMESTAMP(6),
    "delivery_date" TIMESTAMP(6),
    "parts_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "service_charges" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "received_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "technician_notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "repair_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_invoice_items" (
    "id" SERIAL NOT NULL,
    "repair_invoice_id" INTEGER NOT NULL,
    "item_id" INTEGER,
    "description" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "total_price" DECIMAL(15,2) NOT NULL,
    "cost_price" DECIMAL(15,2),
    "is_bush" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "repair_invoices_invoice_number_key" ON "repair_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "repair_invoices_customer_id_idx" ON "repair_invoices"("customer_id");

-- CreateIndex
CREATE INDEX "repair_invoices_is_foc_idx" ON "repair_invoices"("is_foc");

-- CreateIndex
CREATE INDEX "repair_invoices_repair_status_idx" ON "repair_invoices"("repair_status");

-- CreateIndex
CREATE INDEX "repair_invoices_received_date_idx" ON "repair_invoices"("received_date");

-- CreateIndex
CREATE INDEX "repair_invoices_payment_status_idx" ON "repair_invoices"("payment_status");

-- CreateIndex
CREATE INDEX "repair_invoice_items_repair_invoice_id_idx" ON "repair_invoice_items"("repair_invoice_id");

-- CreateIndex
CREATE INDEX "repair_invoice_items_item_id_idx" ON "repair_invoice_items"("item_id");

-- CreateIndex
CREATE INDEX "expenses_category_id_idx" ON "expenses"("category_id");

-- CreateIndex
CREATE INDEX "expenses_account_id_idx" ON "expenses"("account_id");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date");

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_repair_invoice_id_fkey" FOREIGN KEY ("repair_invoice_id") REFERENCES "repair_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_repair_invoice_id_fkey" FOREIGN KEY ("repair_invoice_id") REFERENCES "repair_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_repair_invoice_id_fkey" FOREIGN KEY ("repair_invoice_id") REFERENCES "repair_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_invoices" ADD CONSTRAINT "repair_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_invoices" ADD CONSTRAINT "repair_invoices_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_invoices" ADD CONSTRAINT "repair_invoices_production_item_id_fkey" FOREIGN KEY ("production_item_id") REFERENCES "production_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_invoices" ADD CONSTRAINT "repair_invoices_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_invoice_items" ADD CONSTRAINT "repair_invoice_items_repair_invoice_id_fkey" FOREIGN KEY ("repair_invoice_id") REFERENCES "repair_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_invoice_items" ADD CONSTRAINT "repair_invoice_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
