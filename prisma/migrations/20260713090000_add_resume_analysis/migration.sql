CREATE TABLE "ResumeAnalysis" (
    "id" UUID NOT NULL,
    "resumeVersionId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "strengths" TEXT[] NOT NULL,
    "improvements" TEXT[] NOT NULL,
    "matchedKeywords" TEXT[] NOT NULL,
    "missingKeywords" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResumeAnalysis_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ResumeAnalysis_resumeVersionId_key" ON "ResumeAnalysis"("resumeVersionId");
ALTER TABLE "ResumeAnalysis" ADD CONSTRAINT "ResumeAnalysis_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
