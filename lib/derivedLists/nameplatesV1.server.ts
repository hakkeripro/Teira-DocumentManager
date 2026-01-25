import { Prisma, type DocumentType } from '@prisma/client';
import { readWiringV2State } from '@/lib/wiringEditorV2';
import { type CanonicalDocument, writeCanonical } from '@/lib/canonical';
import {
  type NameplateRow,
  type NameplateV1State,
  buildNameplateV1View,
  normalizeTag,
} from '@/lib/derivedLists/nameplatesV1';

type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function parseDeviceText(text: string): { tag: string; description: string } | null {
  const lines = asString(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return null;
  const tag = normalizeTag(lines[0]);
  if (!tag) return null;
  const description = lines.slice(1).join(' ').trim();
  return { tag, description };
}

export function deriveNameplateBaseRowsFromWiringV2(args: { wiringSettings: unknown }): NameplateRow[] {
  const state = readWiringV2State(args.wiringSettings);
  const rows: NameplateRow[] = [];
  for (const r of Object.values(state.terminals)) {
    const dt = typeof r.deviceText === 'string' ? r.deviceText : '';
    const parsed = parseDeviceText(dt);
    if (!parsed) continue;
    rows.push({ tag: parsed.tag, description: parsed.description });
  }
  return rows;
}

export function mergeNameplateListV1Settings(args: {
  existingSettings: unknown;
  state: NameplateV1State;
  mergedRows: NameplateRow[];
  header?: Record<string, unknown>;
}): Prisma.InputJsonValue {
  const base: AnyRecord = isRecord(args.existingSettings) ? (args.existingSettings as AnyRecord) : {};
  const derivedLists: AnyRecord = isRecord(base['derivedLists']) ? (base['derivedLists'] as AnyRecord) : {};

  const canonical: CanonicalDocument = {
    version: 1,
    updatedAt: new Date().toISOString(),
    docType: 'NAMEPLATE_LIST' as DocumentType,
    identityKeys: ['tag'],
    header: args.header ?? {},
    rows: args.mergedRows.map((r) => ({ tag: r.tag, description: r.description })),
  };

  const canonJson = writeCanonical(canonical) as unknown as AnyRecord;

  const merged: AnyRecord = {
    ...base,
    ...canonJson,
    derivedLists: {
      ...derivedLists,
      nameplatesV1: {
        version: 1,
        updatedAt: new Date().toISOString(),
        overrides: args.state.overrides,
        manualRows: args.state.manualRows,
      },
    },
  };

  const json = JSON.parse(JSON.stringify(merged)) as unknown;
  return json as Prisma.InputJsonValue;
}

export function buildNameplateMergedRows(args: {
  baseRows: NameplateRow[];
  state: NameplateV1State;
}): { mergedRows: NameplateRow[]; excludedDerived: NameplateRow[] } {
  const view = buildNameplateV1View({ baseRows: args.baseRows, state: args.state });
  return {
    mergedRows: view.rows.map((r) => ({ tag: r.tag, description: r.description })),
    excludedDerived: view.excludedDerived,
  };
}
