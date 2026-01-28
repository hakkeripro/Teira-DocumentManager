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
};

type Tab = 'editor' | 'workbook';
type ZoomMode = 'fitWidth' | 'fitPage' | 'custom';

/** Cached import session for accept flow (no re-select needed per Sprint 1b) */
type ImportSession = {
  filename: string;
  preview: { added: number; modified: number; removed: number };
  /** Base64-encoded file content for commit */
  fileData: string;
  fileType: string;
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
const A4_BASE_WIDTH = 1200;
const CENTER_PANE_PADDING = 12;
const ZOOM_MIN = 0.8;
const ZOOM_MAX = 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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

/** Convert file to base64 for caching */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Inline styles for print-grid table (white table, thin borders, black text per golden ref) */
const printGridStyles = {
  table: {
    borderCollapse: 'collapse' as const,
    width: '100%',
    minWidth: 1200,
    background: '#fff',
    fontSize: 11,
    fontFamily: 'Arial, sans-serif',
    color: '#000', // Black text
  },
  th: {
    border: '1px solid #000',
    padding: '4px 6px',
    background: '#fff',
    fontWeight: 600,
    textAlign: 'center' as const,
    verticalAlign: 'bottom' as const,
    fontSize: 10,
    color: '#000', // Black header text
  },
  thGroup: {
    border: '1px solid #000',
    padding: '2px 4px',
    background: '#fff',
    fontWeight: 600,
    textAlign: 'center' as const,
    fontSize: 10,
    color: '#000', // Black header text
  },
  td: {
    border: '1px solid #000',
    padding: '2px 4px',
    verticalAlign: 'top' as const,
    background: '#fff',
    color: '#000',
  },
  input: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    fontSize: 10,
    padding: '2px',
    outline: 'none',
    color: '#000',
  },
};

/** 
 * Group terminals into IO channel blocks for row grouping.
 * Each IO channel (DI1, DI2, etc.) has connector_lines that should be rendered as multiple rows.
 * Per golden ref: Liitin, Kaapeli1 Pari, Välikytkentäpaikka, Kaapeli2 Pari, Minne johdetaan Liitin
 * are per-connector-line. Others use rowSpan.
 */
type TerminalGroup = {
  /** Primary terminal code (e.g., DI1) */
  terminalCode: string;
  /** Connector lines to display in Liitin column */
  connectorLines: string[];
};

function groupTerminalsForPrintGrid(
  terminals: { terminal_code: string; print_label: string; order: number; group?: string; connector_lines?: string[] }[]
): TerminalGroup[] {
  const sorted = [...terminals].sort((a, b) => a.order - b.order);
  
  return sorted.map((t) => ({
    terminalCode: t.terminal_code,
    // Use connector_lines if defined, otherwise fall back to single print_label
    connectorLines: t.connector_lines && t.connector_lines.length > 0 
      ? t.connector_lines 
      : [t.print_label],
  }));
}

