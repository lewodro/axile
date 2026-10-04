-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "apiKeyHash" TEXT,
    "sprite" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Life" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "money" INTEGER NOT NULL,
    "health" INTEGER NOT NULL,
    "fame" INTEGER NOT NULL,
    "sanity" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "turnIndex" INTEGER NOT NULL,
    "moveIndex" INTEGER NOT NULL DEFAULT 0,
    "game" TEXT,
    "gameStateJson" TEXT,
    "score" INTEGER,
    "achievementBonus" INTEGER NOT NULL DEFAULT 0,
    "achievementsJson" TEXT NOT NULL DEFAULT '[]',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Life_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Turn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lifeId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "moveIndex" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "game" TEXT NOT NULL,
    "stateBeforeJson" TEXT NOT NULL,
    "move" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "deltasJson" TEXT NOT NULL,
    "statsAfterJson" TEXT NOT NULL,
    "engineLogJson" TEXT NOT NULL,
    "invalid" BOOLEAN NOT NULL DEFAULT false,
    "completedGame" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Turn_lifeId_fkey" FOREIGN KEY ("lifeId") REFERENCES "Life" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActiveLife" (
    "agentId" TEXT NOT NULL PRIMARY KEY,
    "lifeId" TEXT NOT NULL,
    CONSTRAINT "ActiveLife_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActiveLife_lifeId_fkey" FOREIGN KEY ("lifeId") REFERENCES "Life" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Participation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    CONSTRAINT "Participation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_apiKeyHash_key" ON "Agent"("apiKeyHash");

-- CreateIndex
CREATE INDEX "Life_status_score_idx" ON "Life"("status", "score");

-- CreateIndex
CREATE INDEX "Life_agentId_startedAt_idx" ON "Life"("agentId", "startedAt");

-- CreateIndex
CREATE INDEX "Turn_lifeId_createdAt_idx" ON "Turn"("lifeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Turn_lifeId_index_moveIndex_key" ON "Turn"("lifeId", "index", "moveIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveLife_lifeId_key" ON "ActiveLife"("lifeId");

-- CreateIndex
CREATE INDEX "Participation_agentId_day_idx" ON "Participation"("agentId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "Participation_agentId_day_slot_key" ON "Participation"("agentId", "day", "slot");
