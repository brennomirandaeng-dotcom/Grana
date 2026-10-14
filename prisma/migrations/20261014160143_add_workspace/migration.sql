-- DropIndex
DROP INDEX "ExpectedIncome_userId_date_idx";

-- DropIndex
DROP INDEX "NetWorthSnapshot_userId_date_key";

-- DropIndex
DROP INDEX "Transaction_userId_date_idx";

-- DropIndex
DROP INDEX "Transaction_userId_type_idx";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "CreditCard" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "ExpectedIncome" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "InstallmentPurchase" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "InvoicePayment" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "Liability" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "NetWorthSnapshot" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "RecurringTransaction" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "workspace" TEXT NOT NULL DEFAULT 'PESSOAL';

-- CreateIndex
CREATE INDEX "Account_userId_workspace_idx" ON "Account"("userId", "workspace");

-- CreateIndex
CREATE INDEX "Asset_userId_workspace_idx" ON "Asset"("userId", "workspace");

-- CreateIndex
CREATE INDEX "Budget_userId_workspace_month_idx" ON "Budget"("userId", "workspace", "month");

-- CreateIndex
CREATE INDEX "Category_userId_workspace_idx" ON "Category"("userId", "workspace");

-- CreateIndex
CREATE INDEX "CreditCard_userId_workspace_idx" ON "CreditCard"("userId", "workspace");

-- CreateIndex
CREATE INDEX "ExpectedIncome_userId_workspace_date_idx" ON "ExpectedIncome"("userId", "workspace", "date");

-- CreateIndex
CREATE INDEX "Goal_userId_workspace_idx" ON "Goal"("userId", "workspace");

-- CreateIndex
CREATE INDEX "Investment_userId_workspace_idx" ON "Investment"("userId", "workspace");

-- CreateIndex
CREATE INDEX "Liability_userId_workspace_idx" ON "Liability"("userId", "workspace");

-- CreateIndex
CREATE UNIQUE INDEX "NetWorthSnapshot_userId_workspace_date_key" ON "NetWorthSnapshot"("userId", "workspace", "date");

-- CreateIndex
CREATE INDEX "RecurringTransaction_userId_workspace_idx" ON "RecurringTransaction"("userId", "workspace");

-- CreateIndex
CREATE INDEX "Transaction_userId_workspace_date_idx" ON "Transaction"("userId", "workspace", "date");

-- CreateIndex
CREATE INDEX "Transaction_userId_workspace_type_idx" ON "Transaction"("userId", "workspace", "type");

