/*
  Warnings:

  - You are about to alter the column `quantity` on the `production_ingredients` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,3)` to `Decimal(15,2)`.

*/
-- AlterTable
ALTER TABLE "ledger_entries" ADD COLUMN     "receipt_id" INTEGER,
ADD COLUMN     "sale_invoice_id" INTEGER;

-- AlterTable
ALTER TABLE "production_ingredients" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(15,2);

-- CreateTable
CREATE TABLE "sale_invoices" (
    "id" SERIAL NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "invoice_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(6),
    "subtotal" DECIMAL(15,2) NOT NULL,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "received_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sale_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_invoice_items" (
    "id" SERIAL NOT NULL,
    "sale_invoice_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "production_item_id" INTEGER,
    "item_name" VARCHAR(255) NOT NULL,
    "serial_number" VARCHAR(100),
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "cost_price" DECIMAL(15,2) NOT NULL,
    "total_price" DECIMAL(15,2) NOT NULL,
    "profit" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" SERIAL NOT NULL,
    "receipt_number" VARCHAR(50) NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "receipt_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sale_invoice_id" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sale_invoices_invoice_number_key" ON "sale_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "sale_invoices_customer_id_idx" ON "sale_invoices"("customer_id");

-- CreateIndex
CREATE INDEX "sale_invoices_invoice_date_idx" ON "sale_invoices"("invoice_date");

-- CreateIndex
CREATE INDEX "sale_invoices_payment_status_idx" ON "sale_invoices"("payment_status");

-- CreateIndex
CREATE INDEX "sale_invoice_items_sale_invoice_id_idx" ON "sale_invoice_items"("sale_invoice_id");

-- CreateIndex
CREATE INDEX "sale_invoice_items_item_id_idx" ON "sale_invoice_items"("item_id");

-- CreateIndex
CREATE INDEX "sale_invoice_items_production_item_id_idx" ON "sale_invoice_items"("production_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");

-- CreateIndex
CREATE INDEX "receipts_customer_id_idx" ON "receipts"("customer_id");

-- CreateIndex
CREATE INDEX "receipts_account_id_idx" ON "receipts"("account_id");

-- CreateIndex
CREATE INDEX "receipts_receipt_date_idx" ON "receipts"("receipt_date");

-- CreateIndex
CREATE INDEX "ledger_entries_receipt_id_idx" ON "ledger_entries"("receipt_id");

-- CreateIndex
CREATE INDEX "production_items_is_sold_idx" ON "production_items"("is_sold");

-- AddForeignKey
ALTER TABLE "sale_invoices" ADD CONSTRAINT "sale_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_invoices" ADD CONSTRAINT "sale_invoices_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_invoice_items" ADD CONSTRAINT "sale_invoice_items_sale_invoice_id_fkey" FOREIGN KEY ("sale_invoice_id") REFERENCES "sale_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_invoice_items" ADD CONSTRAINT "sale_invoice_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_invoice_items" ADD CONSTRAINT "sale_invoice_items_production_item_id_fkey" FOREIGN KEY ("production_item_id") REFERENCES "production_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_sale_invoice_id_fkey" FOREIGN KEY ("sale_invoice_id") REFERENCES "sale_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_sale_invoice_id_fkey" FOREIGN KEY ("sale_invoice_id") REFERENCES "sale_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
