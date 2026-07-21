CREATE TYPE "InterviewCompany" AS ENUM ('GOOGLE', 'AMAZON', 'MICROSOFT', 'INFOSYS', 'TCS', 'ACCENTURE');

ALTER TABLE "InterviewSession" ADD COLUMN "company" "InterviewCompany";

CREATE INDEX "InterviewSession_userId_company_status_idx" ON "InterviewSession"("userId", "company", "status");
