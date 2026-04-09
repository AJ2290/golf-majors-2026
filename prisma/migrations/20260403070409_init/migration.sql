-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "espnId" TEXT,
    "deadline" DATETIME NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Golfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "espnId" TEXT NOT NULL,
    "region" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Pick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitorId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "golferId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pick_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pick_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pick_golferId_fkey" FOREIGN KEY ("golferId") REFERENCES "Golfer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GolferScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "golferId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "round1" INTEGER,
    "round2" INTEGER,
    "round3" INTEGER,
    "round4" INTEGER,
    "totalToPar" INTEGER,
    "position" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GolferScore_golferId_fkey" FOREIGN KEY ("golferId") REFERENCES "Golfer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GolferScore_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_name_key" ON "Competitor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_name_year_key" ON "Tournament"("name", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Golfer_espnId_key" ON "Golfer"("espnId");

-- CreateIndex
CREATE UNIQUE INDEX "Pick_competitorId_tournamentId_slot_key" ON "Pick"("competitorId", "tournamentId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "Pick_competitorId_tournamentId_golferId_key" ON "Pick"("competitorId", "tournamentId", "golferId");

-- CreateIndex
CREATE UNIQUE INDEX "GolferScore_golferId_tournamentId_key" ON "GolferScore"("golferId", "tournamentId");
