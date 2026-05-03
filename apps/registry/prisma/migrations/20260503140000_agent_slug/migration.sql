PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '0.0.1',
    "author" TEXT NOT NULL DEFAULT 'unknown',
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "readme" TEXT,
    "packageJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_Agent" ("id", "slug", "name", "description", "version", "author", "downloads", "tags", "readme", "packageJson", "createdAt")
SELECT
  "id",
  lower(replace(replace(trim("name"), ' ', '-'), '_', '-')),
  "name",
  "description",
  "version",
  "author",
  "downloads",
  "tags",
  "readme",
  "packageJson",
  "createdAt"
FROM "Agent";

CREATE TABLE "new_AgentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "changelog" TEXT,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "new_AgentVersion_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "new_Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_AgentVersion" ("id", "agentId", "version", "code", "changelog", "publishedAt")
SELECT "id", "agentId", "version", "code", "changelog", "publishedAt" FROM "AgentVersion";

DROP TABLE "AgentVersion";
DROP TABLE "Agent";
ALTER TABLE "new_Agent" RENAME TO "Agent";
ALTER TABLE "new_AgentVersion" RENAME TO "AgentVersion";

CREATE UNIQUE INDEX "Agent_slug_key" ON "Agent"("slug");
CREATE UNIQUE INDEX "AgentVersion_agentId_version_key" ON "AgentVersion"("agentId", "version");

PRAGMA foreign_keys=ON;
