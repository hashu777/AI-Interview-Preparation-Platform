CREATE TABLE "InterviewEvaluation" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "technicalAccuracy" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "completeness" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "problemSolving" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "detailedFeedback" TEXT NOT NULL,
    "idealAnswer" TEXT NOT NULL,
    "suggestions" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InterviewEvaluation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InterviewEvaluation_sessionId_key" ON "InterviewEvaluation"("sessionId");
ALTER TABLE "InterviewEvaluation" ADD CONSTRAINT "InterviewEvaluation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
