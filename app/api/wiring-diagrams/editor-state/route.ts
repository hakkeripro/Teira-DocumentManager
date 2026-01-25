import { NextResponse } from 'next/server';
import type { DocumentType } from '@prisma/client';
import { requireActorApi } from '@/lib/actorApi';
import { db } from '@/lib/db';
import { assertWrite } from '@/lib/permissions';
import { readWiringEditorState, mergeWiringEditorState } from '@/lib/wiringEditor';

function toError(e: unknown): { status: number; message: string } {
  if (e && typeof e === 'object') {
    const status = (e as Record<string, unknown>)['statusCode'];
    const msg = (e as Record<string, unknown>)['message'];
    if (typeof status === 'number' && typeof msg === 'string') return { status, message: msg };
  }
  if (e instanceof Error) return { status: 500, message: e.message };
  return { status: 500, message: 'Error' };
}

type PutBody = {
  projectId: string;
  subCenterId: string;
  moduleOrder?: string[];
  symbolsPatch?: Record<string, { type?: string; label?: string } | null>;
};

export async function GET(req: Request) {
  try {
    const actor = await requireActorApi();
    const { searchParams } = new URL(req.url);
    const projectId = String(searchParams.get('projectId') ?? '');
    const subCenterId = String(searchParams.get('subCenterId') ?? '');

    if (!projectId || !subCenterId) return new NextResponse('Missing parameters', { status: 400 });

    const project = await db.project.findFirst({ where: { id: projectId, companyId: actor.companyId } });
    if (!project) return new NextResponse('Project not found', { status: 404 });

    const center = await db.subCenter.findFirst({ where: { id: subCenterId, projectId, companyId: actor.companyId } });
    if (!center) return new NextResponse('Center not found', { status: 404 });

    const doc = await db.document.findFirst({
      where: { companyId: actor.companyId, projectId, subCenterId, type: 'WIRING_DIAGRAMS' as DocumentType },
    });

    return NextResponse.json({ ok: true, state: readWiringEditorState(doc?.settings ?? null) });
  } catch (e: unknown) {
    const { status, message } = toError(e);
    return new NextResponse(message, { status });
  }
}

export async function PUT(req: Request) {
  try {
    const actor = await requireActorApi();
    assertWrite(actor.role);

    const body = (await req.json()) as PutBody;
    const projectId = String(body?.projectId ?? '');
    const subCenterId = String(body?.subCenterId ?? '');

    if (!projectId || !subCenterId) return new NextResponse('Missing parameters', { status: 400 });

    const project = await db.project.findFirst({ where: { id: projectId, companyId: actor.companyId } });
    if (!project) return new NextResponse('Project not found', { status: 404 });

    const center = await db.subCenter.findFirst({ where: { id: subCenterId, projectId, companyId: actor.companyId } });
    if (!center) return new NextResponse('Center not found', { status: 404 });

    // Ensure doc exists
    const doc = await db.document.upsert({
      where: { subCenterId_type: { subCenterId, type: 'WIRING_DIAGRAMS' as DocumentType } },
      update: { companyId: actor.companyId, projectId },
      create: {
        companyId: actor.companyId,
        projectId,
        subCenterId,
        type: 'WIRING_DIAGRAMS' as DocumentType,
        title: 'Wiring diagrams',
      },
    });

    const prev = readWiringEditorState(doc.settings ?? null);

    // Apply symbol patch without overwriting unrelated terminals.
    let nextSymbols = prev.symbols;
    if (body.symbolsPatch && typeof body.symbolsPatch === 'object' && !Array.isArray(body.symbolsPatch)) {
      nextSymbols = { ...prev.symbols };
      for (const [k, v] of Object.entries(body.symbolsPatch)) {
        const key = String(k);
        if (!key.trim()) continue;
        if (v === null) {
          delete nextSymbols[key];
          continue;
        }
        if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
        const t = typeof v.type === 'string' ? v.type.trim() : '';
        if (!t) continue;
        const label = typeof v.label === 'string' ? v.label : undefined;
        nextSymbols[key] = { type: t, label };
      }
    }

    const nextSettings = mergeWiringEditorState({
      settings: doc.settings ?? null,
      patch: {
        moduleOrder: Array.isArray(body.moduleOrder) ? body.moduleOrder.map((x) => String(x)) : undefined,
        symbols: body.symbolsPatch ? nextSymbols : undefined,
      },
    });

    await db.document.update({
      where: { id: doc.id },
      data: {
        companyId: actor.companyId,
        projectId,
        settings: nextSettings,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const { status, message } = toError(e);
    return new NextResponse(message, { status });
  }
}
