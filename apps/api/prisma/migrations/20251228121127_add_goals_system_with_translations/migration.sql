-- CreateTable
CREATE TABLE "GoalTemplate" (
    "id" SERIAL NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "periodType" TEXT NOT NULL,
    "sportType" TEXT,
    "category" TEXT NOT NULL,
    "isPreset" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalTemplateTranslation" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalTemplateTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetType" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "periodType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "templateId" INTEGER,
    "sportType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalTemplate_category_idx" ON "GoalTemplate"("category");

-- CreateIndex
CREATE INDEX "GoalTemplateTranslation_locale_idx" ON "GoalTemplateTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "GoalTemplateTranslation_templateId_locale_key" ON "GoalTemplateTranslation"("templateId", "locale");

-- CreateIndex
CREATE INDEX "Goal_userId_status_idx" ON "Goal"("userId", "status");

-- CreateIndex
CREATE INDEX "Goal_userId_endDate_idx" ON "Goal"("userId", "endDate");

-- CreateIndex
CREATE INDEX "Goal_templateId_idx" ON "Goal"("templateId");

-- AddForeignKey
ALTER TABLE "GoalTemplateTranslation" ADD CONSTRAINT "GoalTemplateTranslation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GoalTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GoalTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
