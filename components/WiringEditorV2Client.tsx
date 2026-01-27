'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import Link from 'next/link';
import type { CanonicalRow, WiringV2Page, WiringV2State, WiringV2TerminalRow } from '@/lib/wiringEditorV2';
import { extractTerminalCode } from '@/lib/wiringEditor';
import { MODULE_TEMPLATES, type ModuleTemplateId, getTemplate } from '@/lib/templates/moduleTemplates';

type Props = {
  projectId: string;
  subCenterId: string;
  canWrite: boolean;
  initialState: WiringV2State;
  canonicalRows: CanonicalRow[];
};

type Tab = 'editor' | 'workbook';

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

function getFieldString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
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
    const moduleName = selectedPage.moduleRef?.moduleName ?? selectedPage.title;
    const pointByTerminal = new Map<string, CanonicalRow>();
    for (const r of workbookRows) {
      if (getFieldString(r?.['module_name']).trim() !== moduleName) continue;
      const term = extractTerminalCode(r as Record<string, unknown>);
      if (!term || pointByTerminal.has(term)) continue;
      pointByTerminal.set(term, r);
    }
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

        <table className="table print-grid" style={{ minWidth: 1400 }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: 140 }}>Tunnus</th>
              <th rowSpan={2} style={{ width: 220 }}>Teksti</th>
              <th rowSpan={2} style={{ width: 140 }}>Liitin</th>
              <th colSpan={3} style={{ width: 360 }}>Kaapeli 1</th>
              <th colSpan={2} style={{ width: 240 }}>Kaapeli 2</th>
              <th colSpan={2} style={{ width: 260 }}>Minne johdetaan</th>
              <th rowSpan={2} style={{ width: 180 }}>Symboli / Piirrosmerkintä</th>
              <th rowSpan={2} style={{ width: 100 }}>Kytketty</th>
              <th rowSpan={2} style={{ width: 110 }}>Tarkastettu</th>
            </tr>
            <tr>
              <th style={{ width: 140 }}>Tyyppi koko nro</th>
              <th style={{ width: 120 }}>Pari nro / johdin</th>
              <th style={{ width: 140 }}>Välikytkentäpaikka ja liittimet</th>
              <th style={{ width: 140 }}>Tyyppi koko nro</th>
              <th style={{ width: 120 }}>Pari nro / johdin</th>
              <th style={{ width: 140 }}>Kytkentäpaikka</th>
              <th style={{ width: 120 }}>Liitin</th>
            </tr>
          </thead>
          <tbody>
            {terminals.map((t) => {
              const k = keyForTerminal(selectedPage.id, t.terminal_code);
              const row = state.terminals[k] ?? {};
              const point = pointByTerminal.get(t.terminal_code);
              const pointName = getFieldString(point?.['point_name']).trim();
              const pointText = getFieldString(point?.['note2']).trim() || getFieldString(point?.['point_descr']).trim();
              const connectorLines = t.connector_lines && t.connector_lines.length > 0 ? t.connector_lines : [t.print_label];
              const groupRows = Math.max(connectorLines.length, 1);

              return connectorLines.map((line, idx) => (
                <tr key={`${k}:${idx}`}>
                  {idx === 0 ? (
                    <>
                      <td rowSpan={groupRows}>
                        {pointName ? <div className="mono">{pointName}</div> : <span className="muted">—</span>}
                      </td>
                      <td rowSpan={groupRows}>
                        {pointText ? <div>{pointText}</div> : <span className="muted">—</span>}
                      </td>
                    </>
                  ) : null}
                  <td>
                    <div className="mono">{line}</div>
                  </td>
                  {idx === 0 ? (
                    <td rowSpan={groupRows}>
                      <input
                        className="input"
                        defaultValue={row.cable1 ?? ''}
                        disabled={!canWrite}
                        onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { cable1: e.currentTarget.value })}
                      />
                    </td>
                  ) : null}
                  <td>
                    <input
                      className="input"
                      defaultValue={row.cable1Pair ?? ''}
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { cable1Pair: e.currentTarget.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      defaultValue={row.intermediate ?? ''}
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { intermediate: e.currentTarget.value })}
                    />
                  </td>
                  {idx === 0 ? (
                    <td rowSpan={groupRows}>
                      <input
                        className="input"
                        defaultValue={row.cable2 ?? ''}
                        disabled={!canWrite}
                        onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { cable2: e.currentTarget.value })}
                      />
                    </td>
                  ) : null}
                  <td>
                    <input
                      className="input"
                      defaultValue={row.cable2Pair ?? ''}
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { cable2Pair: e.currentTarget.value })}
                    />
                  </td>
                  {idx === 0 ? (
                    <td rowSpan={groupRows}>
                      <input
                        className="input"
                        defaultValue={row.destination ?? ''}
                        disabled={!canWrite}
                        onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { destination: e.currentTarget.value })}
                      />
                    </td>
                  ) : null}
                  <td>
                    <input
                      className="input"
                      defaultValue={row.destinationConnector ?? ''}
                      disabled={!canWrite}
                      onBlur={(e) => patchTerminal(selectedPage.id, t.terminal_code, { destinationConnector: e.currentTarget.value })}
                    />
                  </td>
                  {idx === 0 ? (
                    <td rowSpan={groupRows}>
                      {row.symbol?.type ? (
                        <div className="mono small">
                          {row.symbol.type}
                          {row.symbol.label ? ` ${row.symbol.label}` : ''}
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  ) : null}
                  {idx === 0 ? (
                    <td rowSpan={groupRows} style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        defaultChecked={Boolean(row.connected)}
                        disabled={!canWrite}
                        onChange={(e) => patchTerminal(selectedPage.id, t.terminal_code, { connected: e.currentTarget.checked })}
                      />
                    </td>
                  ) : null}
                  {idx === 0 ? (
                    <td rowSpan={groupRows} style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        defaultChecked={Boolean(row.inspected)}
                        disabled={!canWrite}
                        onChange={(e) => patchTerminal(selectedPage.id, t.terminal_code, { inspected: e.currentTarget.checked })}
                      />
                    </td>
                  ) : null}
                </tr>
              ));
            })}
          </tbody>
        </table>

        <div className="muted small" style={{ marginTop: 10 }}>
          Note: When a field device is wired directly to the module (default), the cable identifier belongs to <b>Kaapeli 1</b>. Use <b>Kaapeli 2</b> for intermediate terminal/segment cases.
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
              Editor
            </button>
            <button className={tab === 'workbook' ? 'btn' : 'btn secondary'} onClick={() => setTab('workbook')}>
              Työkirja
            </button>
          </div>
        </div>
      </div>

      {tab === 'editor' ? (
        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <div className="card" style={{ width: 320, padding: 12 }}>
            <div className="h2">Pages</div>
            <div className="muted small" style={{ marginBottom: 8 }}>Drag & drop to reorder (locked pages cannot be moved).</div>
            <ul className="list">
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
                      style={{ width: '100%', justifyContent: 'space-between' }}
                      onClick={() => setSelectedPageId(p.id)}
                      type="button"
                    >
                      <span>
                        <span className="mono">{p.code}_{p.templateId}</span> {p.title}
                      </span>
                      {isLocked && <span className="muted small">LOCKED</span>}
                    </button>
                  </li>
                );
              })}
            </ul>

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
