'use client';

import { useMemo, useState } from 'react';

export type WiringPointView = {
  terminal_code: string;
  io: 'IN' | 'OUT' | '';
  input_channel_number?: number | string | null;
  output_channel_number?: number | string | null;
  point_name?: string | null;
  point_xml_type?: string | null;
  point_descr?: string | null;
  note2?: string | null;
};

export type WiringSymbol = {
  type: string;
  label?: string;
};

const SYMBOL_TYPES = ['NONE', 'SENSOR', 'RELAY', 'SWITCH', 'VALVE', 'MOTOR', 'OTHER'] as const;

export function WiringModuleEditorClient(props: {
  projectId: string;
  subCenterId: string;
  canWrite: boolean;
  points: WiringPointView[];
  initialSymbols: Record<string, WiringSymbol>; // terminal_code -> symbol
  unknownTerminalCodes?: string[];
}) {
  const { projectId, subCenterId, canWrite, points } = props;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const terminals = useMemo(() => points.map((p) => p.terminal_code).filter((t) => !!t), [points]);

  const [symbols, setSymbols] = useState<Record<string, WiringSymbol>>(() => {
    const out: Record<string, WiringSymbol> = {};
    for (const t of terminals) {
      const s = props.initialSymbols[t];
      if (s && s.type) out[t] = { type: s.type, label: s.label };
    }
    return out;
  });

  function setType(t: string, type: string) {
    setOk(null);
    setError(null);
    setSymbols((prev) => {
      const next = { ...prev };
      if (!type || type === 'NONE') {
        delete next[t];
        return next;
      }
      next[t] = { type, label: prev[t]?.label };
      return next;
    });
  }

  function setLabel(t: string, label: string) {
    setOk(null);
    setError(null);
    setSymbols((prev) => {
      const next = { ...prev };
      if (!next[t]) {
        // If user types label but no type, set OTHER.
        next[t] = { type: 'OTHER', label };
        return next;
      }
      next[t] = { ...next[t], label };
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setOk(null);
    setError(null);
    try {
      const patch: Record<string, { type?: string; label?: string } | null> = {};
      for (const t of terminals) {
        const s = symbols[t];
        if (!s || !s.type || s.type === 'NONE') patch[t] = null;
        else patch[t] = { type: s.type, label: s.label ?? '' };
      }

      const res = await fetch('/api/wiring-diagrams/editor-state', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId, subCenterId, symbolsPatch: patch }),
      });
      const ct = res.headers.get('content-type') ?? '';
      const payload = ct.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) {
        setError(typeof payload === 'string' ? payload : payload?.message ?? 'Error');
        return;
      }
      setOk('Saved.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {props.unknownTerminalCodes && props.unknownTerminalCodes.length > 0 ? (
        <div className="card" style={{ borderLeft: '4px solid #c77' }}>
          <h3 className="h2">Validation</h3>
          <div className="muted small">
            Editor contains symbols referencing unknown terminal codes. They are ignored by the UI and will not break the document.
          </div>
          <div className="mono small" style={{ marginTop: 6 }}>{props.unknownTerminalCodes.join(', ')}</div>
        </div>
      ) : null}

      <div className="card">
        <div className="row spaceBetween">
          <div>
            <h2 className="h2">Channels</h2>
            <div className="muted small">Edit symbols per terminal. Canonical data is read-only; editor state is stored in document settings.</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" type="button" onClick={save} disabled={!canWrite || busy}>
              {busy ? 'Saving…' : 'Save symbols'}
            </button>
            {!canWrite && <div className="muted small">VIEWER role: editing disabled.</div>}
          </div>
        </div>

        {error && <div className="error" style={{ marginTop: 10 }}>{error}</div>}
        {ok && <div style={{ marginTop: 10, padding: 10, borderLeft: '4px solid #6a6', background: '#0a0a0a10' }}>{ok}</div>}

        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Address</th>
                <th>Terminal</th>
                <th>Point name</th>
                <th>Type</th>
                <th>Description</th>
                <th style={{ minWidth: 220 }}>Symbol</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, idx) => {
                const term = p.terminal_code;
                const sym = term ? symbols[term] : undefined;
                const symType = sym?.type ?? 'NONE';
                return (
                  <tr key={`${term}-${idx}`}>
                    <td>
                      {p.io ? <span className="badge">{p.io}</span> : <span className="muted">—</span>}
                    </td>
                    <td className="mono">
                      {p.io === 'IN' ? String(p.input_channel_number ?? '') : p.io === 'OUT' ? String(p.output_channel_number ?? '') : ''}
                    </td>
                    <td className="mono">
                      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                        <span>{term || '—'}</span>
                        {sym && sym.type ? <span className="badge">{sym.type}</span> : null}
                      </div>
                    </td>
                    <td>{p.point_name ?? ''}</td>
                    <td className="mono">{p.point_xml_type ?? ''}</td>
                    <td>{p.note2 ?? p.point_descr ?? ''}</td>
                    <td>
                      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                        <select
                          value={symType}
                          onChange={(e) => setType(term, e.target.value)}
                          disabled={!canWrite || busy || !term}
                        >
                          {SYMBOL_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <input
                          className="input"
                          placeholder="Label"
                          value={sym?.label ?? ''}
                          onChange={(e) => setLabel(term, e.target.value)}
                          disabled={!canWrite || busy || !term}
                          style={{ minWidth: 120 }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
