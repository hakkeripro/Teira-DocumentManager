import { NextResponse } from 'next/server';
import type { DocumentType } from '@prisma/client';
import { requireActorApi } from '@/lib/actorApi';
import { db } from '@/lib/db';
import { loadMappingSpecFromRepo } from '@/lib/mapping/loadSpec';
import { findTarget } from '@/lib/mapping/engine';
import { readCanonical } from '@/lib/canonical';
import { exportCanonicalToXml } from '@/lib/mapping/export';
import { readWiringEditorState, extractTerminalCode, injectPointPi } from '@/lib/wiringEditor';

function toError(e: unknown): { status: number; message: string } {
  if (e && typeof e === 'object') {
    const status = (e as Record<string, unknown>)['statusCode'];
    const msg = (e as Record<string, unknown>)['message'];
    if (typeof status === 'number' && typeof msg === 'string') return { status, message: msg };
  }
  if (e instanceof Error) return { status: 500, message: e.message };
  return { status: 500, message: 'Error' };
}

function safeFileName(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function applyEditor(args: {
  rows: Array<Record<string, unknown>>;
  moduleOrder: string[];
  symbols: Record<string, { type: string; label?: string }>;
}): Array<Record<string, unknown>> {
  const { rows, moduleOrder, symbols } = args;

  const orderIndex = new Map<string, number>();
  moduleOrder.forEach((m, idx) => orderIndex.set(m, idx));

  const asNum = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const decorated = rows.map((r, idx) => {
    const moduleName = String(r['module_name'] ?? '');
    const mi = orderIndex.has(moduleName) ? (orderIndex.get(moduleName) as number) : 1e9;

    const term = extractTerminalCode(r);
    let out = r;
    const sym = term ? symbols[term] : undefined;
    if (term && sym) {
      out = injectPointPi(out, {
        TerminalCode: term,
        SymbolType: sym.type,
        SymbolLabel: sym.label ?? '',
      });
    }

    const inCh = asNum(r['input_channel_number']);
    const outCh = asNum(r['output_channel_number']);
    const chanKind = inCh != null ? 0 : outCh != null ? 1 : 2;
    const chanNo = inCh != null ? inCh : outCh != null ? outCh : 1e9;

    return {
      idx,
      moduleName,
      mi,
      chanKind,
      chanNo,
      pointName: String(r['point_name'] ?? ''),
      row: out,
    };
  });

  decorated.sort((a, b) => {
    if (a.mi !== b.mi) return a.mi - b.mi;
    if (a.moduleName !== b.moduleName) return a.moduleName.localeCompare(b.moduleName);
    if (a.chanKind !== b.chanKind) return a.chanKind - b.chanKind;
    if (a.chanNo !== b.chanNo) return a.chanNo - b.chanNo;
    if (a.pointName !== b.pointName) return a.pointName.localeCompare(b.pointName);
    return a.idx - b.idx;
  });

  return decorated.map((d) => d.row);
}

export async function GET(req: Request) {
  try {
    const actor = await requireActorApi();
    const { searchParams } = new URL(req.url);
    const projectId = String(searchParams.get('projectId') ?? '');
    const subCenterId = String(searchParams.get('subCenterId') ?? '');

    if (!projectId || !subCenterId) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    const project = await db.project.findFirst({ where: { id: projectId, companyId: actor.companyId } });
    if (!project) return new NextResponse('Project not found', { status: 404 });

    const center = await db.subCenter.findFirst({ where: { id: subCenterId, projectId, companyId: actor.companyId } });
    if (!center) return new NextResponse('Center not found', { status: 404 });

    const spec = await loadMappingSpecFromRepo();
    const target = findTarget(spec, 'WIRING_DIAGRAMS');
    if (!target) return new NextResponse('Unknown docType', { status: 400 });

    const doc = await db.document.findFirst({
      where: { companyId: actor.companyId, projectId, subCenterId, type: 'WIRING_DIAGRAMS' as DocumentType },
    });

    const canon = doc?.settings ? readCanonical(doc.settings) : null;
    const editor = readWiringEditorState(doc?.settings ?? null);

    const rows = applyEditor({ rows: canon?.rows ?? [], moduleOrder: editor.moduleOrder, symbols: editor.symbols });

    const xml = exportCanonicalToXml({
      spec,
      target,
      context: { projectCode: project.code, centerCode: center.code ?? 'CENTER' },
      rows,
    });

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const base = safeFileName(`WIRING_DIAGRAMS-${project.code}-${center.code ?? 'CENTER'}-${ts}`);

    return new NextResponse(xml, {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'content-disposition': `attachment; filename="${base}.xml"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e: unknown) {
    const { status, message } = toError(e);
    return new NextResponse(message, { status });
  }
}
