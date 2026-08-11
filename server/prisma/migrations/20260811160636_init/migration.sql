-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Feed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "siteUrl" TEXT,
    "title" TEXT NOT NULL,
    "customTitle" TEXT,
    "faviconUrl" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastFetchedAt" DATETIME,
    "lastError" TEXT
);

-- CreateTable
CREATE TABLE "FeedFolder" (
    "feedId" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,

    PRIMARY KEY ("feedId", "folderId"),
    CONSTRAINT "FeedFolder_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedFolder_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedId" TEXT NOT NULL,
    "guid" TEXT NOT NULL,
    "url" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "contentHtml" TEXT,
    "summary" TEXT,
    "publishedAt" DATETIME NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Item_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemState" (
    "itemId" TEXT NOT NULL PRIMARY KEY,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "isLiked" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItemState_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Folder_name_key" ON "Folder"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Feed_url_key" ON "Feed"("url");

-- CreateIndex
CREATE INDEX "Item_publishedAt_idx" ON "Item"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Item_feedId_guid_key" ON "Item"("feedId", "guid");

-- CreateIndex
CREATE INDEX "ItemState_isRead_idx" ON "ItemState"("isRead");

-- CreateIndex
CREATE INDEX "ItemState_isStarred_idx" ON "ItemState"("isStarred");

-- CreateIndex
CREATE INDEX "ItemState_isShared_idx" ON "ItemState"("isShared");
