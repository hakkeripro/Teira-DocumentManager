import { Prisma, type DocumentType } from '@prisma/client';

export type CanonicalRow = Record<string, unknown> & {
  properties?: Record<string, unknown>;
};

export type CanonicalDocument = {
  version: number;
  updatedAt: string;
  docType: DocumentType;
  identityKeys: string[];
  header: Record<string, unknown>;
  rows: CanonicalRow[];
};

type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

export function readCanonical(settings: unknown): CanonicalDocument | null {
  if (!isRecord(settings)) return null;
  const c = settings['canonical'];
  if (!isRecord(c)) return null;

  const rows = c['rows'];
  const identityKeys = c['identityKeys'];
  const docType = c['docType'];

  if (!Array.isArray(rows) || !Array.isArray(identityKeys) || typeof docType !== 'string') return null;

  return {
    version: Number(c['version'] ?? 1),
    updatedAt: String(c['updatedAt'] ?? new Date().toISOString()),
    docType: docType as DocumentType,
    identityKeys: identityKeys.map((k) => String(k)),
    header: isRecord(c['header']) ? (c['header'] as Record<string, unknown>) : {},
    rows: rows.filter((r) => isRecord(r)).map((r) => r as CanonicalRow),
  };
}

/**
 * Serialize canonical doc to a Prisma JSON input value.
 *
 * Important: Prisma's InputJsonValue typing is intentionally strict.
 * We JSON-roundtrip to ensure the value is JSON-serializable and then cast.
 */
export function writeCanonical(doc: CanonicalDocument): Prisma.InputJsonValue {
  const payload = {
    canonical: {
      version: doc.version,
      updatedAt: doc.updatedAt,
      docType: doc.docType,
      identityKeys: doc.identityKeys,
      header: doc.header,
      rows: doc.rows,
    },
  };

  const json = JSON.parse(JSON.stringify(payload)) as unknown;
  return json as Prisma.InputJsonValue;
}

export function computeIdentity(row: Record<string, unknown>, identityKeys: string[]): string {
  return identityKeys.map((k) => String(row[k] ?? '')).join('|');
}

export function upsertByIdentity(args: {
  existingRows: Array<Record<string, unknown>>;
  incomingRows: Array<Record<string, unknown>>;
  identityKeys: string[];
}): { merged: Array<Record<string, unknown>>; created: number; updated: number } {
  const { existingRows, incomingRows, identityKeys } = args;
  const map = new Map<string, Record<string, unknown>>();
  for (const r of existingRows) {
    map.set(computeIdentity(r, identityKeys), r);
  }
  let created = 0;
  let updated = 0;
  for (const r of incomingRows) {
    const id = computeIdentity(r, identityKeys);
    const prev = map.get(id);
    if (!prev) {
      map.set(id, r);
      created++;
    } else {
      // Replace row; count as updated if different
      const same = JSON.stringify(prev) === JSON.stringify(r);
      map.set(id, r);
      if (!same) updated++;
    }
  }
  return { merged: Array.from(map.values()), created, updated };
}
