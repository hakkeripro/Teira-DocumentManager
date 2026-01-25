'use client';

import { useMemo, useState } from 'react';
import type { DocumentType } from '@prisma/client';

type ImportIssue = {
  severity: 'WARN' | 'ERROR';
  message: string;
  path?: string | null;
};

type DryRunResponse = {
  ok: boolean;
  source: 'XML' | 'XLSX';
  filename: string;
  docType: string;
  rowCount: number;
  wouldCreate: number;
  wouldUpdate: number;
  issues: ImportIssue[];
  sampleRows: Array<Record<string, unknown>>;
  identityKeys: string[];
};

type CommitResponse =
  | {
      ok: true;
      jobId: string;
      documentId: string;
      created: number;
      updated: number;
      warnings: number;
    }
  | {
      ok: false;
      jobId?: string;
      errors?: ImportIssue[];
      message?: string;
    };

export function ImportExportClient(props: {
  projectId: string;
  subCenterId: string;
  canWrite: boolean;
  docTypes: Array<{ type: DocumentType; label: string }>;
  defaultDocType?: DocumentType;
}) {
  const { projectId, subCenterId, canWrite, docTypes } = props;
  const [docType, setDocType] = useState<DocumentType>(props.defaultDocType ?? docTypes[0].type);
  const [format, setFormat] = useState<'xlsx' | 'xml'>('xlsx');

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<'dry' | 'commit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dryRun, setDryRun] = useState<DryRunResponse | null>(null);
  const [commitRes, setCommitRes] = useState<CommitResponse | null>(null);

  const exportHref = useMemo(() => {
    const sp = new URLSearchParams({
      projectId,
      subCenterId,
      docType,
      format,
    });
    return `/api/export?${sp.toString()}`;
  }, [projectId, subCenterId, docType, format]);

  async function run(kind: 'dry' | 'commit') {
    setError(null);
    setCommitRes(null);
    if (!file) {
      setError('Select a file first.');
      return;
    }

    const fd = new FormData();
    fd.append('projectId', projectId);
    fd.append('subCenterId', subCenterId);
    fd.append('docType', docType);
    fd.append('file', file);

    setBusy(kind);
    try {
      const res = await fetch(kind === 'dry' ? '/api/import/dry-run' : '/api/import/commit', {
        method: 'POST',
        body: fd,
      });
      const ct = res.headers.get('content-type') ?? '';
      const payload = ct.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) {
        setError(typeof payload === 'string' ? payload : payload?.message ?? 'Error');
        return;
      }
      if (kind === 'dry') {
        setDryRun(payload as DryRunResponse);
      } else {
        setCommitRes(payload);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <h2 className="h2">Import</h2>
        <div className="row" style={{ gap: 10 }}>
          <label className="label" style={{ margin: 0, minWidth: 240 }}>
            Target document
            <select value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)}>
              {docTypes.map((d) => (
                <option key={d.type} value={d.type}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>

          <label className="label" style={{ margin: 0, flex: 1 }}>
            File (XML or XLSX)
            <input
              type="file"
              accept=".xml,.xlsx"
              onChange={(e) => {
                setDryRun(null);
                setCommitRes(null);
                setError(null);
                setFile(e.target.files?.[0] ?? null);
              }}
            />
          </label>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <button className="btn" type="button" disabled={busy !== null} onClick={() => run('dry')}>
            {busy === 'dry' ? 'Dry-run…' : 'Dry-run preview'}
          </button>
          <button className="btn" type="button" disabled={!canWrite || busy !== null} onClick={() => run('commit')}>
            {busy === 'commit' ? 'Committing…' : 'Commit import'}
          </button>
          {!canWrite && <div className="muted small">VIEWER role: commit is disabled.</div>}
        </div>

        {error && (
          <div className="error" style={{ marginTop: 10 }}>
            {error}
          </div>
        )}

        {dryRun && (
          <div style={{ marginTop: 12 }}>
            <div className="row" style={{ gap: 10 }}>
              <span className="badge">{dryRun.ok ? 'OK' : 'HAS ERRORS'}</span>
              <span className="muted small">
                {dryRun.source} · {dryRun.filename} · rows: <span className="mono">{dryRun.rowCount}</span>
              </span>
              <span className="muted small">
                would create: <span className="mono">{dryRun.wouldCreate}</span> · would update:{' '}
                <span className="mono">{dryRun.wouldUpdate}</span>
              </span>
            </div>

            {dryRun.issues.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h3 className="h2">Issues</h3>
                <ul className="list">
                  {dryRun.issues.slice(0, 50).map((i, idx) => (
                    <li key={idx} className="listItem">
                      <div>
                        <span className="badge">{i.severity}</span> {i.message}
                        {i.path ? <div className="muted small mono">{i.path}</div> : null}
                      </div>
                    </li>
                  ))}
                </ul>
                {dryRun.issues.length > 50 && <div className="muted small">Showing first 50 issues.</div>}
              </div>
            )}

            {dryRun.sampleRows.length > 0 && (
              <div style={{ marginTop: 8, overflowX: 'auto' }}>
                <h3 className="h2">Sample rows</h3>
                <table className="table">
                  <thead>
                    <tr>
                      {Object.keys(dryRun.sampleRows[0] ?? {}).map((k) => (
                        <th key={k}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dryRun.sampleRows.map((r, idx) => (
                      <tr key={idx}>
                        {Object.keys(dryRun.sampleRows[0] ?? {}).map((k) => (
                          <td key={k}>{String((r as Record<string, unknown>)[k] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {commitRes && (
          <div style={{ marginTop: 12 }}>
            <h3 className="h2">Commit result</h3>
            <pre className="mono small">{JSON.stringify(commitRes, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="h2">Export</h2>
        <div className="row" style={{ gap: 10 }}>
          <label className="label" style={{ margin: 0, minWidth: 240 }}>
            Document
            <select value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)}>
              {docTypes.map((d) => (
                <option key={d.type} value={d.type}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>

          <label className="label" style={{ margin: 0, minWidth: 160 }}>
            Format
            <select value={format} onChange={(e) => setFormat(e.target.value === 'xml' ? 'xml' : 'xlsx')}>
              <option value="xlsx">XLSX</option>
              <option value="xml">XML</option>
            </select>
          </label>

          <a className="btn secondary" href={exportHref} style={{ marginTop: 22 }}>
            Download
          </a>
        </div>
        <div className="muted small">Exports the current canonical rows for the selected document type.</div>
      </div>
    </div>
  );
}
