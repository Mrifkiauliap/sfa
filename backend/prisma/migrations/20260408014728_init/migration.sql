/*
  Warnings:

  - You are about to drop the column `totalAmount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `TransactionItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `merchantId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethodId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TransactionItem" DROP CONSTRAINT "TransactionItem_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionItem" DROP CONSTRAINT "TransactionItem_transactionId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "totalAmount",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "merchantId" TEXT NOT NULL,
ADD COLUMN     "paymentMethodId" TEXT NOT NULL;

-- DropTable
DROP TABLE "TransactionItem";

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_name_key" ON "Merchant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_name_key" ON "PaymentMethod"("name");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
