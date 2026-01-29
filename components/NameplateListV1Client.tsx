'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  buildNameplateV1View,
  normalizeTag,
  type NameplateOverride,
  type NameplateRow,
  type NameplateV1State,
} from '@/lib/derivedLists/nameplatesV1';

type ApiResponse = {
  ok: true;
  baseRows: NameplateRow[];
  rows: Array<NameplateRow & { origin: 'derived' | 'manual' }>;
  excludedDerived: NameplateRow[];
  state: NameplateV1State;
};

type Props = {
  projectId: string;
  subCenterId: string;
  canWrite: boolean;
  initialBaseRows: NameplateRow[];
  initialState: NameplateV1State;
};

function cloneState(s: NameplateV1State): NameplateV1State {
  return {
    version: 1,
    updatedAt: s.updatedAt,
    overrides: { ...(s.overrides ?? {}) },
    manualRows: (s.manualRows ?? []).map((r) => ({ tag: r.tag, description: r.description })),
  };
}

export default function NameplateListV1Client(props: Props) {
  const { projectId, subCenterId, canWrite } = props;

  const [baseRows, setBaseRows] = useState<NameplateRow[]>(() => props.initialBaseRows);
  const [state, setState] = useState<NameplateV1State>(() => cloneState(props.initialState));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const view = useMemo(() => buildNameplateV1View({ baseRows, state }), [baseRows, state]);

  const [newTag, setNewTag] = useState('');
  const [newDesc, setNewDesc] = useState('');

  function setOverride(tag: string, patch: NameplateOverride) {
    const key = normalizeTag(tag);
    if (!key) return;
    setState((prev) => {
      const next = cloneState(prev);
      const curr = next.overrides[key] ?? {};
      next.overrides[key] = { ...curr, ...patch };
      return next;
    });
    setDirty(true);
  }

  function clearOverride(tag: string) {
    const key = normalizeTag(tag);
    if (!key) return;
    setState((prev) => {
      const next = cloneState(prev);
      delete next.overrides[key];
      return next;
    });
    setDirty(true);
  }

  function updateManualRow(idx: number, patch: Partial<NameplateRow>) {
    setState((prev) => {
      const next = cloneState(prev);
      const mr = [...(next.manualRows ?? [])];
      const row = mr[idx];
      if (!row) return prev;
      mr[idx] = {
        tag: patch.tag !== undefined ? normalizeTag(patch.tag) : row.tag,
        description: patch.description !== undefined ? String(patch.description) : row.description,
      };
      next.manualRows = mr.filter((r) => normalizeTag(r.tag));
      return next;
    });
    setDirty(true);
  }

  function deleteManualRow(idx: number) {
    setState((prev) => {
      const next = cloneState(prev);
      next.manualRows = (next.manualRows ?? []).filter((_, i) => i !== idx);
      return next;
    });
    setDirty(true);
  }

  function addManualRow() {
    const tag = normalizeTag(newTag);
    if (!tag) return;
    setState((prev) => {
      const next = cloneState(prev);
      next.manualRows = [...(next.manualRows ?? []), { tag, description: newDesc.trim() }];
      return next;
    });
    setNewTag('');
    setNewDesc('');
    setDirty(true);
  }

  async function refresh() {
    setError(null);
    const res = await fetch(`/api/derived-lists/v1/nameplates?projectId=${projectId}&subCenterId=${subCenterId}`);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const json = (await res.json()) as ApiResponse;
    setBaseRows(json.baseRows ?? []);
    setState(cloneState(json.state));
    setDirty(false);
  }

  async function save() {
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/derived-lists/v1/nameplates', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId, subCenterId, overrides: state.overrides, manualRows: state.manualRows }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="doc-editor" style={{ display: 'grid', gap: 12 }}>
      <div className="doc-editor-topbar">
        <div className="doc-editor-topbar__row doc-editor-topbar__row--breadcrumb">
          <div className="doc-editor-breadcrumb">Documents / Nameplate list</div>
          <div className="row doc-editor-topbar__actions" style={{ gap: 8 }}>
            <label className="btn secondary" htmlFor="global-nav-toggle">
              ☰ Menu
            </label>
            <Link className="btn secondary" href={`/app/projects/${projectId}/centers/${subCenterId}/documents`}>
              Exit focus
            </Link>
          </div>
        </div>
        <div className="doc-editor-topbar__row doc-editor-topbar__row--header">
          <div>
            <div className="doc-editor-title">Kilpiluettelo (v1)</div>
            <div className="doc-editor-meta">Rev — · Draft</div>
          </div>
          <div className="row doc-editor-topbar__actions" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn secondary" onClick={refresh} disabled={saving}>
              Refresh derived
            </button>
            <button className="btn" onClick={save} disabled={!canWrite || saving || !dirty}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="muted small doc-editor-description">
        Johdettu kytkentäkuvista. Muutokset tallennetaan overrideina; derivointi voidaan päivittää menettämättä käsin tehtyjä korjauksia.
      </div>
      {!canWrite ? <div className="muted small">You have VIEWER role. Editing is disabled.</div> : null}
      {error ? <div className="muted" style={{ color: 'var(--red)' }}>{error}</div> : null}

      <div className="card" style={{ overflowX: 'auto' }}>
        <div className="row spaceBetween" style={{ marginBottom: 10 }}>
          <div className="muted small">
            Visible rows: <span className="mono">{view.rows.length}</span> · Excluded derived: <span className="mono">{view.excludedDerived.length}</span>
          </div>
        </div>
        <table className="table" style={{ minWidth: 820 }}>
          <thead>
            <tr>
              <th style={{ width: 180 }}>Tunnus</th>
              <th>Kuvaus</th>
              <th style={{ width: 120 }}>Origin</th>
              <th style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {view.rows.map((r) => {
              const isDerived = r.origin === 'derived';
              // Manual row editing is indexed in the stored manualRows array. Map index by tag.
              const manualIdx = isDerived ? -1 : (state.manualRows ?? []).findIndex((m) => normalizeTag(m.tag) === r.tag);
              return (
                <tr key={`${r.origin}:${r.tag}`}>
                  <td>
                    <input
                      className="input"
                      value={r.tag}
                      disabled={isDerived || !canWrite}
                      onChange={(e) => updateManualRow(manualIdx, { tag: e.target.value })}
                    />
                  </td>
                  <td>
                    <textarea
                      className="input"
                      rows={2}
                      value={r.description}
                      disabled={!canWrite}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (isDerived) {
                          // Store as override; if it matches the base description and not deleted, we can clear.
                          setOverride(r.tag, { description: v, deleted: false });
                        } else {
                          updateManualRow(manualIdx, { description: v });
                        }
                      }}
                      style={{ resize: 'vertical' }}
                    />
                  </td>
                  <td className="muted small">{r.origin}</td>
                  <td style={{ textAlign: 'right' }}>
                    {isDerived ? (
                      <button
                        className="btn secondary"
                        onClick={() => setOverride(r.tag, { deleted: true })}
                        disabled={!canWrite}
                      >
                        Exclude
                      </button>
                    ) : (
                      <button className="btn secondary" onClick={() => deleteManualRow(manualIdx)} disabled={!canWrite}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {view.rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No rows.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="hr" />

        <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
          <div style={{ width: 200 }}>
            <div className="muted small">Add manual row</div>
            <input className="input" placeholder="Tunnus" value={newTag} onChange={(e) => setNewTag(e.target.value)} disabled={!canWrite} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="muted small">&nbsp;</div>
            <input className="input" placeholder="Kuvaus" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} disabled={!canWrite} />
          </div>
          <button className="btn" onClick={addManualRow} disabled={!canWrite || !normalizeTag(newTag)}>
            Add
          </button>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <div className="row spaceBetween" style={{ marginBottom: 10 }}>
          <h2 className="h2">Excluded derived rows</h2>
          <div className="muted small">Hidden derived entries can be restored.</div>
        </div>
        {view.excludedDerived.length === 0 ? (
          <div className="muted">None.</div>
        ) : (
          <table className="table" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th style={{ width: 180 }}>Tunnus</th>
                <th>Kuvaus</th>
                <th style={{ width: 140 }} />
              </tr>
            </thead>
            <tbody>
              {view.excludedDerived.map((r) => (
                <tr key={r.tag}>
                  <td className="mono">{r.tag}</td>
                  <td>{r.description}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn secondary"
                      disabled={!canWrite}
                      onClick={() => {
                        // Restore by clearing deleted; keep description override if present.
                        const curr = state.overrides?.[r.tag];
                        if (curr && curr.description) {
                          setOverride(r.tag, { deleted: false, description: curr.description });
                        } else {
                          // Remove override entirely if it only represented deletion.
                          clearOverride(r.tag);
                        }
                      }}
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
