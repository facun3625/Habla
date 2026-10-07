-- Existing publications remain in Blog and keep using the visual editor.
ALTER TABLE "Post"
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'BLOG',
ADD COLUMN "contentFormat" TEXT NOT NULL DEFAULT 'RICH_TEXT';
