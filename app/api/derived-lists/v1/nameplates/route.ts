import { NextResponse } from 'next/server';
import type { DocumentType } from '@prisma/client';
import { requireActorApi } from '@/lib/actorApi';
import { db } from '@/lib/db';
import { assertWrite } from '@/lib/permissions';
import {
  buildNameplateV1View,
  readNameplateV1State,
  sanitizeNameplateV1Input,
} from '@/lib/derivedLists/nameplatesV1';
import { deriveNameplateBaseRowsFromWiringV2, mergeNameplateListV1Settings } from '@/lib/derivedLists/nameplatesV1.server';

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
  overrides?: unknown;
  manualRows?: unknown;
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

    const wiring = await db.document.findFirst({
      where: { companyId: actor.companyId, projectId, subCenterId, type: 'WIRING_DIAGRAMS' as DocumentType },
    });

    const nameplateDoc = await db.document.upsert({
      where: { subCenterId_type: { subCenterId, type: 'NAMEPLATE_LIST' as DocumentType } },
      update: { companyId: actor.companyId, projectId },
      create: {
        companyId: actor.companyId,
        projectId,
        subCenterId,
        type: 'NAMEPLATE_LIST' as DocumentType,
        title: 'Kilpiluettelo',
      },
    });

    const baseRows = deriveNameplateBaseRowsFromWiringV2({ wiringSettings: wiring?.settings ?? null });
    const state = readNameplateV1State(nameplateDoc.settings ?? null);
    const view = buildNameplateV1View({ baseRows, state });

    return NextResponse.json({
      ok: true,
      baseRows,
      rows: view.rows,
      excludedDerived: view.excludedDerived,
      state,
    });
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

    const wiring = await db.document.findFirst({
      where: { companyId: actor.companyId, projectId, subCenterId, type: 'WIRING_DIAGRAMS' as DocumentType },
    });

    const doc = await db.document.upsert({
      where: { subCenterId_type: { subCenterId, type: 'NAMEPLATE_LIST' as DocumentType } },
      update: { companyId: actor.companyId, projectId },
      create: {
        companyId: actor.companyId,
        projectId,
        subCenterId,
        type: 'NAMEPLATE_LIST' as DocumentType,
        title: 'Kilpiluettelo',
      },
    });

    const input = sanitizeNameplateV1Input({ overrides: body.overrides, manualRows: body.manualRows });
    const state = {
      version: 1 as const,
      updatedAt: new Date().toISOString(),
      overrides: input.overrides,
      manualRows: input.manualRows,
    };

    const baseRows = deriveNameplateBaseRowsFromWiringV2({ wiringSettings: wiring?.settings ?? null });
    const view = buildNameplateV1View({ baseRows, state });
    const mergedRows = view.rows.map((r) => ({ tag: r.tag, description: r.description }));

    const nextSettings = mergeNameplateListV1Settings({
      existingSettings: doc.settings ?? null,
      state,
      mergedRows,
      header: { project_code: project.code, center_code: center.code ?? center.id },
    });

    await db.document.update({
      where: { id: doc.id },
      data: { companyId: actor.companyId, projectId, settings: nextSettings },
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const { status, message } = toError(e);
    return new NextResponse(message, { status });
  }
}
