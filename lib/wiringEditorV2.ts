import { Prisma } from '@prisma/client';
import { readWiringEditorState } from '@/lib/wiringEditor';
import { type ModuleTemplateId, templateForModuleXmlType } from '@/lib/templates/moduleTemplates';

// Sprint 4 wiring diagram editor v2 state (page model)
// Stored in: document.settings_jsonb.editor.WIRING_DIAGRAMS_V2

export const WIRING_EDITOR_V2_KEY = 'WIRING_DIAGRAMS_V2' as const;

type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

export type WiringV2TerminalSymbol = {
  type: string;
  label?: string;
};

export type WiringV2TerminalRow = {
  deviceText?: string;
  cable1?: string;
  cable1Pair?: string;
  intermediate?: string;
  cable2?: string;
  cable2Pair?: string;
  destination?: string;
  destinationConnector?: string;
  symbol?: WiringV2TerminalSymbol;
  connected?: boolean;
  inspected?: boolean;
};

export type WiringV2Page = {
  /** Stable page id used by the editor tree + terminal keys. */
  id: string;
  /** Printed page code (e.g. "02"). */
  code: string;
  /** Page title shown in the editor tree (module name / PS / AS-P). */
  title: string;
  templateId: ModuleTemplateId;
  locked?: boolean;
  moduleRef?: {
    moduleName?: string;
    moduleId?: string;
    moduleXmlType?: string;
  };
};

export type WiringV2State = {
  version: 1;
  updatedAt: string;
  /** Center-level concept, stored at document level for now to avoid cross-table coupling. */
  automationServerType?: string | null;
  pages: WiringV2Page[];
  pageOrder: string[];
  /** Key: `${pageId}:${terminal_code}` */
  terminals: Record<string, WiringV2TerminalRow>;
};

export type WiringV2Patch = Partial<
  Pick<WiringV2State, 'automationServerType' | 'pageOrder'>
> & {
  upsertPages?: WiringV2Page[];
  terminalPatches?: Array<{
    pageId: string;
    terminalCode: string;
    patch: WiringV2TerminalRow;
  }>;
};

function safeKey(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-:.]/g, '')
    .slice(0, 120);
}

function pad2(n: number): string {
  const x = Math.max(0, Math.floor(n));
  return String(x).padStart(2, '0');
}

function defaultState(): WiringV2State {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    automationServerType: null,
    pages: [],
    pageOrder: [],
    terminals: {},
  };
}

export function readWiringV2State(settings: unknown): WiringV2State {
  if (!isRecord(settings)) return defaultState();
  const editor = settings['editor'];
  if (!isRecord(editor)) return defaultState();
  const raw = editor[WIRING_EDITOR_V2_KEY];
  if (!isRecord(raw)) return defaultState();

  const pagesRaw = Array.isArray(raw['pages']) ? raw['pages'] : [];
  const pages: WiringV2Page[] = [];
  for (const p of pagesRaw) {
    if (!isRecord(p)) continue;
    const id = String(p['id'] ?? '').trim();
    const code = String(p['code'] ?? '').trim();
    const title = String(p['title'] ?? '').trim();
    const templateId = String(p['templateId'] ?? '').trim() as ModuleTemplateId;
    if (!id || !code || !title || !templateId) continue;
    const locked = Boolean(p['locked'] ?? false);
    const mr = isRecord(p['moduleRef']) ? (p['moduleRef'] as AnyRecord) : null;
    pages.push({
      id,
      code,
      title,
      templateId,
      locked,
      moduleRef: mr
        ? {
            moduleName: typeof mr['moduleName'] === 'string' ? (mr['moduleName'] as string) : undefined,
            moduleId: typeof mr['moduleId'] === 'string' ? (mr['moduleId'] as string) : undefined,
            moduleXmlType: typeof mr['moduleXmlType'] === 'string' ? (mr['moduleXmlType'] as string) : undefined,
          }
        : undefined,
    });
  }

  const pageOrder = Array.isArray(raw['pageOrder']) ? raw['pageOrder'].map((x) => String(x)) : [];
  const terminalsRaw = raw['terminals'];
  const terminals: Record<string, WiringV2TerminalRow> = {};
  if (isRecord(terminalsRaw)) {
    for (const [k, v] of Object.entries(terminalsRaw)) {
      if (!isRecord(v)) continue;
      terminals[k] = {
        deviceText: typeof v['deviceText'] === 'string' ? (v['deviceText'] as string) : undefined,
        cable1: typeof v['cable1'] === 'string' ? (v['cable1'] as string) : undefined,
        cable1Pair: typeof v['cable1Pair'] === 'string' ? (v['cable1Pair'] as string) : undefined,
        intermediate: typeof v['intermediate'] === 'string' ? (v['intermediate'] as string) : undefined,
        cable2: typeof v['cable2'] === 'string' ? (v['cable2'] as string) : undefined,
        cable2Pair: typeof v['cable2Pair'] === 'string' ? (v['cable2Pair'] as string) : undefined,
        destination: typeof v['destination'] === 'string' ? (v['destination'] as string) : undefined,
        destinationConnector:
          typeof v['destinationConnector'] === 'string' ? (v['destinationConnector'] as string) : undefined,
        symbol: isRecord(v['symbol'])
          ? {
              type: String((v['symbol'] as AnyRecord)['type'] ?? '').trim(),
              label:
                typeof (v['symbol'] as AnyRecord)['label'] === 'string'
                  ? ((v['symbol'] as AnyRecord)['label'] as string)
                  : undefined,
            }
          : undefined,
        connected: typeof v['connected'] === 'boolean' ? (v['connected'] as boolean) : undefined,
        inspected: typeof v['inspected'] === 'boolean' ? (v['inspected'] as boolean) : undefined,
      };
    }
  }

  return {
    version: 1,
    updatedAt: String(raw['updatedAt'] ?? new Date().toISOString()),
    automationServerType:
      raw['automationServerType'] == null ? null : String(raw['automationServerType'] ?? '').trim() || null,
    pages,
    pageOrder,
    terminals,
  };
}

