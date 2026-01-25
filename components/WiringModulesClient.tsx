'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type WiringModuleSummary = {
  module_name: string;
  module_xml_type?: string | null;
  module_id?: string | null;
  pointCount: number;
};

export function WiringModulesClient(props: {
  projectId: string;
  subCenterId: string;
  canWrite: boolean;
  modules: WiringModuleSummary[];
  moduleBaseHref: string; // e.g. /app/.../editor/modules
  staleModuleOrder?: string[];
}) {
  const { projectId, subCenterId, canWrite, moduleBaseHref } = props;
  const [items, setItems] = useState<WiringModuleSummary[]>(props.modules);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const order = useMemo(() => items.map((m) => m.module_name), [items]);

  function move(idx: number, dir: -1 | 1) {
    setOk(null);
    setError(null);
    setItems((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[idx];
      next[idx] = next[j];
      next[j] = tmp;
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch('/api/wiring-diagrams/editor-state', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId, subCenterId, moduleOrder: order }),
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
      {props.staleModuleOrder && props.staleModuleOrder.length > 0 ? (
        <div className="card" style={{ borderLeft: '4px solid #c77' }}>
          <h3 className="h2">Notice</h3>
          <div className="muted small">
            Editor has saved module order entries that are not present in current canonical data:
          </div>
          <div className="mono small" style={{ marginTop: 6 }}>
            {props.staleModuleOrder.join(', ')}
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="row spaceBetween">
          <h2 className="h2">Modules</h2>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" type="button" onClick={save} disabled={!canWrite || busy}>
              {busy ? 'Saving…' : 'Save order'}
            </button>
            {!canWrite && <div className="muted small">VIEWER role: editing disabled.</div>}
          </div>
        </div>

        {error && (
          <div className="error" style={{ marginTop: 10 }}>
            {error}
          </div>
        )}
        {ok && (
          <div style={{ marginTop: 10, padding: 10, borderLeft: '4px solid #6a6', background: '#0a0a0a10' }}>
            {ok}
          </div>
        )}

        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Order</th>
                <th>Module name</th>
                <th>Module type</th>
                <th>Module id</th>
                <th>Points</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((m, idx) => (
                <tr key={m.module_name}>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => move(idx, -1)}
                        disabled={!canWrite || busy || idx === 0}
                      >
                        ↑
                      </button>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => move(idx, 1)}
                        disabled={!canWrite || busy || idx === items.length - 1}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="mono">{m.module_name}</td>
                  <td className="mono">{m.module_xml_type ?? ''}</td>
                  <td className="mono">{m.module_id ?? ''}</td>
                  <td className="mono">{m.pointCount}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link className="btn secondary" href={`${moduleBaseHref}/${encodeURIComponent(m.module_name)}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
