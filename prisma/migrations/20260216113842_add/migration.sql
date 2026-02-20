-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('BANK', 'JAZZCASH', 'EASYPAISA', 'IN_HAND');

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "account_number" VARCHAR(50),
    "bank_name" VARCHAR(100),
    "opening_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);