export function mergeWiringV2State(args: {
  settings: unknown;
  patch: WiringV2Patch;
}): Prisma.InputJsonValue {
  const { settings, patch } = args;
  const base: AnyRecord = isRecord(settings) ? (settings as AnyRecord) : {};
  const baseEditor: AnyRecord = isRecord(base['editor']) ? (base['editor'] as AnyRecord) : {};
  const prev = readWiringV2State(base);

  const pagesById = new Map(prev.pages.map((p) => [p.id, p] as const));
  if (patch.upsertPages) {
    for (const p of patch.upsertPages) {
      pagesById.set(p.id, p);
    }
  }

  const terminals: Record<string, WiringV2TerminalRow> = { ...prev.terminals };
  if (patch.terminalPatches) {
    for (const tp of patch.terminalPatches) {
      const key = `${tp.pageId}:${tp.terminalCode}`;
      terminals[key] = { ...(terminals[key] ?? {}), ...(tp.patch ?? {}) };
    }
  }

  const next: WiringV2State = {
    ...prev,
    updatedAt: new Date().toISOString(),
    automationServerType:
      patch.automationServerType === undefined ? prev.automationServerType : patch.automationServerType,
    pages: Array.from(pagesById.values()),
    pageOrder: patch.pageOrder ? patch.pageOrder.map((x) => String(x)) : prev.pageOrder,
    terminals,
  };

  const merged: AnyRecord = {
    ...base,
    editor: {
      ...baseEditor,
      [WIRING_EDITOR_V2_KEY]: next,
    },
  };

  const json = JSON.parse(JSON.stringify(merged)) as unknown;
  return json as Prisma.InputJsonValue;
}

export type CanonicalRow = Record<string, unknown>;

