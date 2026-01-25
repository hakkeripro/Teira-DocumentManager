'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import type { CanonicalRow, WiringV2Page, WiringV2State, WiringV2TerminalRow } from '@/lib/wiringEditorV2';
import { MODULE_TEMPLATES, type ModuleTemplateId, getTemplate } from '@/lib/templates/moduleTemplates';

type Props = {
  projectId: string;
  subCenterId: string;
  canWrite: boolean;
  initialState: WiringV2State;
  canonicalRows: CanonicalRow[];
  /** If true, show "Import changes pending" banner */
  importPending?: boolean;
  /** Preview of import changes */
  importPreview?: { added: number; modified: number; removed: number } | null;
};

type Tab = 'editor' | 'workbook';

/** Folder groups for UI-only organization (not persisted to DB) */
type FolderGroup = {
  id: string;
  name: string;
  collapsed: boolean;
};

const WORKBOOK_COLUMNS: { key: string; label: string }[] = [
  { key: 'module_name', label: 'module_name' },
  { key: 'module_id', label: 'module_id' },
  { key: 'module_xml_type', label: 'module_xml_type' },
  { key: 'point_type', label: 'point_type' },
  { key: 'point_name', label: 'point_name' },
  { key: 'point_descr', label: 'point_descr' },
  { key: 'input_channel_number', label: 'input_channel_number' },
  { key: 'output_channel_number', label: 'output_channel_number' },
  { key: 'connector', label: 'connector' },
  { key: 'cable', label: 'cable' },
  { key: 'cable_type', label: 'cable_type' },
  { key: 'cable_size', label: 'cable_size' },
  { key: 'cable_pair', label: 'cable_pair' },
  { key: 'destination', label: 'destination' },
  { key: 'connected_device', label: 'connected_device' },
  { key: 'note', label: 'note' },
  { key: 'note2', label: 'note2' },
  { key: 'updated_at', label: 'updated_at' },
  { key: 'user_comment', label: 'user_comment' },
];


const TEMPLATE_IDS = Object.keys(MODULE_TEMPLATES) as ModuleTemplateId[];

function safeKey(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-:.]/g, '')
    .slice(0, 120);
}

function allocAppendPageCode(existingCodes: string[], avoid: Set<string>, startAt: number): string {
  const norm = (c: string) => String(c).padStart(2, '0');
  const used = new Set(existingCodes.map(norm));
  for (const a of avoid) used.add(norm(a));

  let max = startAt - 1;
  for (const c of existingCodes) {
    const n = Number(norm(c));
    if (Number.isFinite(n)) max = Math.max(max, n);
  }

  // Preferred rule: append after the current max to keep numbering stable.
  for (let n = Math.max(max + 1, startAt); n <= 99; n++) {
    const c = String(n).padStart(2, '0');
    if (!used.has(c)) return c;
  }

  // Fallback: first free slot (should rarely be needed).
  for (let n = startAt; n <= 99; n++) {
    const c = String(n).padStart(2, '0');
    if (!used.has(c)) return c;
  }

  return '99';
}

function keyForTerminal(pageId: string, terminalCode: string) {
  return `${pageId}:${terminalCode}`;
}

function toTSV(rows: CanonicalRow[], columns: string[]): string {
  const escape = (v: unknown) => (v == null ? '' : String(v));
  return rows
    .map((r) => columns.map((c) => escape(r?.[c])).join('\t'))
    .join('\n');
}

function parseTSV(text: string): string[][] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'));
}

