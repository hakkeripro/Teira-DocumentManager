import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireActorApi } from '@/lib/actorApi';
import { assertWrite } from '@/lib/permissions';
import { type CanonicalRow, deriveWiringV2View, mergeWiringV2State } from '@/lib/wiringEditorV2';

type JsonRecord = Record<string, unknown>;

function isRecord(v: unknown): v is JsonRecord {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function getCanonicalRows(settings: unknown): CanonicalRow[] {
  if (!isRecord(settings)) return [];
  const canonical = settings['canonical'];
  if (!isRecord(canonical)) return [];
  const rows = canonical['rows'];
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r): r is JsonRecord => isRecord(r))
    .map((r) => r as CanonicalRow);
}

function setCanonicalRows(settings: unknown, rows: CanonicalRow[]): Prisma.InputJsonValue {
  const base: JsonRecord = isRecord(settings) ? settings : {};
  const canonical: JsonRecord = isRecord(base['canonical']) ? (base['canonical'] as JsonRecord) : {};
  const merged: JsonRecord = {
    ...base,
    canonical: {
      ...canonical,
      rows,
    },
  };
  // Normalize to JSON-serializable value for Prisma json field.
  const json = JSON.parse(JSON.stringify(merged)) as unknown;
  return json as Prisma.InputJsonValue;
}


export async function GET(req: Request) {
  const actor = await requireActorApi();

  const url = new URL(req.url);
  const projectId = String(url.searchParams.get('projectId') ?? '');
  const subCenterId = String(url.searchParams.get('subCenterId') ?? '');
  if (!projectId || !subCenterId) {
    return new NextResponse('Missing projectId/subCenterId', { status: 400 });
  }

  const doc = await db.document.findFirst({
    where: { companyId: actor.companyId, projectId, subCenterId, type: 'WIRING_DIAGRAMS' },
  });
  if (!doc) return new NextResponse('Document not found', { status: 404 });

  const rows = getCanonicalRows(doc.settings);
  return NextResponse.json({ ok: true, rows });
}

export async function PUT(req: Request) {
  const actor = await requireActorApi();
  assertWrite(actor.role);

  const raw: unknown = await req.json().catch(() => ({}));
  const body = isRecord(raw) ? raw : {};
  const projectId = String(body['projectId'] ?? '');
  const subCenterId = String(body['subCenterId'] ?? '');
  const rowsRaw = body['rows'];
  const patchesRaw = body['patches'];

  if (!projectId || !subCenterId) {
    return new NextResponse('Missing projectId/subCenterId', { status: 400 });
  }
  const hasRows = Array.isArray(rowsRaw);
  const hasPatches = Array.isArray(patchesRaw);
  if (!hasRows && !hasPatches) {
    return new NextResponse('Missing rows or patches', { status: 400 });
  }

  const doc = await db.document.findFirst({
    where: { companyId: actor.companyId, projectId, subCenterId, type: 'WIRING_DIAGRAMS' },
  });
  if (!doc) return new NextResponse('Document not found', { status: 404 });

  const prevRows = getCanonicalRows(doc.settings);

  let nextRows: CanonicalRow[] = prevRows.map((r) => ({ ...r }));

  if (Array.isArray(rowsRaw)) {
    nextRows = rowsRaw
      .filter((r): r is JsonRecord => isRecord(r))
      .map((r) => ({ ...r } as CanonicalRow));
  } else if (Array.isArray(patchesRaw)) {
    for (const p of patchesRaw) {
      if (!isRecord(p)) continue;
      const rowIndex = Number(p['rowIndex']);
      const field = String(p['field'] ?? '');
      const value = p['value'];
      if (!Number.isFinite(rowIndex) || rowIndex < 0) continue;
      if (!field) continue;
      while (nextRows.length <= rowIndex) nextRows.push({});
      nextRows[rowIndex] = { ...(nextRows[rowIndex] ?? {}), [field]: value };
    }
  }

  const nextSettings = setCanonicalRows(doc.settings, nextRows);

  const updated = await db.document.update({
    where: { id: doc.id },
    data: { settings: nextSettings },
  });

  // Ensure v2 view stays deterministic after workbook changes.
  const canonicalRows = getCanonicalRows(updated.settings);
  const derived = deriveWiringV2View({
    settings: updated.settings,
    canonicalRows,
    centerAutomationServerType: null,
  });

  // Persist derived v2 view into settings (so client refresh is cheap), without overriding user terminal edits.
  const updated2 = await db.document.update({
    where: { id: doc.id },
    data: {
      settings: mergeWiringV2State({
        settings: updated.settings,
        patch: { upsertPages: derived.pages, pageOrder: derived.pageOrder, automationServerType: derived.automationServerType ?? null },
      }),
    },
  });

  const canonicalRows2 = getCanonicalRows(updated2.settings);
  const derived2 = deriveWiringV2View({
    settings: updated2.settings,
    canonicalRows: canonicalRows2,
    centerAutomationServerType: null,
  });

  return NextResponse.json({ ok: true, state: derived2, canonicalRows: canonicalRows2 });
}