export default function WiringEditorV2Client(props: Props) {
  const { projectId, subCenterId, canWrite, initialState } = props;
  const [tab, setTab] = useState<Tab>('editor');
  const [state, setState] = useState<WiringV2State>(initialState);
  const [selectedPageId, setSelectedPageId] = useState<string>(() => initialState.pageOrder[0] ?? initialState.pages[0]?.id ?? '');
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fitWidth');
  const [scale, setScale] = useState(1);
  const [pagesDrawerOpen, setPagesDrawerOpen] = useState(false);
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);

  // Workbook is edited client-side and saved explicitly.
  const [workbookRows, setWorkbookRows] = useState<CanonicalRow[]>(() => props.canonicalRows.map((r) => ({ ...r })));
  const [workbookDirty, setWorkbookDirty] = useState(false);
  const workbookTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Import/Export state with cached session (fix for D: no re-select needed)
  const [importSession, setImportSession] = useState<ImportSession | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const workspaceRootRef = useRef<HTMLDivElement | null>(null);
  const centerPaneRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Add module form state
  const [newModuleName, setNewModuleName] = useState('');
  const [newTemplateId, setNewTemplateId] = useState<ModuleTemplateId>('DI-16');

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

  useEffect(() => {
    const root = workspaceRootRef.current;
    const page = root?.closest<HTMLElement>('.page');
    if (!page) return;
    const prev = {
      maxWidth: page.style.maxWidth,
      width: page.style.width,
      minWidth: page.style.minWidth,
    };
    page.style.maxWidth = 'none';
    page.style.width = '100%';
    page.style.minWidth = '0';
    return () => {
      page.style.maxWidth = prev.maxWidth;
      page.style.width = prev.width;
      page.style.minWidth = prev.minWidth;
    };
  }, []);

  const computeFitScale = useCallback((mode: ZoomMode) => {
    const el = centerPaneRef.current;
    const canvas = canvasRef.current;
    if (!el) return;
    const availableWidth = el.clientWidth - CENTER_PANE_PADDING * 2;
    const availableHeight = el.clientHeight - CENTER_PANE_PADDING * 2;
    if (availableWidth <= 0) return;
    let nextScale = availableWidth / A4_BASE_WIDTH;
    if (mode === 'fitPage' && canvas && availableHeight > 0) {
      const canvasHeight = canvas.scrollHeight || canvas.clientHeight;
      if (canvasHeight > 0) {
        nextScale = Math.min(nextScale, availableHeight / canvasHeight);
      }
    }
    setScale(clamp(nextScale, ZOOM_MIN, ZOOM_MAX));
  }, []);

  useEffect(() => {
    if (zoomMode === 'custom') return;
    const el = centerPaneRef.current;
    const canvas = canvasRef.current;
    if (!el) return;
    let raf = 0;
    const observer = new ResizeObserver(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => computeFitScale(zoomMode));
    });
    observer.observe(el);
    if (canvas) observer.observe(canvas);
    computeFitScale(zoomMode);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [zoomMode, computeFitScale]);

  useEffect(() => {
    if (zoomMode === 'custom') return;
    let timeout: number | undefined;
    const handleResize = () => {
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => computeFitScale(zoomMode), 120);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      if (timeout) window.clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [zoomMode, computeFitScale]);

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

  // Reorder pages - this updates pageOrder AND page codes (fix for C: address sync)
  async function reorderPages(fromIdx: number, toIdx: number) {
    if (!canWrite) return;
    const ids = [...(state.pageOrder.length ? state.pageOrder : state.pages.map((p) => p.id))];
    const [moved] = ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, moved);

    // Update page codes based on new order (non-locked pages get sequential codes)
    const avoid = new Set<string>();
    if (String(state.automationServerType ?? '').toUpperCase() === 'AS-P') {
      avoid.add('01');
      avoid.add('02');
    }

    // Recalculate codes for all non-locked pages based on new order
    const updatedPages: WiringV2Page[] = [];
    let nextCode = String(state.automationServerType ?? '').toUpperCase() === 'AS-P' ? 3 : 1;

    for (const id of ids) {
      const page = pagesById.get(id);
      if (!page) continue;

      if (page.locked) {
        // Locked pages keep their codes
        updatedPages.push(page);
      } else {
        // Non-locked pages get sequential codes based on new order
        while (avoid.has(String(nextCode).padStart(2, '0'))) nextCode++;
        const newCode = String(nextCode).padStart(2, '0');
        updatedPages.push({ ...page, code: newCode });
        nextCode++;
      }
    }

    await apiPatch({ patch: { pageOrder: ids, upsertPages: updatedPages } });
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

  // Get point data from canonical rows for the current page (fix for B: data visibility)
  // Maps terminal_code (DI1, UI1, AO1, DO1, etc.) to the canonical row
  const pagePointData = useMemo(() => {
    if (!selectedPage?.moduleRef?.moduleName) return new Map<string, CanonicalRow>();
    const moduleName = selectedPage.moduleRef.moduleName;
    const templateId = selectedPage.templateId;
    const pointMap = new Map<string, CanonicalRow>();

    // Determine the terminal code prefix based on template type
    const prefix = templateId.replace(/-\d+.*$/, '').replace('-V', '').replace('-FA', ''); // DI, UI, AO, DO

    for (const row of props.canonicalRows) {
      // Match by module_name if available
      if (row.module_name && row.module_name !== moduleName) continue;
      // Also try matching by module_xml_type if module_name not set
      if (!row.module_name && row.module_xml_type) {
        const xmlUpper = String(row.module_xml_type).toUpperCase();
        if (!xmlUpper.includes(prefix)) continue;
      }

      // Extract channel number and construct terminal code
      const inCh = row.input_channel_number;
      const outCh = row.output_channel_number;
      let terminalCode = '';

      // For DI/UI modules, use input_channel_number
      if (prefix === 'DI' || prefix === 'UI') {
        if (inCh != null && String(inCh).trim()) {
          terminalCode = `${prefix}${inCh}`;
        }
      }
      // For AO/DO modules, use output_channel_number
      else if (prefix === 'AO' || prefix === 'DO') {
        if (outCh != null && String(outCh).trim()) {
          terminalCode = `${prefix}${outCh}`;
        }
      }
      // Fallback: try both channels
      else {
        if (inCh != null && String(inCh).trim()) {
          terminalCode = `IN${inCh}`;
        } else if (outCh != null && String(outCh).trim()) {
          terminalCode = `OUT${outCh}`;
        }
      }

      if (terminalCode) {
        pointMap.set(terminalCode, row);
      }
    }

    // Also populate from workbookRows for latest data
    for (const row of workbookRows) {
      if (row.module_name && row.module_name !== moduleName) continue;
      
      const inCh = row.input_channel_number;
      const outCh = row.output_channel_number;
      let terminalCode = '';

      if (prefix === 'DI' || prefix === 'UI') {
        if (inCh != null && String(inCh).trim()) {
          terminalCode = `${prefix}${inCh}`;
        }
      } else if (prefix === 'AO' || prefix === 'DO') {
        if (outCh != null && String(outCh).trim()) {
          terminalCode = `${prefix}${outCh}`;
        }
      }

      // Workbook takes precedence over canonical rows
      if (terminalCode) {
        pointMap.set(terminalCode, row);
      }
    }

    return pointMap;
  }, [selectedPage, props.canonicalRows, workbookRows]);

  // Print-grid rendering with proper rowSpan grouping (fix for A: parity)
  function renderGrid() {
    if (!selectedPage) return <div className="muted">No pages.</div>;
    const template = getTemplate(selectedPage.templateId);
    const terminalGroups = groupTerminalsForPrintGrid(template.terminals);

    return (
      <div style={{ background: '#fff', padding: 16, border: '1px solid #ccc' }}>
        {/* Page header matching golden reference format */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#000' }}>
            {selectedPage.code}_{selectedPage.templateId}
          </div>
          <div style={{ fontSize: 12, color: '#000' }}>
            {selectedPage.templateId}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn secondary" onClick={() => nextPage(-1)} disabled={!selectedPage || orderedPages[0]?.id === selectedPage.id}>
            ← Prev
          </button>
          <button className="btn secondary" onClick={() => nextPage(1)} disabled={!selectedPage || orderedPages[orderedPages.length - 1]?.id === selectedPage.id}>
            Next →
          </button>
        </div>

        {/* Print-grid table matching Kytkentakuva_DI16.png golden reference */}
        <div style={{ overflowX: 'auto' }}>
          <table style={printGridStyles.table}>
            <thead>
              {/* Row 1: Main group headers */}
              <tr>
                <th rowSpan={2} style={{ ...printGridStyles.th, width: 100 }}>Tunnus</th>
                <th rowSpan={2} style={{ ...printGridStyles.th, width: 140 }}>Teksti</th>
                <th rowSpan={2} style={{ ...printGridStyles.th, width: 70 }}>Liitin</th>
                <th colSpan={3} style={printGridStyles.thGroup}>Kaapelointitiedot</th>
                <th colSpan={2} style={printGridStyles.thGroup}>Kaapeli 2</th>
                <th colSpan={2} style={printGridStyles.thGroup}>Minne johdetaan</th>
                <th rowSpan={2} style={{ ...printGridStyles.th, width: 50 }}>Kytketty</th>
                <th rowSpan={2} style={{ ...printGridStyles.th, width: 50 }}>Tarkastettu</th>
              </tr>
              {/* Row 2: Sub-headers */}
              <tr>
                {/* Kaapeli 1 sub-columns */}
                <th style={{ ...printGridStyles.th, width: 70 }}>Pari nro<br/>tai<br/>johdin</th>
                <th style={{ ...printGridStyles.th, width: 80 }}>Tyyppi<br/>koko<br/>nro</th>
                <th style={{ ...printGridStyles.th, width: 100 }}>Välikytkentä-<br/>paikka ja<br/>liittimet</th>
                {/* Kaapeli 2 sub-columns */}
                <th style={{ ...printGridStyles.th, width: 80 }}>Tyyppi<br/>koko<br/>nro</th>
                <th style={{ ...printGridStyles.th, width: 70 }}>Pari nro<br/>tai<br/>johdin</th>
                {/* Minne johdetaan sub-columns */}
                <th style={{ ...printGridStyles.th, width: 60 }}>Liitin</th>
                <th style={{ ...printGridStyles.th, width: 100 }}>Kytkentäpaikka</th>
              </tr>
            </thead>
            <tbody>
              {terminalGroups.map((group) => {
                const groupRows = Math.max(group.connectorLines.length, 1);
                const k = keyForTerminal(selectedPage.id, group.terminalCode);
                const terminalState = state.terminals[k] ?? {};

                // Get point data from canonical rows (fix for B: data visibility)
                // First try the terminal state, then workbook/canonical rows
                const pointData = pagePointData.get(group.terminalCode);
                const deviceTag = terminalState.deviceText || String(pointData?.point_name ?? '');
                const deviceDesc = terminalState.description || String(pointData?.point_descr ?? '');

                return group.connectorLines.map((connectorLine, lineIdx) => (
                  <tr key={`${k}:${lineIdx}`}>
                    {/* Cells with rowSpan (only on first row of group) */}
                    {lineIdx === 0 && (
                      <>
                        {/* Tunnus (device tag) - rowSpan */}
                        <td style={printGridStyles.td} rowSpan={groupRows}>
                          <input
                            style={printGridStyles.input}
                            defaultValue={deviceTag}
                            disabled={!canWrite}
                            onBlur={(e) => patchTerminal(selectedPage.id, group.terminalCode, { deviceText: e.currentTarget.value })}
                          />
                        </td>
                        {/* Teksti (description) - rowSpan */}
                        <td style={printGridStyles.td} rowSpan={groupRows}>
                          <input
                            style={printGridStyles.input}
                            defaultValue={deviceDesc}
                            disabled={!canWrite}
                            onBlur={(e) => patchTerminal(selectedPage.id, group.terminalCode, { ...terminalState, description: e.currentTarget.value } as WiringV2TerminalRow)}
                          />
                        </td>
                      </>
                    )}
                    {/* Liitin (connector line) - per row */}
                    <td style={{ ...printGridStyles.td, fontSize: 9, lineHeight: 1.2 }}>
                      {connectorLine}
                    </td>
                    {/* Kaapeli 1: Pari nro tai johdin - per row */}
                    <td style={printGridStyles.td}>
                      {lineIdx === 0 && (
                        <input
                          style={printGridStyles.input}
                          defaultValue={(terminalState as Record<string, unknown>).cable1Pair as string ?? ''}
                          disabled={!canWrite}
                          onBlur={(e) => patchTerminal(selectedPage.id, group.terminalCode, { ...terminalState, cable1Pair: e.currentTarget.value } as WiringV2TerminalRow)}
                        />
                      )}
                    </td>
                    {/* Kaapeli 1: Tyyppi koko nro - rowSpan */}
                    {lineIdx === 0 && (
                      <td style={printGridStyles.td} rowSpan={groupRows}>
                        <input
                          style={printGridStyles.input}
                          defaultValue={terminalState.cable1 ?? ''}
                          disabled={!canWrite}
                          onBlur={(e) => patchTerminal(selectedPage.id, group.terminalCode, { cable1: e.currentTarget.value })}
                        />
                      </td>
                    )}
                    {/* Välikytkentäpaikka ja liittimet - per row */}
                    <td style={printGridStyles.td}>
                      {lineIdx === 0 && (
                        <input
                          style={printGridStyles.input}
                          defaultValue={(terminalState as Record<string, unknown>).intermediateTerminal as string ?? ''}
                          disabled={!canWrite}
                          onBlur={(e) => patchTerminal(selectedPage.id, group.terminalCode, { ...terminalState, intermediateTerminal: e.currentTarget.value } as WiringV2TerminalRow)}
                        />
                      )}
                    </td>
                    {/* Kaapeli 2: Tyyppi koko nro - rowSpan */}
                    {lineIdx === 0 && (
                      <td style={printGridStyles.td} rowSpan={groupRows}>
                        <input
                          style={printGridStyles.input}
                          defaultValue={terminalState.cable2 ?? ''}
                          disabled={!canWrite}
                          onBlur={(e) => patchTerminal(selectedPage.id, group.terminalCode, { cable2: e.currentTarget.value })}
                        />
                      </td>
                    )}
                    {/* Kaapeli 2: Pari nro tai johdin - per row */}
                    <td style={printGridStyles.td}>
                      {lineIdx === 0 && (
                        <input
                          style={printGridStyles.input}
                          defaultValue={(terminalState as Record<string, unknown>).cable2Pair as string ?? ''}
                          disabled={!canWrite}
                          onBlur={(e) => patchTerminal(selectedPage.id, group.terminalCode, { ...terminalState, cable2Pair: e.currentTarget.value } as WiringV2TerminalRow)}
                        />
                      )}
                    </td>
                    {/* Minne johdetaan: Liitin - per row */}
                    <td style={printGridStyles.td}>
                      {lineIdx === 0 && (
                        <input
                          style={printGridStyles.input}
                          defaultValue={(terminalState as Record<string, unknown>).destinationConnector as string ?? ''}
                          disabled={!canWrite}
                          onBlur={(e) => patchTerminal(selectedPage.id, group.terminalCode, { ...terminalState, destinationConnector: e.currentTarget.value } as WiringV2TerminalRow)}
                        />
                      )}
                    </td>
                    {/* Minne johdetaan: Kytkentäpaikka - rowSpan */}
                    {lineIdx === 0 && (
                      <td style={printGridStyles.td} rowSpan={groupRows}>
                        <input
                          style={printGridStyles.input}
                          defaultValue={terminalState.destination ?? ''}
                          disabled={!canWrite}
                          onBlur={(e) => patchTerminal(selectedPage.id, group.terminalCode, { destination: e.currentTarget.value })}
                        />
                      </td>
                    )}
                    {/* Kytketty (checkbox) - rowSpan */}
                    {lineIdx === 0 && (
                      <td style={{ ...printGridStyles.td, textAlign: 'center' }} rowSpan={groupRows}>
                        <input
                          type="checkbox"
                          disabled={!canWrite}
                          defaultChecked={Boolean((terminalState as Record<string, unknown>).connected)}
                          onChange={(e) => patchTerminal(selectedPage.id, group.terminalCode, { ...terminalState, connected: e.currentTarget.checked } as WiringV2TerminalRow)}
                        />
                      </td>
                    )}
                    {/* Tarkastettu (checkbox) - rowSpan */}
                    {lineIdx === 0 && (
                      <td style={{ ...printGridStyles.td, textAlign: 'center' }} rowSpan={groupRows}>
                        <input
                          type="checkbox"
                          disabled={!canWrite}
                          defaultChecked={Boolean((terminalState as Record<string, unknown>).verified)}
                          onChange={(e) => patchTerminal(selectedPage.id, group.terminalCode, { ...terminalState, verified: e.currentTarget.checked } as WiringV2TerminalRow)}
                        />
                      </td>
                    )}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 8, fontSize: 10, color: '#000' }}>
          Sarakkeet: docs/ui_refs/wiring_editor_v2/Kytkentakuva_DI16.png
        </div>
      </div>
    );
  }

  const zoomPercent = Math.round(scale * 100);
  const setCustomZoom = (nextScale: number) => {
    setZoomMode('custom');
    setScale(clamp(nextScale, ZOOM_MIN, ZOOM_MAX));
  };

  const pagesPanel = (
    <div className="card wiring-panel">
      {/* Add module controls at TOP of card (per FINAL-S2) */}
      <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #eee' }}>
        <div className="h2" style={{ marginBottom: 8 }}>Add Module</div>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Module name"
            value={newModuleName}
            disabled={!canWrite}
            onChange={(e) => setNewModuleName(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 100 }}
          />
          <select
            className="select"
            value={newTemplateId}
            disabled={!canWrite}
            onChange={(e) => setNewTemplateId(e.currentTarget.value as ModuleTemplateId)}
            style={{ width: 90 }}
          >
            {TEMPLATE_IDS.map((tid) => (
              <option key={tid} value={tid}>{tid}</option>
            ))}
          </select>
          <button className="btn" disabled={!canWrite || !newModuleName.trim()} onClick={addModulePage}>
            +
          </button>
        </div>
      </div>

      {/* Pages list (flat, no folders per FINAL-S1) */}
      <div className="h2" style={{ marginBottom: 8 }}>Pages</div>
      <div className="muted small" style={{ marginBottom: 8 }}>
        Drag & drop to reorder (codes update on reorder)
      </div>
      <ul className="list wiring-panel-body">
        {orderedPages.map((p, idx) => {
          const isLocked = Boolean(p.locked);
          const isSelected = p.id === selectedPage?.id;
          return (
            <li
              key={p.id}
              className="listItem"
              draggable={canWrite && !isLocked}
              onDragStart={(e) => onDragStart(e, idx)}
              onDrop={(e) => onDrop(e, idx)}
              onDragOver={onDragOver}
              style={{ cursor: canWrite && !isLocked ? 'grab' : 'default' }}
            >
              <button
                className={isSelected ? 'btn' : 'btn secondary'}
                style={{ width: '100%', justifyContent: 'space-between', fontSize: 11 }}
                onClick={() => setSelectedPageId(p.id)}
                type="button"
              >
                <span>
                  <span className="mono">{p.code}</span> {p.title}
                </span>
                {isLocked && <span className="muted small">🔒</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const inspectorPanel = (
    <div className="card wiring-panel">
      <div className="h2" style={{ marginBottom: 8 }}>Inspector</div>
      <div className="muted small" style={{ marginBottom: 12 }}>
        {selectedPage ? (
          <>
            <div><span className="mono">{selectedPage.code}</span> {selectedPage.title}</div>
            <div className="small">Template: <span className="mono">{selectedPage.templateId}</span></div>
          </>
        ) : (
          <span>No page selected.</span>
        )}
      </div>
      <div className="h2" style={{ marginBottom: 8 }}>Zoom</div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button className="btn secondary" type="button" onClick={() => setCustomZoom(scale - 0.1)}>
          −
        </button>
        <div className="mono" style={{ minWidth: 56, textAlign: 'center' }}>
          {zoomPercent}%
        </div>
        <button className="btn secondary" type="button" onClick={() => setCustomZoom(scale + 0.1)}>
          +
        </button>
        <button
          className={zoomMode === 'fitWidth' ? 'btn' : 'btn secondary'}
          type="button"
          onClick={() => setZoomMode('fitWidth')}
        >
          Fit width
        </button>
        <button
          className={zoomMode === 'fitPage' ? 'btn' : 'btn secondary'}
          type="button"
          onClick={() => setZoomMode('fitPage')}
        >
          Fit page
        </button>
      </div>
    </div>
  );

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
      for (const c of WORKBOOK_COLUMNS) {
        patches.push({ rowIndex: idx, field: c.key, value: row?.[c.key] ?? '' });
      }
    });
    await saveWorkbookPatches(patches);
  }

  // Import handler - caches file data for accept flow (fix for D: no re-select)
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

      // If there are changes, cache file and show banner
      if (dryData.wouldCreate > 0 || dryData.wouldUpdate > 0) {
        // Cache the file data for accept flow (fix for D)
        const fileData = await fileToBase64(file);
        setImportSession({
          filename: file.name,
          preview: {
            added: dryData.wouldCreate,
            modified: dryData.wouldUpdate,
            removed: 0,
          },
          fileData,
          fileType: file.type || 'application/octet-stream',
        });
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

  // Accept import changes - uses cached data, creates revision (fix for D)
  const handleAcceptImport = useCallback(async () => {
    if (!canWrite || !importSession) return;

    setImporting(true);
    try {
      // Convert cached base64 back to file for commit
      const byteString = atob(importSession.fileData);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: importSession.fileType });
      const file = new File([blob], importSession.filename, { type: importSession.fileType });

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
        setImportSession(null);
        // Refresh to load new data
        window.location.reload();
      } else {
        alert(`Import failed: ${commitData.message ?? 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  }, [canWrite, importSession, projectId, subCenterId]);

  // Dismiss import pending (cancel)
  const handleDismissImport = useCallback(() => {
    setImportSession(null);
  }, []);

  // Export XML handler
  const handleExportXML = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ projectId, subCenterId });
      const res = await fetch(`/api/wiring-diagrams/export-xml?${params}`);
      if (!res.ok) {
        const msg = await res.text();
        alert(`Export error: ${msg}`);
        return;
      }
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

  // Import/Export toolbar (appears in both tabs per docs/03_IMPORT_EXPORT.md)
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

  return (
    <div className="wiring-workspace" ref={workspaceRootRef}>
      <div className="row spaceBetween" style={{ gap: 12 }}>
        <div>
          <h1>WIRING_DIAGRAMS</h1>
          <div className="muted">Kytkentäkuvaeditori</div>
        </div>
        <Link className="btn secondary" href={`/app/projects/${projectId}/centers/${subCenterId}/documents`}>
          Back to documents
        </Link>
      </div>

      {/* Import changes pending banner (per docs/04_REVISION_WORKFLOW.md) */}
      {importSession && (
        <div className="card" style={{ marginBottom: 12, background: '#fff3cd', border: '1px solid #ffc107' }}>
          <div className="row spaceBetween" style={{ gap: 12 }}>
            <div>
              <div className="h2" style={{ color: '#856404' }}>⚠️ Import changes pending</div>
              <div className="muted" style={{ color: '#856404' }}>
                File: {importSession.filename} — {importSession.preview.added} added, {importSession.preview.modified} modified
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
          </div>

          <div className="row" style={{ gap: 8 }}>
            <button className={tab === 'editor' ? 'btn' : 'btn secondary'} onClick={() => setTab('editor')}>
              Kytkentäkuva
            </button>
            <button className={tab === 'workbook' ? 'btn' : 'btn secondary'} onClick={() => setTab('workbook')}>
              Työkirja
            </button>
            <button
              className="btn secondary wiring-pages-toggle"
              type="button"
              onClick={() => setPagesDrawerOpen(true)}
            >
              Pages
            </button>
            <button
              className="btn secondary wiring-inspector-toggle"
              type="button"
              onClick={() => setInspectorDrawerOpen(true)}
            >
              Inspector
            </button>
          </div>

          {/* Import/Export in toolbar (both tabs per docs/03_IMPORT_EXPORT.md) */}
          {renderImportExportToolbar()}
        </div>
      </div>

      {tab === 'editor' ? (
        <>
          <div className="wiring-workspace__grid">
            {/* LEFT: Pages tree with Add module in header (per FINAL-S2) */}
            <div className="wiring-workspace__column wiring-workspace__left">
              {pagesPanel}
            </div>

            {/* CENTER: A4 wiring diagram (per FINAL-S2) */}
            <div className="wiring-workspace__column wiring-workspace__center" ref={centerPaneRef}>
              <div className="wiring-canvas-scroll" style={{ padding: CENTER_PANE_PADDING }}>
                <div className="wiring-canvas-frame">
                  <div
                    className="wiring-canvas"
                    ref={canvasRef}
                    style={{
                      width: A4_BASE_WIDTH,
                      transform: `scale(${scale})`,
                    }}
                  >
                    {renderGrid()}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Inspector */}
            <div className="wiring-workspace__column wiring-workspace__right">
              {inspectorPanel}
            </div>
          </div>

          <div
            className={`wiring-drawer-overlay ${pagesDrawerOpen || inspectorDrawerOpen ? 'wiring-drawer-overlay--open' : ''}`}
            onClick={() => {
              setPagesDrawerOpen(false);
              setInspectorDrawerOpen(false);
            }}
          />
          <div className={`wiring-drawer wiring-drawer--left ${pagesDrawerOpen ? 'wiring-drawer--open' : ''}`}>
            <div className="row spaceBetween" style={{ marginBottom: 12 }}>
              <div className="h2">Pages</div>
              <button className="btn secondary" type="button" onClick={() => setPagesDrawerOpen(false)}>
                Close
              </button>
            </div>
            {pagesPanel}
          </div>
          <div className={`wiring-drawer wiring-drawer--right ${inspectorDrawerOpen ? 'wiring-drawer--open' : ''}`}>
            <div className="row spaceBetween" style={{ marginBottom: 12 }}>
              <div className="h2">Inspector</div>
              <button className="btn secondary" type="button" onClick={() => setInspectorDrawerOpen(false)}>
                Close
              </button>
            </div>
            {inspectorPanel}
          </div>
        </>
      ) : (
        renderWorkbook()
      )}
    </div>
  );
}