export default function WiringEditorV2Client(props: Props) {
  const { projectId, subCenterId, canWrite, initialState } = props;
  const [tab, setTab] = useState<Tab>('editor');
  const [state, setState] = useState<WiringV2State>(initialState);
  const [selectedPageId, setSelectedPageId] = useState<string>(() => initialState.pageOrder[0] ?? initialState.pages[0]?.id ?? '');

  // Workbook is edited client-side and saved explicitly.
  const [workbookRows, setWorkbookRows] = useState<CanonicalRow[]>(() => props.canonicalRows.map((r) => ({ ...r })));
  const [workbookDirty, setWorkbookDirty] = useState(false);
  const workbookTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Import/Export state
  const [importPending, setImportPending] = useState(props.importPending ?? false);
  const [importPreview, setImportPreview] = useState(props.importPreview ?? null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  // Folder grouping (UI-only, not persisted)
  const [folderGroups, setFolderGroups] = useState<FolderGroup[]>(() => {
    // Default grouping: "System Pages" for PS/AS-P, "IO Modules" for the rest
    return [
      { id: 'system', name: 'System Pages', collapsed: false },
      { id: 'io-modules', name: 'IO Modules', collapsed: false },
    ];
  });

  const pagesById = useMemo(() => {
    const map = new Map(state.pages.map((p) => [p.id, p] as const));
    return map;
  }, [state.pages]);

  const orderedPages = useMemo(() => {
    const ids = state.pageOrder.length > 0 ? state.pageOrder : state.pages.map((p) => p.id);
    return ids.map((id) => pagesById.get(id)).filter(Boolean) as WiringV2State['pages'];
  }, [state.pageOrder, state.pages, pagesById]);

  const selectedPage = useMemo(() => pagesById.get(selectedPageId) ?? orderedPages[0], [pagesById, selectedPageId, orderedPages]);

  useEffect(() => {
    if (!selectedPageId && orderedPages.length > 0) setSelectedPageId(orderedPages[0].id);
  }, [selectedPageId, orderedPages]);

  const [newModuleName, setNewModuleName] = useState('');
  const [newTemplateId, setNewTemplateId] = useState<ModuleTemplateId>('DI-16');

  async function addModulePage() {
    if (!canWrite) return;
    const name = newModuleName.trim();
    if (!name) return;

    const id = `mod:${safeKey(name)}`;
    const avoid = new Set<string>();
    if (String(state.automationServerType ?? '').toUpperCase() === 'AS-P') {
      avoid.add('01');
      avoid.add('02');
    }
    const startAt = String(state.automationServerType ?? '').toUpperCase() === 'AS-P' ? 3 : 1;
    const code = allocAppendPageCode(state.pages.map((p) => p.code), avoid, startAt);

    const page: WiringV2Page = {
      id,
      code,
      title: name,
      templateId: newTemplateId,
      locked: false,
      moduleRef: { moduleName: name },
    };

    await apiPatch({ patch: { upsertPages: [page] } });
    setSelectedPageId(id);
    setNewModuleName('');
  }

  async function apiPatch(body: Record<string, unknown>) {
    const res = await fetch('/api/wiring-diagrams/v2/state', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId, subCenterId, ...body }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || 'Save failed');
    }
    const json = (await res.json()) as { state: WiringV2State };
    setState(json.state);
    return json.state;
  }

  async function setAutomationServerType(v: string) {
    if (!canWrite) return;
    await apiPatch({ patch: { automationServerType: v || null } });
  }

  async function patchTerminal(pageId: string, terminalCode: string, patch: WiringV2TerminalRow) {
    if (!canWrite) return;
    await apiPatch({ patch: { terminalPatches: [{ pageId, terminalCode, patch }] } });
  }

  async function reorderPages(fromIdx: number, toIdx: number) {
    if (!canWrite) return;
    const ids = [...(state.pageOrder.length ? state.pageOrder : state.pages.map((p) => p.id))];
    const [moved] = ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, moved);
    await apiPatch({ patch: { pageOrder: ids } });
  }

  function onDragStart(e: DragEvent<HTMLLIElement>, idx: number) {
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  }

  async function onDrop(e: DragEvent<HTMLLIElement>, idx: number) {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (!Number.isFinite(from)) return;
    if (from === idx) return;
    await reorderPages(from, idx);
  }

  function onDragOver(e: DragEvent<HTMLLIElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function nextPage(delta: number) {
    const idx = orderedPages.findIndex((p) => p.id === selectedPage?.id);
    if (idx < 0) return;
    const n = idx + delta;
    if (n < 0 || n >= orderedPages.length) return;
    setSelectedPageId(orderedPages[n].id);
  }

  function renderGrid() {
    if (!selectedPage) return <div className="muted">No pages.</div>;
    const template = getTemplate(selectedPage.templateId);
    const terminals = [...template.terminals].sort((a, b) => a.order - b.order);

    // Column structure per docs/ui_refs/wiring_editor_v2/Kytkentakuva_DI16.png (golden reference)
    return (
      <div className="card" style={{ overflowX: 'auto' }}>
        <div className="row spaceBetween" style={{ gap: 12 }}>
          <div>
            <div className="h2"><span className="mono">{selectedPage.code}_{selectedPage.templateId}</span></div>
            <div className="h2" style={{ marginTop: 2 }}>{selectedPage.title}</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary" onClick={() => nextPage(-1)} disabled={!selectedPage || orderedPages[0]?.id === selectedPage.id}>
              Prev
            </button>
            <button className="btn secondary" onClick={() => nextPage(1)} disabled={!selectedPage || orderedPages[orderedPages.length - 1]?.id === selectedPage.id}>
              Next
            </button>
          </div>
        </div>

        {/* Print-grid columns 1:1 with Kytkentakuva_DI16.png golden reference */}
        <table className="table" style={{ minWidth: 1200 }}>
          <thead>
            {/* Row 1: Group headers */}
            <tr>
              <th rowSpan={2} style={{ width: 120 }}>Tunnus</th>
              <th rowSpan={2} style={{ width: 140 }}>Teksti</th>
              <th rowSpan={2} style={{ width: 80 }}>Liitin</th>
              <th colSpan={2} style={{ textAlign: 'center', borderBottom: '1px solid #ccc' }}>Kaapeli 1</th>
              <th rowSpan={2} style={{ width: 140 }}>Välikytkentä-<br/>paikka ja<br/>liittimet</th>
              <th colSpan={2} style={{ textAlign: 'center', borderBottom: '1px solid #ccc' }}>Kaapeli 2</th>
              <th colSpan={2} style={{ textAlign: 'center', borderBottom: '1px solid #ccc' }}>Minne johdetaan</th>
              <th rowSpan={2} style={{ width: 60 }}>Symboli/<br/>Piirros-<br/>merkintä</th>
            </tr>
            {/* Row 2: Sub-column headers */}
            <tr>
              <th style={{ width: 80 }}>Pari nro<br/>tai<br/>johdin</th>
              <th style={{ width: 100 }}>Tyyppi<br/>koko<br/>nro</th>
              <th style={{ width: 100 }}>Tyyppi<br/>koko<br/>nro</th>
              <th style={{ width: 80 }}>Pari nro<br/>tai<br/>johdin</th>
              <th style={{ width: 80 }}>Liitin</th>
              <th style={{ width: 120 }}>Kytkentäpaikka</th>
            </tr>
          </thead>
          <tbody>
            {terminals.map((t) => {
              const k = keyForTerminal(selectedPage.id, t.terminal_code);
              const row = state.terminals[k] ?? {};
              return (
                <tr key={k}>
                  {/* Tunnus (Tag/ID) */}
                  <td>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      defaultValue={row.deviceText ?? ''}
                      placeholder=""
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { deviceText: e.currentTarget.value })}
                    />
                  </td>
                  {/* Teksti (Description) */}
                  <td>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      defaultValue={(row as Record<string, unknown>).description as string ?? ''}
                      placeholder=""
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { ...row, description: e.currentTarget.value } as WiringV2TerminalRow)}
                    />
                  </td>
                  {/* Liitin (Connector) - from template, multi-line display */}
                  <td style={{ verticalAlign: 'top' }}>
                    <div className="mono" style={{ fontSize: 11, lineHeight: 1.3 }}>
                      {t.print_label.split('/').map((line, i) => (
                        <div key={i}>{line.trim()}</div>
                      ))}
                    </div>
                  </td>
                  {/* Kaapeli 1: Pari nro tai johdin */}
                  <td>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      defaultValue={(row as Record<string, unknown>).cable1Pair as string ?? ''}
                      placeholder=""
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { ...row, cable1Pair: e.currentTarget.value } as WiringV2TerminalRow)}
                    />
                  </td>
                  {/* Kaapeli 1: Tyyppi koko nro */}
                  <td>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      defaultValue={row.cable1 ?? ''}
                      placeholder=""
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { cable1: e.currentTarget.value })}
                    />
                  </td>
                  {/* Välikytkentäpaikka ja liittimet */}
                  <td>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      defaultValue={(row as Record<string, unknown>).intermediateTerminal as string ?? ''}
                      placeholder=""
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { ...row, intermediateTerminal: e.currentTarget.value } as WiringV2TerminalRow)}
                    />
                  </td>
                  {/* Kaapeli 2: Tyyppi koko nro */}
                  <td>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      defaultValue={row.cable2 ?? ''}
                      placeholder=""
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { cable2: e.currentTarget.value })}
                    />
                  </td>
                  {/* Kaapeli 2: Pari nro tai johdin */}
                  <td>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      defaultValue={(row as Record<string, unknown>).cable2Pair as string ?? ''}
                      placeholder=""
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { ...row, cable2Pair: e.currentTarget.value } as WiringV2TerminalRow)}
                    />
                  </td>
                  {/* Minne johdetaan: Liitin */}
                  <td>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      defaultValue={(row as Record<string, unknown>).destinationConnector as string ?? ''}
                      placeholder=""
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { ...row, destinationConnector: e.currentTarget.value } as WiringV2TerminalRow)}
                    />
                  </td>
                  {/* Minne johdetaan: Kytkentäpaikka */}
                  <td>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      defaultValue={row.destination ?? ''}
                      placeholder=""
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { destination: e.currentTarget.value })}
                    />
                  </td>
                  {/* Symboli/Piirrosmerkintä */}
                  <td>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      defaultValue={row.symbol?.type ?? ''}
                      placeholder=""
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { symbol: { type: e.currentTarget.value, label: row.symbol?.label } })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="muted small" style={{ marginTop: 10 }}>
          Sarakkeet vastaavat referenssiä: docs/ui_refs/wiring_editor_v2/Kytkentakuva_DI16.png
        </div>
      </div>
    );
  }

  async function saveWorkbookPatches(patches: Array<{ rowIndex: number; field: string; value: unknown }>) {
    if (!canWrite) return;
    const res = await fetch('/api/wiring-diagrams/v2/workbook', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId, subCenterId, patches }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || 'Workbook save failed');
    }
    const json = (await res.json()) as { canonicalRows: CanonicalRow[] };
    setWorkbookRows(json.canonicalRows.map((r) => ({ ...r })));
    setWorkbookDirty(false);
  }

  function onWorkbookCellPaste(rowIndex: number, colIndex: number, text: string) {
    const matrix = parseTSV(text);
    if (matrix.length === 0) return;
    setWorkbookRows((prev) => {
      const next = prev.map((r) => ({ ...r }));
      for (let r = 0; r < matrix.length; r++) {
        const targetRow = rowIndex + r;
        if (targetRow >= next.length) break;
        for (let c = 0; c < matrix[r].length; c++) {
          const targetCol = colIndex + c;
          if (targetCol >= WORKBOOK_COLUMNS.length) break;
          const key = WORKBOOK_COLUMNS[targetCol].key;
          next[targetRow][key] = matrix[r][c];
        }
      }
      return next;
    });
    setWorkbookDirty(true);
  }

  async function saveWorkbook() {
    const patches: Array<{ rowIndex: number; field: string; value: unknown }> = [];
    workbookRows.forEach((row, idx) => {
      // If the sheet is dirty we send a conservative patch set: all columns for changed rows.
      // This keeps server logic simple and deterministic.
      for (const c of WORKBOOK_COLUMNS) {
        patches.push({ rowIndex: idx, field: c.key, value: row?.[c.key] ?? '' });
      }
    });
    await saveWorkbookPatches(patches);
  }

  // Import handler (in-editor import per docs/03_IMPORT_EXPORT.md)
  const handleImportFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canWrite) return;

    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('projectId', projectId);
      fd.append('subCenterId', subCenterId);
      fd.append('docType', 'WIRING_DIAGRAMS');
      fd.append('file', file);

      // Dry-run first to check for changes
      const dryRes = await fetch('/api/import/dry-run', { method: 'POST', body: fd });
      if (!dryRes.ok) {
        const msg = await dryRes.text();
        alert(`Import error: ${msg}`);
        return;
      }
      const dryData = await dryRes.json();

      // Check for module mismatch (must be blocked per spec)
      if (dryData.errorsCount > 0) {
        alert(`Import blocked: ${dryData.errorsCount} errors. Modules may not match.`);
        return;
      }

      // If there are changes, show "Import changes pending" banner
      if (dryData.wouldCreate > 0 || dryData.wouldUpdate > 0) {
        setImportPreview({
          added: dryData.wouldCreate,
          modified: dryData.wouldUpdate,
          removed: 0, // Not tracked in current dry-run
        });
        setImportPending(true);
      } else {
        alert('No changes detected in import file.');
      }
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  }, [canWrite, projectId, subCenterId]);

  // Accept import changes -> creates new revision per docs/04_REVISION_WORKFLOW.md
  const handleAcceptImport = useCallback(async () => {
    if (!canWrite || !importPending) return;

    setImporting(true);
    try {
      // Re-read the file or use cached data - for now we'll trigger a fresh commit
      // In production, we'd cache the dry-run result. Here we prompt for re-upload.
      const file = importFileRef.current?.files?.[0];
      if (!file) {
        alert('Please select the import file again to accept changes.');
        return;
      }

      const fd = new FormData();
      fd.append('projectId', projectId);
      fd.append('subCenterId', subCenterId);
      fd.append('docType', 'WIRING_DIAGRAMS');
      fd.append('file', file);
      fd.append('createRevision', 'true'); // Signal to create new revision

      const commitRes = await fetch('/api/import/commit', { method: 'POST', body: fd });
      if (!commitRes.ok) {
        const msg = await commitRes.text();
        alert(`Import commit error: ${msg}`);
        return;
      }

      const commitData = await commitRes.json();
      if (commitData.ok) {
        setImportPending(false);
        setImportPreview(null);
        // Refresh the page to load new data
        window.location.reload();
      } else {
        alert(`Import failed: ${commitData.message ?? 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  }, [canWrite, importPending, projectId, subCenterId]);

  // Dismiss import pending (cancel)
  const handleDismissImport = useCallback(() => {
    setImportPending(false);
    setImportPreview(null);
    if (importFileRef.current) importFileRef.current.value = '';
  }, []);

  // Export XML handler (in-editor export per docs/03_IMPORT_EXPORT.md)
  const handleExportXML = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        projectId,
        subCenterId,
      });
      const res = await fetch(`/api/wiring-diagrams/export-xml?${params}`);
      if (!res.ok) {
        const msg = await res.text();
        alert(`Export error: ${msg}`);
        return;
      }
      // Download the file
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WIRING_DIAGRAMS_${new Date().toISOString().slice(0, 10)}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  }, [projectId, subCenterId]);

  // Toggle folder collapse
  const toggleFolder = useCallback((folderId: string) => {
    setFolderGroups((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, collapsed: !f.collapsed } : f))
    );
  }, []);

  // Group pages into folders (UI-only grouping)
  const groupedPages = useMemo(() => {
    const systemPages = orderedPages.filter((p) => p.locked || p.templateId === 'PS' || p.templateId === 'AS-P');
    const ioPages = orderedPages.filter((p) => !p.locked && p.templateId !== 'PS' && p.templateId !== 'AS-P');
    return { systemPages, ioPages };
  }, [orderedPages]);

  function renderWorkbook() {
    return (
      <div className="card" style={{ overflowX: 'auto' }}>
        <div className="row spaceBetween" style={{ gap: 12 }}>
          <div>
            <div className="h2">Työkirja</div>
            <div className="muted small">Excel-like bulk editing (TSV paste supported)</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" disabled={!canWrite || !workbookDirty} onClick={saveWorkbook}>
              Save
            </button>
          </div>
        </div>

        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 900 }}>
            <table className="table" style={{ minWidth: 1200 }}>
              <thead>
                <tr>
                  {WORKBOOK_COLUMNS.map((c) => (
                    <th key={c.key} style={{ whiteSpace: 'nowrap' }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workbookRows.map((r, rowIndex) => (
                  <tr key={`${rowIndex}:${r?.module_id ?? ''}:${r?.point_name ?? ''}`}>
                    {WORKBOOK_COLUMNS.map((c, colIndex) => (
                      <td key={c.key} style={{ padding: 4 }}>
                        <input
                          className="input"
                          value={String(r?.[c.key] ?? '')}
                          disabled={!canWrite}
                          onChange={(e) => {
                            const v = e.currentTarget.value;
                            setWorkbookRows((prev) => {
                              const next = prev.map((x) => ({ ...x }));
                              next[rowIndex][c.key] = v;
                              return next;
                            });
                            setWorkbookDirty(true);
                          }}
                          onPaste={(e) => {
                            const txt = e.clipboardData.getData('text/plain');
                            if (txt.includes('\t') || txt.includes('\n')) {
                              e.preventDefault();
                              onWorkbookCellPaste(rowIndex, colIndex, txt);
                            }
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ width: 380 }}>
            <div className="card" style={{ padding: 12 }}>
              <div className="h2">Copy / paste helper</div>
              <div className="muted small" style={{ marginBottom: 8 }}>
                You can copy the entire table as TSV from below, edit in Excel, and paste back into the grid.
              </div>
              <textarea
                ref={workbookTextAreaRef}
                className="textarea"
                rows={14}
                readOnly
                value={toTSV(workbookRows, WORKBOOK_COLUMNS.map((c) => c.key))}
              />
              <div className="muted small" style={{ marginTop: 8 }}>
                Pasting multi-cell TSV directly into the table is supported. Workbook changes update the canonical rows.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Import/Export toolbar (appears in both tabs per docs/03_IMPORT_EXPORT.md)
  function renderImportExportToolbar() {
    return (
      <div className="row" style={{ gap: 8 }}>
        <input
          ref={importFileRef}
          type="file"
          accept=".xml,.xlsx"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        <button
          className="btn secondary"
          disabled={!canWrite || importing}
          onClick={() => importFileRef.current?.click()}
        >
          {importing ? 'Importing...' : 'Import XML'}
        </button>
        <button
          className="btn secondary"
          disabled={exporting}
          onClick={handleExportXML}
        >
          {exporting ? 'Exporting...' : 'Export XML'}
        </button>
      </div>
    );
  }

  // Render folder item in pages tree
  function renderFolderItem(folder: FolderGroup, pages: WiringV2Page[]) {
    if (pages.length === 0) return null;
    const isCollapsed = folder.collapsed;
    return (
      <div key={folder.id} style={{ marginBottom: 8 }}>
        <button
          className="btn secondary"
          style={{ width: '100%', justifyContent: 'flex-start', gap: 8, fontWeight: 600 }}
          onClick={() => toggleFolder(folder.id)}
          type="button"
        >
          <span style={{ fontSize: 14 }}>{isCollapsed ? '📁' : '📂'}</span>
          <span>{folder.name}</span>
          <span className="muted small">({pages.length})</span>
        </button>
        {!isCollapsed && (
          <ul className="list" style={{ marginLeft: 16, marginTop: 4 }}>
            {pages.map((p) => {
              const isLocked = Boolean(p.locked);
              const isSelected = p.id === selectedPage?.id;
              const globalIdx = orderedPages.findIndex((op) => op.id === p.id);
              return (
                <li
                  key={p.id}
                  className="listItem"
                  draggable={canWrite && !isLocked}
                  onDragStart={(e) => onDragStart(e, globalIdx)}
                  onDrop={(e) => onDrop(e, globalIdx)}
                  onDragOver={onDragOver}
                  style={{ cursor: canWrite && !isLocked ? 'grab' : 'default' }}
                >
                  <button
                    className={isSelected ? 'btn' : 'btn secondary'}
                    style={{ width: '100%', justifyContent: 'space-between', fontSize: 12 }}
                    onClick={() => setSelectedPageId(p.id)}
                    type="button"
                  >
                    <span>
                      <span className="mono">{p.code}_{p.templateId}</span> {p.title}
                    </span>
                    {isLocked && <span className="muted small">🔒</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="row spaceBetween" style={{ gap: 12 }}>
        <div>
          <h1>WIRING_DIAGRAMS</h1>
          <div className="muted">Editor v2 — Page model + templates + Työkirja</div>
        </div>
        <Link className="btn secondary" href={`/app/projects/${projectId}/centers/${subCenterId}/documents`}>
          Back to documents
        </Link>
      </div>

      {/* Import changes pending banner (per docs/04_REVISION_WORKFLOW.md) */}
      {importPending && importPreview && (
        <div className="card" style={{ marginBottom: 12, background: '#fff3cd', border: '1px solid #ffc107' }}>
          <div className="row spaceBetween" style={{ gap: 12 }}>
            <div>
              <div className="h2" style={{ color: '#856404' }}>⚠️ Import changes pending</div>
              <div className="muted" style={{ color: '#856404' }}>
                Preview: {importPreview.added} added, {importPreview.modified} modified
                {importPreview.removed > 0 && `, ${importPreview.removed} removed`}
              </div>
              <div className="muted small" style={{ marginTop: 4 }}>
                Accepting will create a new revision (rev bump) per revision workflow.
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn" onClick={handleAcceptImport} disabled={importing}>
                {importing ? 'Processing...' : 'Accept & Create Revision'}
              </button>
              <button className="btn secondary" onClick={handleDismissImport} disabled={importing}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <div className="muted small">Automation server type</div>
            <select
              className="select"
              disabled={!canWrite}
              value={state.automationServerType ?? ''}
              onChange={(e) => setAutomationServerType(e.currentTarget.value)}
            >
              <option value="">(none)</option>
              <option value="AS-P">AS-P</option>
            </select>
            <div className="muted small">(affects default locked pages 01/02)</div>
          </div>

          <div className="row" style={{ gap: 8 }}>
            <button className={tab === 'editor' ? 'btn' : 'btn secondary'} onClick={() => setTab('editor')}>
              Kytkentäkuva
            </button>
            <button className={tab === 'workbook' ? 'btn' : 'btn secondary'} onClick={() => setTab('workbook')}>
              Työkirja
            </button>
          </div>

          {/* Import/Export in toolbar (both tabs per docs/03_IMPORT_EXPORT.md) */}
          {renderImportExportToolbar()}
        </div>
      </div>

      {tab === 'editor' ? (
        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <div className="card" style={{ width: 320, padding: 12 }}>
            <div className="h2">Pages</div>
            <div className="muted small" style={{ marginBottom: 8 }}>
              Drag & drop to reorder. Folders are UI-only grouping.
            </div>

            {/* Folder-based grouping (UI-only per docs/13_UI_CONTRACT_WIRING_EDITOR.md) */}
            {renderFolderItem(
              folderGroups.find((f) => f.id === 'system') ?? { id: 'system', name: 'System Pages', collapsed: false },
              groupedPages.systemPages
            )}
            {renderFolderItem(
              folderGroups.find((f) => f.id === 'io-modules') ?? { id: 'io-modules', name: 'IO Modules', collapsed: false },
              groupedPages.ioPages
            )}

            <div className="card" style={{ padding: 10, marginTop: 10 }}>
              <div className="muted small" style={{ marginBottom: 6 }}>Add module page</div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <input
                  className="input"
                  placeholder="Module name"
                  value={newModuleName}
                  disabled={!canWrite}
                  onChange={(e) => setNewModuleName(e.currentTarget.value)}
                  style={{ flex: 1, minWidth: 160 }}
                />
                <select
                  className="select"
                  value={newTemplateId}
                  disabled={!canWrite}
                  onChange={(e) => setNewTemplateId(e.currentTarget.value as ModuleTemplateId)}
                >
                  {TEMPLATE_IDS.map((tid) => (
                    <option key={tid} value={tid}>{tid}</option>
                  ))}
                </select>
                <button className="btn" disabled={!canWrite || !newModuleName.trim()} onClick={addModulePage}>
                  Add
                </button>
              </div>
              <div className="muted small" style={{ marginTop: 6 }}>
                Module pages use template terminals; you cannot add terminal rows for module pages.
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>{renderGrid()}</div>
        </div>
      ) : (
        renderWorkbook()
      )}
    </div>
  );
}
