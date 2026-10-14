CREATE TABLE "TalkPage" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalkPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TalkItem" (
    "id" SERIAL NOT NULL,
    "talkPageId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalkItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TalkPage_accessToken_key" ON "TalkPage"("accessToken");
CREATE INDEX "TalkPage_slug_accessToken_idx" ON "TalkPage"("slug", "accessToken");
CREATE INDEX "TalkItem_talkPageId_type_order_idx" ON "TalkItem"("talkPageId", "type", "order");

ALTER TABLE "TalkItem" ADD CONSTRAINT "TalkItem_talkPageId_fkey" FOREIGN KEY ("talkPageId") REFERENCES "TalkPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
