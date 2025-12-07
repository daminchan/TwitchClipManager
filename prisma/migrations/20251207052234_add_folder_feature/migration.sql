-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FolderStreamer" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "streamerName" TEXT NOT NULL,
    "streamerLogin" TEXT NOT NULL,
    "streamerImage" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolderStreamer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Folder_userId_idx" ON "Folder"("userId");

-- CreateIndex
CREATE INDEX "Folder_userId_order_idx" ON "Folder"("userId", "order");

-- CreateIndex
CREATE INDEX "FolderStreamer_folderId_idx" ON "FolderStreamer"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "FolderStreamer_folderId_streamerId_key" ON "FolderStreamer"("folderId", "streamerId");

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FolderStreamer" ADD CONSTRAINT "FolderStreamer_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
