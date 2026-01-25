import { Prisma } from '@prisma/client';

// Sprint 3 wiring diagram editor state
// Stored in: document.settings_jsonb.editor.WIRING_DIAGRAMS

export const WIRING_EDITOR_KEY = 'WIRING_DIAGRAMS' as const;

export type WiringSymbol = {
  type: string;
  label?: string;
};

export type WiringEditorState = {
  version: number;
  updatedAt: string;
  moduleOrder: string[];
  symbols: Record<string, WiringSymbol>; // terminal_code -> symbol
};

type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

export function readWiringEditorState(settings: unknown): WiringEditorState {
  if (!isRecord(settings)) {
    return { version: 1, updatedAt: new Date().toISOString(), moduleOrder: [], symbols: {} };
  }
  const editor = settings['editor'];
  if (!isRecord(editor)) {
    return { version: 1, updatedAt: new Date().toISOString(), moduleOrder: [], symbols: {} };
  }
  const raw = editor[WIRING_EDITOR_KEY];
  if (!isRecord(raw)) {
    return { version: 1, updatedAt: new Date().toISOString(), moduleOrder: [], symbols: {} };
  }

  const moduleOrder = Array.isArray(raw['moduleOrder']) ? (raw['moduleOrder'] as unknown[]).map((x) => String(x)) : [];
  const symbolsRaw = raw['symbols'];
  const symbols: Record<string, WiringSymbol> = {};
  if (isRecord(symbolsRaw)) {
    for (const [k, v] of Object.entries(symbolsRaw)) {
      if (!isRecord(v)) continue;
      const type = String((v as AnyRecord)['type'] ?? '');
      const label = (v as AnyRecord)['label'];
      if (!type.trim()) continue;
      symbols[String(k)] = { type: type.trim(), label: typeof label === 'string' ? label : undefined };
    }
  }

  return {
    version: Number(raw['version'] ?? 1),
    updatedAt: String(raw['updatedAt'] ?? new Date().toISOString()),
    moduleOrder,
    symbols,
  };
}

export function mergeWiringEditorState(args: {
  settings: unknown;
  patch: Partial<Pick<WiringEditorState, 'moduleOrder' | 'symbols'>>;
}): Prisma.InputJsonValue {
  const { settings, patch } = args;

  const base: AnyRecord = isRecord(settings) ? (settings as AnyRecord) : {};
  const baseEditor: AnyRecord = isRecord(base['editor']) ? (base['editor'] as AnyRecord) : {};
  const prev = readWiringEditorState(base);

  const next: WiringEditorState = {
    ...prev,
    updatedAt: new Date().toISOString(),
    moduleOrder: patch.moduleOrder ? patch.moduleOrder.map((x) => String(x)) : prev.moduleOrder,
    symbols: patch.symbols ? patch.symbols : prev.symbols,
  };

  const merged: AnyRecord = {
    ...base,
    editor: {
      ...baseEditor,
      [WIRING_EDITOR_KEY]: next,
    },
  };

  const json = JSON.parse(JSON.stringify(merged)) as unknown;
  return json as Prisma.InputJsonValue;
}

export function mergeSettingsWithCanonical(args: {
  settings: unknown;
  canonical: unknown;
}): Prisma.InputJsonValue {
  const { settings, canonical } = args;
  const base: AnyRecord = isRecord(settings) ? (settings as AnyRecord) : {};
  const merged: AnyRecord = {
    ...base,
    canonical,
  };
  const json = JSON.parse(JSON.stringify(merged)) as unknown;
  return json as Prisma.InputJsonValue;
}

export function extractTerminalCode(row: Record<string, unknown>): string {
  // Prefer preserved PI bag: properties.point_properties.TerminalCode
  const props = row['properties'];
  if (props && typeof props === 'object' && !Array.isArray(props)) {
    const pp = (props as AnyRecord)['point_properties'];
    if (pp && typeof pp === 'object' && !Array.isArray(pp)) {
      const tc = (pp as AnyRecord)['TerminalCode'];
      if (typeof tc === 'string' && tc.trim()) return tc.trim();
    }
  }

  // Fallback: derive from channel numbers
  const inCh = row['input_channel_number'];
  const outCh = row['output_channel_number'];

  const asNum = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const nIn = asNum(inCh);
  if (nIn != null) return `IN${nIn}`;
  const nOut = asNum(outCh);
  if (nOut != null) return `OUT${nOut}`;

  const pName = row['point_name'];
  if (typeof pName === 'string' && pName.trim()) return `POINT:${pName.trim()}`;

  return '';
}

export function injectPointPi(row: Record<string, unknown>, pi: Record<string, unknown>): Record<string, unknown> {
  // Non-destructive merge into row.properties.point_properties
  const out: Record<string, unknown> = { ...row };
  const props = (out['properties'] && typeof out['properties'] === 'object' && !Array.isArray(out['properties'])
    ? (out['properties'] as AnyRecord)
    : {}) as AnyRecord;
  const pointProps = (props['point_properties'] && typeof props['point_properties'] === 'object' && !Array.isArray(props['point_properties'])
    ? (props['point_properties'] as AnyRecord)
    : {}) as AnyRecord;

  const nextPointProps: AnyRecord = { ...pointProps, ...pi };
  const nextProps: AnyRecord = { ...props, point_properties: nextPointProps };
  out['properties'] = nextProps;
  return out;
}
