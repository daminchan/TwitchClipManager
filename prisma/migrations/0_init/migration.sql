-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "FavoriteStreamer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "streamerName" TEXT NOT NULL,
    "streamerLogin" TEXT NOT NULL,
    "streamerImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteStreamer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LikedClip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clipId" TEXT NOT NULL,
    "clipUrl" TEXT NOT NULL,
    "clipEmbedUrl" TEXT NOT NULL,
    "clipTitle" TEXT NOT NULL,
    "broadcasterId" TEXT NOT NULL,
    "broadcasterName" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "clipCreatedAt" TEXT NOT NULL,
    "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LikedClip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "FavoriteStreamer_userId_idx" ON "FavoriteStreamer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteStreamer_userId_streamerId_key" ON "FavoriteStreamer"("userId", "streamerId");

-- CreateIndex
CREATE INDEX "LikedClip_userId_idx" ON "LikedClip"("userId");

-- CreateIndex
CREATE INDEX "LikedClip_likedAt_idx" ON "LikedClip"("likedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LikedClip_userId_clipId_key" ON "LikedClip"("userId", "clipId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteStreamer" ADD CONSTRAINT "FavoriteStreamer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikedClip" ADD CONSTRAINT "LikedClip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

