-- Ensure DocumentType enum exists and contains NAMEPLATE_LIST.
--
-- Rationale:
-- - The repo may be bootstrapped either via existing SQL (e.g. Supabase) or via Prisma.
-- - We avoid `ALTER TYPE ... ADD VALUE IF NOT EXISTS` because the `IF NOT EXISTS`
--   syntax for enum values is not supported in all PostgreSQL versions.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'DocumentType'
  ) THEN
    CREATE TYPE "DocumentType" AS ENUM (
      'WIRING_DIAGRAMS',
      'DEVICE_LIST',
      'PULL_LIST',
      'TEST_LIST',
      'NAMEPLATE_LIST'
    );
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'DocumentType'
        AND e.enumlabel = 'NAMEPLATE_LIST'
    ) THEN
      ALTER TYPE "DocumentType" ADD VALUE 'NAMEPLATE_LIST';
    END IF;
  END IF;
END $$;