function getString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function uniqBy<T, K>(items: T[], keyFn: (t: T) => K): T[] {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const it of items) {
    const k = keyFn(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

export function deriveWiringV2View(args: {
  settings: unknown;
  canonicalRows: CanonicalRow[];
  centerAutomationServerType?: string | null;
}): WiringV2State {
  const { settings, canonicalRows } = args;

  const base = isRecord(settings) ? (settings as AnyRecord) : {};
  const legacy = readWiringEditorState(base);
  const existing = readWiringV2State(base);

  // Determine center automation server type (center-level). Persisted on SubCenter, also copied
  // into v2 state for portability/versioning.
  const automationServerType = existing.automationServerType ?? args.centerAutomationServerType ?? null;

  // Build module list from canonical rows.
  const modules = uniqBy(
    canonicalRows
      .map((r) => ({
        moduleName: getString(r['module_name']).trim(),
        moduleId: getString(r['module_id']).trim(),
        moduleXmlType: getString(r['module_xml_type']).trim(),
      }))
      .filter((m) => Boolean(m.moduleName)),
    (m) => m.moduleName,
  );

  const legacyOrder = legacy.moduleOrder.length > 0 ? legacy.moduleOrder : modules.map((m) => m.moduleName);
  const orderedModules = [
    ...legacyOrder
      .map((name) => modules.find((m) => m.moduleName === name))
      .filter(Boolean) as typeof modules,
    ...modules.filter((m) => !legacyOrder.includes(m.moduleName)),
  ];

  const pagesById = new Map(existing.pages.map((p) => [p.id, p] as const));

  // Ensure default locked pages for AS-P.
  const wantsASP = String(automationServerType ?? '').toUpperCase() === 'AS-P';
  const reservedCodes = wantsASP ? new Set(['01', '02']) : new Set<string>();

  // Preserve terminal keys: try to reuse existing PS/AS-P page IDs when possible.
  let psId: string | null = null;
  let asId: string | null = null;

  if (wantsASP) {
    const findPageIdByTemplate = (tid: ModuleTemplateId, preferIds: string[]): string | null => {
      for (const id of preferIds) {
        const p = pagesById.get(id);
        if (p && p.templateId === tid) return p.id;
      }
      for (const p of pagesById.values()) {
        if (p.templateId === tid) return p.id;
      }
      return null;
    };

    psId = findPageIdByTemplate('PS', ['page:01', 'page:02']) ?? 'page:PS';
    asId = findPageIdByTemplate('AS-P', ['page:02', 'page:03']) ?? 'page:AS-P';

    const systemIds = new Set([psId, asId]);

    const normalize = (c: string) => String(c).padStart(2, '0');
    const used = new Set(Array.from(pagesById.values()).map((p) => normalize(p.code)));
    let max = 0;
    for (const code of used) {
      const n = Number(code);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }

    const allocAfterMax = (): string => {
      for (let n = max + 1; n <= 99; n++) {
        const code = pad2(n);
        if (!used.has(code) && !reservedCodes.has(code)) {
          used.add(code);
          max = n;
          return code;
        }
      }
      // fallback
      for (let n = 1; n <= 99; n++) {
        const code = pad2(n);
        if (!used.has(code) && !reservedCodes.has(code)) {
          used.add(code);
          max = Math.max(max, n);
          return code;
        }
      }
      return '99';
    };

    // If switching to AS-P, reserve codes 01/02 for system pages.
    // Move any existing non-system pages that currently use reserved codes to the end (stable, deterministic).
    for (const p of Array.from(pagesById.values())) {
      const code = normalize(p.code);
      if (reservedCodes.has(code) && !systemIds.has(p.id)) {
        pagesById.set(p.id, { ...p, code: allocAfterMax() });
      }
    }

    const existingPs = pagesById.get(psId);
    pagesById.set(psId, {
      ...(existingPs ?? { id: psId, code: '01', title: 'PS', templateId: 'PS' as ModuleTemplateId }),
      id: psId,
      code: '01',
      title: 'PS',
      templateId: 'PS',
      locked: true,
    });

    const existingAs = pagesById.get(asId);
    pagesById.set(asId, {
      ...(existingAs ?? { id: asId, code: '02', title: 'AS-P', templateId: 'AS-P' as ModuleTemplateId }),
      id: asId,
      code: '02',
      title: 'AS-P',
      templateId: 'AS-P',
      locked: true,
    });
  }

  // Ensure module pages.
  let nextCodeNum = wantsASP ? 3 : 1;
  const usedCodes = new Set(Array.from(pagesById.values()).map((p) => p.code));
  function allocCode(): string {
    while (usedCodes.has(pad2(nextCodeNum))) nextCodeNum += 1;
    const c = pad2(nextCodeNum);
    usedCodes.add(c);
    nextCodeNum += 1;
    return c;
  }

  for (const m of orderedModules) {
    const id = `mod:${safeKey(m.moduleName)}`;
    if (pagesById.has(id)) continue;
    const templateId = templateForModuleXmlType(m.moduleXmlType) ?? 'DI-16';
    pagesById.set(id, {
      id,
      code: allocCode(),
      title: m.moduleName,
      templateId,
      locked: false,
      moduleRef: { moduleName: m.moduleName, moduleId: m.moduleId || undefined, moduleXmlType: m.moduleXmlType || undefined },
    });
  }

  const pages = Array.from(pagesById.values()).sort((a, b) => {
    // Sort by numeric page code if possible.
    const na = Number(a.code);
    const nb = Number(b.code);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.code.localeCompare(b.code);
  });

  // Order: locked pages first in fixed order, then legacy order for modules.
  const lockedIds = wantsASP && psId && asId ? [psId, asId] : [];
  const modulePageIds = orderedModules
    .map((m) => `mod:${safeKey(m.moduleName)}`)
    .filter((id) => pagesById.has(id));
  const derivedOrder = uniqBy([...lockedIds, ...modulePageIds, ...pages.map((p) => p.id)], (x) => x);

  const pageOrder = existing.pageOrder.length > 0 ? existing.pageOrder : derivedOrder;
  const finalOrder = uniqBy(
    [...lockedIds, ...pageOrder.filter((id) => !lockedIds.includes(id)), ...derivedOrder],
    (x) => x,
  ).filter((id) => pagesById.has(id));

  return {
    ...existing,
    automationServerType,
    pages,
    pageOrder: finalOrder,
  };
}
