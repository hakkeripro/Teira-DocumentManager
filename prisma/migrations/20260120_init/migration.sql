-- Sprint 1 init schema (Prisma)

-- Enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DESIGNER', 'VIEWER');
CREATE TYPE "DocumentType" AS ENUM ('WIRING_DIAGRAMS', 'TEST_LIST', 'DEVICE_LIST', 'PULL_LIST');
CREATE TYPE "AssetType" AS ENUM ('PDF', 'JSON_SNAPSHOT', 'XML_EXPORT');

-- Tables
CREATE TABLE "company" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_user" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "auth_user_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "role" "Role" NOT NULL DEFAULT 'VIEWER',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_user_auth_user_id_key" ON "app_user"("auth_user_id");
CREATE INDEX "app_user_company_id_idx" ON "app_user"("company_id");

CREATE TABLE "area" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "area_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "area_company_id_idx" ON "area"("company_id");

CREATE TABLE "project" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "area_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_company_id_code_key" ON "project"("company_id", "code");
CREATE INDEX "project_company_id_area_id_idx" ON "project"("company_id", "area_id");

CREATE TABLE "document" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "type" "DocumentType" NOT NULL,
  "title" TEXT,
  "settings_jsonb" JSONB,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_project_id_type_key" ON "document"("project_id", "type");
CREATE INDEX "document_company_id_project_id_idx" ON "document"("company_id", "project_id");

CREATE TABLE "document_revision" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "document_id" TEXT NOT NULL,
  "rev_index" INTEGER NOT NULL,
  "rev_letter" TEXT NOT NULL,
  "change_note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by_user_id" TEXT,
  CONSTRAINT "document_revision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_revision_document_id_rev_index_key" ON "document_revision"("document_id", "rev_index");
CREATE INDEX "document_revision_company_id_document_id_idx" ON "document_revision"("company_id", "document_id");

CREATE TABLE "document_revision_asset" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "document_revision_id" TEXT NOT NULL,
  "asset_type" "AssetType" NOT NULL,
  "storage_provider" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_revision_asset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_revision_asset_company_id_document_revision_id_idx" ON "document_revision_asset"("company_id", "document_revision_id");

-- Foreign keys
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "area" ADD CONSTRAINT "area_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "project" ADD CONSTRAINT "project_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project" ADD CONSTRAINT "project_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "document" ADD CONSTRAINT "document_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document" ADD CONSTRAINT "document_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "document_revision" ADD CONSTRAINT "document_revision_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_revision" ADD CONSTRAINT "document_revision_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_revision" ADD CONSTRAINT "document_revision_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "document_revision_asset" ADD CONSTRAINT "document_revision_asset_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_revision_asset" ADD CONSTRAINT "document_revision_asset_document_revision_id_fkey" FOREIGN KEY ("document_revision_id") REFERENCES "document_revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
