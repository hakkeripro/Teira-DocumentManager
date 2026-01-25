-- Sprint 2: Centers/SubCenters + Import audit + document scope update

-- Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE "ImportSource" AS ENUM ('XML', 'XLSX');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ImportIssueSeverity" AS ENUM ('WARN', 'ERROR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE "AssetType" ADD VALUE IF NOT EXISTS 'XLSX_EXPORT';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sub-centers (centers)
CREATE TABLE IF NOT EXISTS "sub_center" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sub_center_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sub_center_company_id_project_id_idx" ON "sub_center"("company_id", "project_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sub_center_project_id_code_key" ON "sub_center"("project_id", "code");

ALTER TABLE "sub_center" ADD CONSTRAINT "sub_center_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sub_center" ADD CONSTRAINT "sub_center_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Default/Main center for existing projects (idempotent)
INSERT INTO "sub_center" ("id", "company_id", "project_id", "name", "code", "sort_order")
SELECT
  'sc_' || md5(random()::text || clock_timestamp()::text),
  p.company_id,
  p.id,
  'Main',
  'MAIN',
  0
FROM "project" p
WHERE NOT EXISTS (
  SELECT 1 FROM "sub_center" sc WHERE sc.project_id = p.id
);

-- Documents become center-scoped
ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "sub_center_id" TEXT;

-- Fill with MAIN center if possible
UPDATE "document" d
SET "sub_center_id" = sc.id
FROM "sub_center" sc
WHERE sc.project_id = d.project_id
  AND sc.code = 'MAIN'
  AND d.sub_center_id IS NULL;

-- Fallback: any center per project
UPDATE "document" d
SET "sub_center_id" = sc_any.id
FROM (
  SELECT project_id, min(id) as id
  FROM "sub_center"
  GROUP BY project_id
) sc_any
WHERE sc_any.project_id = d.project_id
  AND d.sub_center_id IS NULL;

ALTER TABLE "document" ALTER COLUMN "sub_center_id" SET NOT NULL;

DROP INDEX IF EXISTS "document_project_id_type_key";
CREATE UNIQUE INDEX IF NOT EXISTS "document_sub_center_id_type_key" ON "document"("sub_center_id", "type");
CREATE INDEX IF NOT EXISTS "document_company_id_project_id_sub_center_id_idx" ON "document"("company_id", "project_id", "sub_center_id");

ALTER TABLE "document" ADD CONSTRAINT "document_sub_center_id_fkey"
  FOREIGN KEY ("sub_center_id") REFERENCES "sub_center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Import audit
CREATE TABLE IF NOT EXISTS "import_job" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "sub_center_id" TEXT NOT NULL,
  "source" "ImportSource" NOT NULL,
  "filename" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by_user_id" TEXT,
  "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
  "summary_jsonb" JSONB,
  CONSTRAINT "import_job_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "import_job_company_id_project_id_sub_center_id_created_at_idx"
  ON "import_job"("company_id", "project_id", "sub_center_id", "created_at");

ALTER TABLE "import_job" ADD CONSTRAINT "import_job_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "import_job" ADD CONSTRAINT "import_job_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "import_job" ADD CONSTRAINT "import_job_sub_center_id_fkey"
  FOREIGN KEY ("sub_center_id") REFERENCES "sub_center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "import_job" ADD CONSTRAINT "import_job_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "import_issue" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "import_job_id" TEXT NOT NULL,
  "severity" "ImportIssueSeverity" NOT NULL,
  "message" TEXT NOT NULL,
  "path" TEXT,
  CONSTRAINT "import_issue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "import_issue_company_id_import_job_id_idx"
  ON "import_issue"("company_id", "import_job_id");

ALTER TABLE "import_issue" ADD CONSTRAINT "import_issue_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "import_issue" ADD CONSTRAINT "import_issue_import_job_id_fkey"
  FOREIGN KEY ("import_job_id") REFERENCES "import_job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
