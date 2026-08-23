-- CreateTable
CREATE TABLE "ExpectedIncome" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedDate" TIMESTAMP(3),
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpectedIncome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpectedIncome_transactionId_key" ON "ExpectedIncome"("transactionId");

-- CreateIndex
CREATE INDEX "ExpectedIncome_userId_date_idx" ON "ExpectedIncome"("userId", "date");

-- AddForeignKey
ALTER TABLE "ExpectedIncome" ADD CONSTRAINT "ExpectedIncome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpectedIncome" ADD CONSTRAINT "ExpectedIncome_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
