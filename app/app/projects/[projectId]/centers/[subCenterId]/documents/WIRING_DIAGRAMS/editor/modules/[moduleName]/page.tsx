import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { DocumentType } from '@prisma/client';
import { requireActor } from '@/lib/actor';
import { db } from '@/lib/db';
import { readCanonical } from '@/lib/canonical';
import { canWrite } from '@/lib/permissions';
import { readWiringEditorState, extractTerminalCode } from '@/lib/wiringEditor';
import { WiringModuleEditorClient, type WiringPointView } from '@/components/WiringModuleEditorClient';

function toNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export default async function WiringModulePage({
  params,
}: {
  params: Promise<{ projectId: string; subCenterId: string; moduleName: string }>;
}) {
  const { projectId, subCenterId, moduleName } = await params;
  const actor = await requireActor();

  const project = await db.project.findFirst({ where: { id: projectId, companyId: actor.companyId } });
  if (!project) return notFound();

  const center = await db.subCenter.findFirst({ where: { id: subCenterId, projectId: project.id, companyId: actor.companyId } });
  if (!center) return notFound();

  const doc = await db.document.upsert({
    where: { subCenterId_type: { subCenterId: center.id, type: 'WIRING_DIAGRAMS' as DocumentType } },
    update: { companyId: actor.companyId, projectId: project.id },
    create: {
      companyId: actor.companyId,
      projectId: project.id,
      subCenterId: center.id,
      type: 'WIRING_DIAGRAMS' as DocumentType,
      title: 'Wiring diagrams',
    },
  });

  const canon = doc.settings ? readCanonical(doc.settings) : null;
  const editor = readWiringEditorState(doc.settings ?? null);
  const rows = (canon?.rows ?? []) as Array<Record<string, unknown>>;

  const moduleRows = rows.filter((r) => String(r['module_name'] ?? '') === moduleName);
  if (rows.length > 0 && moduleRows.length === 0) return notFound();

  // Validation: find unknown terminals referenced by editor state
  const terminalsAll = new Set<string>();
  for (const r of rows) {
    const tc = extractTerminalCode(r);
    if (tc) terminalsAll.add(tc);
  }
  const unknownTerminalCodes = Object.keys(editor.symbols).filter((k) => !terminalsAll.has(k)).slice(0, 50);

  const points: WiringPointView[] = moduleRows.map((r) => {
    const inCh = toNum(r['input_channel_number']);
    const outCh = toNum(r['output_channel_number']);
    const io = inCh != null ? 'IN' : outCh != null ? 'OUT' : '';
    return {
      terminal_code: extractTerminalCode(r) || '',
      io,
      input_channel_number: inCh,
      output_channel_number: outCh,
      point_name: String(r['point_name'] ?? ''),
      point_xml_type: String(r['point_xml_type'] ?? ''),
      point_descr: String(r['point_descr'] ?? ''),
      note2: String(r['note2'] ?? ''),
    };
  });

  const exportHref = `/api/wiring-diagrams/export-xml?${new URLSearchParams({
    projectId: project.id,
    subCenterId: center.id,
  }).toString()}`;

  return (
    <div className="page" style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <div className="row spaceBetween">
          <div>
            <h2 className="h2">Module: <span className="mono">{moduleName}</span></h2>
            <div className="muted small">
              Project <span className="mono">{project.code}</span> · Center <span className="mono">{center.code ?? center.id}</span>
            </div>
            <div className="muted small">Points in module: <span className="mono">{points.length}</span></div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn secondary" href={`/app/projects/${project.id}/centers/${center.id}/documents/WIRING_DIAGRAMS/editor`}>
              Back to modules
            </Link>
            <Link className="btn secondary" href={`/app/projects/${project.id}/centers/${center.id}/import`}>
              Import / Export
            </Link>
            <a className="btn" href={exportHref}>
              Export XML (ObjectSet)
            </a>
          </div>
        </div>
      </div>

      <WiringModuleEditorClient
        projectId={project.id}
        subCenterId={center.id}
        canWrite={canWrite(actor.role)}
        points={points}
        initialSymbols={editor.symbols}
        unknownTerminalCodes={unknownTerminalCodes}
      />
    </div>
  );
}
