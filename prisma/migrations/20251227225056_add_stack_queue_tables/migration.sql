-- CreateTable
CREATE TABLE "PlaylistActionHistory" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "timeStamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "songId" TEXT,
    "fromPosition" INTEGER,
    "toPosition" INTEGER,
    "previousValue" TEXT,
    "newValue" TEXT,
    "isUndone" BOOLEAN NOT NULL DEFAULT false,
    "stackOrder" SERIAL NOT NULL,

    CONSTRAINT "PlaylistActionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQueueSong" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedById" TEXT,

    CONSTRAINT "UserQueueSong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQueueState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentSongId" TEXT,
    "repeatMode" TEXT NOT NULL DEFAULT 'NONE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQueueState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQueueHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserQueueHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaylistActionHistory_playlistId_isUndone_idx" ON "PlaylistActionHistory"("playlistId", "isUndone");

-- CreateIndex
CREATE INDEX "PlaylistActionHistory_playlistId_stackOrder_idx" ON "PlaylistActionHistory"("playlistId", "stackOrder");

-- CreateIndex
CREATE INDEX "UserQueueSong_userId_position_idx" ON "UserQueueSong"("userId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "UserQueueSong_userId_songId_position_key" ON "UserQueueSong"("userId", "songId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "UserQueueState_userId_key" ON "UserQueueState"("userId");

-- CreateIndex
CREATE INDEX "UserQueueHistory_userId_playedAt_idx" ON "UserQueueHistory"("userId", "playedAt");

-- AddForeignKey
ALTER TABLE "UserQueueSong" ADD CONSTRAINT "UserQueueSong_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQueueSong" ADD CONSTRAINT "UserQueueSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQueueSong" ADD CONSTRAINT "UserQueueSong_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQueueState" ADD CONSTRAINT "UserQueueState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQueueState" ADD CONSTRAINT "UserQueueState_currentSongId_fkey" FOREIGN KEY ("currentSongId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQueueHistory" ADD CONSTRAINT "UserQueueHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQueueHistory" ADD CONSTRAINT "UserQueueHistory_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
