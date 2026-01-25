export type NameplateRow = {
  tag: string;
  description: string;
};

export type NameplateOrigin = 'derived' | 'manual';

export type NameplateViewRow = NameplateRow & {
  origin: NameplateOrigin;
};

export type NameplateOverride = {
  /** Overrides the derived description. */
  description?: string;
  /** Hides the derived row from the main list. */
  deleted?: boolean;
};

export type NameplateV1State = {
  version: 1;
  updatedAt: string;
  overrides: Record<string, NameplateOverride>;
  manualRows: NameplateRow[];
};

export type NameplateV1View = {
  baseRows: NameplateRow[];
  rows: NameplateViewRow[];
  excludedDerived: NameplateRow[];
  state: NameplateV1State;
};

type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

export function normalizeTag(tag: string): string {
  return asString(tag).trim();
}

export function readNameplateV1State(settings: unknown): NameplateV1State {
  const d = isRecord(settings) && isRecord(settings['derivedLists']) ? (settings['derivedLists'] as AnyRecord) : null;
  const raw = d && isRecord(d['nameplatesV1']) ? (d['nameplatesV1'] as AnyRecord) : null;

  const overrides: Record<string, NameplateOverride> = {};
  const oRaw = raw && isRecord(raw['overrides']) ? (raw['overrides'] as AnyRecord) : null;
  if (oRaw) {
    for (const [k, v] of Object.entries(oRaw)) {
      const key = normalizeTag(k);
      if (!key) continue;
      if (!isRecord(v)) continue;
      const description = typeof v['description'] === 'string' ? (v['description'] as string) : undefined;
      const deleted = v['deleted'] === true;
      if (description === undefined && !deleted) continue;
      overrides[key] = {
        description: description !== undefined ? description : undefined,
        deleted,
      };
    }
  }

  const manualRows: NameplateRow[] = [];
  const mr = raw && Array.isArray(raw['manualRows']) ? (raw['manualRows'] as unknown[]) : [];
  for (const r of mr) {
    if (!isRecord(r)) continue;
    const tag = normalizeTag(asString(r['tag']));
    if (!tag) continue;
    manualRows.push({ tag, description: asString(r['description']).trim() });
  }

  return {
    version: 1,
    updatedAt: raw ? asString(raw['updatedAt'] ?? new Date().toISOString()) : new Date().toISOString(),
    overrides,
    manualRows,
  };
}

function uniqBase(rows: NameplateRow[]): NameplateRow[] {
  const byTag = new Map<string, NameplateRow>();
  for (const r of rows) {
    const tag = normalizeTag(r.tag);
    if (!tag) continue;
    const desc = asString(r.description).trim();
    const prev = byTag.get(tag);
    if (!prev) {
      byTag.set(tag, { tag, description: desc });
      continue;
    }
    // Prefer a non-empty description if we previously had none.
    if (!prev.description && desc) {
      byTag.set(tag, { tag, description: desc });
    }
  }
  // Preserve original order.
  const seen = new Set<string>();
  const out: NameplateRow[] = [];
  for (const r of rows) {
    const tag = normalizeTag(r.tag);
    if (!tag || seen.has(tag)) continue;
    const v = byTag.get(tag);
    if (v) out.push(v);
    seen.add(tag);
  }
  return out;
}

export function buildNameplateV1View(args: {
  baseRows: NameplateRow[];
  state: NameplateV1State;
}): Omit<NameplateV1View, 'state'> {
  const base = uniqBase(args.baseRows);
  const overrides = args.state.overrides ?? {};

  const derivedVisible: NameplateViewRow[] = [];
  const excludedDerived: NameplateRow[] = [];

  for (const r of base) {
    const tag = normalizeTag(r.tag);
    if (!tag) continue;
    const o = overrides[tag];
    const isDeleted = o?.deleted === true;
    const description = (o?.description ?? r.description ?? '').trim();
    if (isDeleted) {
      excludedDerived.push({ tag, description });
      continue;
    }
    derivedVisible.push({ tag, description, origin: 'derived' });
  }

  // Apply manual rows as additive entries, but if a manual row has the same tag
  // as an existing derived row, the manual row replaces the derived row (stable position).
  const byTag = new Map<string, NameplateViewRow>();
  const order: string[] = [];
  for (const r of derivedVisible) {
    byTag.set(r.tag, r);
    order.push(r.tag);
  }

  for (const m of args.state.manualRows ?? []) {
    const tag = normalizeTag(m.tag);
    if (!tag) continue;
    const row: NameplateViewRow = { tag, description: asString(m.description).trim(), origin: 'manual' };
    if (!byTag.has(tag)) {
      order.push(tag);
    }
    byTag.set(tag, row);
  }

  const rows: NameplateViewRow[] = [];
  const seen = new Set<string>();
  for (const t of order) {
    if (seen.has(t)) continue;
    const r = byTag.get(t);
    if (r) rows.push(r);
    seen.add(t);
  }

  return { baseRows: base, rows, excludedDerived };
}

export function sanitizeNameplateV1Input(input: unknown): Pick<NameplateV1State, 'overrides' | 'manualRows'> {
  const overrides: Record<string, NameplateOverride> = {};
  const manualRows: NameplateRow[] = [];

  if (isRecord(input)) {
    if (isRecord(input['overrides'])) {
      const raw = input['overrides'] as AnyRecord;
      for (const [k, v] of Object.entries(raw)) {
        const tag = normalizeTag(k);
        if (!tag) continue;
        if (!isRecord(v)) continue;
        const description = typeof v['description'] === 'string' ? (v['description'] as string) : undefined;
        const deleted = v['deleted'] === true;
        if (description === undefined && !deleted) continue;
        overrides[tag] = { description: description !== undefined ? description : undefined, deleted };
      }
    }

    if (Array.isArray(input['manualRows'])) {
      for (const r of input['manualRows'] as unknown[]) {
        if (!isRecord(r)) continue;
        const tag = normalizeTag(asString(r['tag']));
        if (!tag) continue;
        manualRows.push({ tag, description: asString(r['description']).trim() });
      }
    }
  }

  return { overrides, manualRows };
}
