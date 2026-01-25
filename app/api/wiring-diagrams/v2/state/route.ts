import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireActorApi } from '@/lib/actorApi';
import { assertWrite } from '@/lib/permissions';
import { type CanonicalRow, deriveWiringV2View, mergeWiringV2State, type WiringV2Patch } from '@/lib/wiringEditorV2';

type JsonRecord = Record<string, unknown>;

function isRecord(v: unknown): v is JsonRecord {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function sameArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function getCanonicalRows(settings: unknown): CanonicalRow[] {
  if (!isRecord(settings)) return [];
  const canonical = settings['canonical'];
  if (!isRecord(canonical)) return [];
  const rows = canonical['rows'];
  if (!Array.isArray(rows)) return [];
  // CanonicalRow = Record<string, unknown>, so all object-like values are acceptable.
  return rows
    .filter((r): r is JsonRecord => isRecord(r))
    .map((r) => r as CanonicalRow);
}

function getV2OrderFromSettings(settings: unknown): string[] {
  if (!isRecord(settings)) return [];
  const editor = settings['editor'];
  if (!isRecord(editor)) return [];
  const v2 = editor['WIRING_DIAGRAMS_V2'];
  if (!isRecord(v2)) return [];
  const order = v2['pageOrder'];
  if (!Array.isArray(order)) return [];
  return order.map((x) => String(x));
}

export async function PUT(req: Request) {
  const actor = await requireActorApi();
  assertWrite(actor.role);

  const raw: unknown = await req.json().catch(() => ({}));
  const body = isRecord(raw) ? raw : {};
  const projectId = String(body['projectId'] ?? '');
  const subCenterId = String(body['subCenterId'] ?? '');
  const patchRaw = body['patch'];

  if (!projectId || !subCenterId) {
    return new NextResponse('Missing projectId/subCenterId', { status: 400 });
  }

  // Best-effort structural cast: we validate inside mergeWiringV2State/deriveWiringV2View.
  const patch = (isRecord(patchRaw) ? (patchRaw as unknown) : {}) as WiringV2Patch;

  const doc = await db.document.findFirst({
    where: {
      companyId: actor.companyId,
      projectId,
      subCenterId,
      type: 'WIRING_DIAGRAMS',
    },
  });
  if (!doc) return new NextResponse('Document not found', { status: 404 });

  // Apply patch to document.settings
  const nextSettings = mergeWiringV2State({
    settings: doc.settings,
    patch,
  });

  const updated = await db.document.update({
    where: { id: doc.id },
    data: { settings: nextSettings },
  });

  // Derive view (ensures pages exist deterministically). Preserve user-reordered pageOrder if present.
  const canonicalRows = getCanonicalRows(updated.settings);
  const storedOrder = getV2OrderFromSettings(updated.settings);

  const derived = deriveWiringV2View({
    settings: updated.settings,
    canonicalRows,
    centerAutomationServerType: null,
  });

  if (storedOrder.length > 0 && !sameArray(derived.pageOrder, storedOrder)) {
    const updated2 = await db.document.update({
      where: { id: doc.id },
      data: {
        settings: mergeWiringV2State({
          settings: updated.settings,
          patch: { pageOrder: storedOrder },
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

  return NextResponse.json({ ok: true, state: derived, canonicalRows });
}
