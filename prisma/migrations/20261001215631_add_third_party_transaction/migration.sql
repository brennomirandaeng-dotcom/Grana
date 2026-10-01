-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "isThirdParty" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "thirdPartyName" TEXT;
