import type { MappingSpec, TargetSpec } from '@/lib/mapping/spec';
import { buildTransformConfig, applyTransforms, type ImportIssue } from '@/lib/mapping/transforms';
import { getAtPath, isEmptyCell, unwrapSingleRoot, isRecord } from '@/lib/mapping/utils';
import { XMLParser } from 'fast-xml-parser';
import ExcelJS from 'exceljs';

type XmlSource = NonNullable<NonNullable<TargetSpec['sources']>['xml']>;
type XmlPathSource = Extract<XmlSource, { root_array_path: string; fields: Record<string, unknown> }>;
type XmlObjectSetSource = Extract<XmlSource, { format: 'objectset' }>;

function isXmlObjectSetSource(src: unknown): src is XmlObjectSetSource {
  if (!isRecord(src)) return false;
  const r = src as Record<string, unknown>;
  return r['format'] === 'objectset';
}

function isXmlPathSource(src: unknown): src is XmlPathSource {
  if (!isRecord(src)) return false;
  const r = src as Record<string, unknown>;
  const rap = r['root_array_path'];
  const fields = r['fields'];
  const fmt = r['format'];
  return typeof rap === 'string' && isRecord(fields) && (fmt == null || fmt === 'path');
}

function xmlAttr(node: Record<string, unknown>, attr: string): unknown {
  const key = `@_${attr}`;
  return node[key] ?? node[`@_${attr.toUpperCase()}`] ?? node[`@_${attr.toLowerCase()}`];
}

function toArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

function extractPiMap(node: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const pis = toArray(node['PI']);
  for (const p of pis) {
    if (!p || typeof p !== 'object' || Array.isArray(p)) continue;
    const pr = p as Record<string, unknown>;
    const name = pr['@_Name'] ?? pr['@_NAME'] ?? pr['@_name'];
    if (typeof name !== 'string' || name.trim() === '') continue;
    const val = pr['@_Value'] ?? pr['@_VALUE'] ?? pr['@_value'] ?? null;
    out[name] = normalizeCell(val);
  }
  return out;
}

export type CanonicalPayload = {
  docType: string;
  header: Record<string, unknown>;
  rows: Array<Record<string, unknown>>;
  identityKeys: string[];
};

export type EngineResult = {
  canonical: CanonicalPayload;
  issues: ImportIssue[];
};

function normalizeCell(v: unknown): unknown {
  if (v == null) return null;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    return trimmed === '' ? null : trimmed;
  }
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.toISOString();
  return v;
}

function hasAnyValue(obj: Record<string, unknown>): boolean {
  return Object.values(obj).some((v) => !isEmptyCell(v));
}

export function findTarget(spec: MappingSpec, docType: string): TargetSpec | null {
  return spec.targets.find((t) => t.docType === docType) ?? null;
}

export function computeIdentity(row: Record<string, unknown>, identityKeys: string[]): string {
  return identityKeys.map((k) => String(row[k] ?? '')).join('|');
}

function cellValueToPrimitive(v: unknown): unknown {
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
  if (v instanceof Date) return v;

  // ExcelJS can return objects for rich text, hyperlinks, formulas, etc.
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;

    const richText = obj['richText'];
    if (Array.isArray(richText)) {
      return richText
        .map((p) => {
          if (p && typeof p === 'object' && !Array.isArray(p)) {
            const t = (p as Record<string, unknown>)['text'];
            return t == null ? '' : String(t);
          }
          return '';
        })
        .join('');
    }

    const text = obj['text'];
    if (typeof text === 'string') return text;

    const result = obj['result'];
    if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') return result;

    const hyperlink = obj['hyperlink'];
    if (typeof hyperlink === 'string') return typeof text === 'string' ? text : hyperlink;

    const formula = obj['formula'];
    if (typeof formula === 'string' && result != null) return result;
  }

  return String(v);
}

function normalizeExcelCellValue(v: unknown): unknown {
  const prim = cellValueToPrimitive(v);
  return normalizeCell(prim);
}

export async function parseXlsxToCanonical(args: {
  spec: MappingSpec;
  target: TargetSpec;
  fileBuffer: Buffer;
  contextHeader: Record<string, unknown>;
}): Promise<EngineResult> {
  const { spec, target, fileBuffer, contextHeader } = args;
  const issues: ImportIssue[] = [];
  const cfg = buildTransformConfig(spec.transforms as unknown[]);

  const src = target.sources.xlsx;
  if (!src) {
    return {
      canonical: { docType: target.docType, header: { ...contextHeader }, rows: [], identityKeys: target.identity_keys },
      issues: [{ severity: 'ERROR', message: 'No XLSX source mapping for target', path: `targets.${target.docType}.sources.xlsx` }],
    };
  }

  const workbook = new ExcelJS.Workbook();
  // ExcelJS + Node/@types-node can disagree about Buffer's backing store types.
  // Node's Buffer is backed by ArrayBufferLike (can be SharedArrayBuffer), while
  // ExcelJS typings (and some runtime paths) expect a plain ArrayBuffer.
  // To keep this portable and deterministic, copy bytes into a fresh ArrayBuffer.
  const view = new Uint8Array(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength);
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  const ab: ArrayBuffer = copy.buffer;
  await (workbook.xlsx as unknown as { load(data: ArrayBuffer): Promise<unknown> }).load(ab);
  const sheet = workbook.getWorksheet(src.sheet);
  if (!sheet) {
    return {
      canonical: { docType: target.docType, header: { ...contextHeader }, rows: [], identityKeys: target.identity_keys },
      issues: [{ severity: 'ERROR', message: `Sheet not found: ${src.sheet}`, path: `xlsx.sheet` }],
    };
  }

  const headerRowNumber = src.header_row;
  const dataStartNumber = src.row_start;
  const headerRow = sheet.getRow(headerRowNumber);
  const maxCol = Math.max(headerRow.cellCount, headerRow.actualCellCount);
  const headerCells: string[] = [];
  for (let c = 1; c <= maxCol; c++) {
    const v = headerRow.getCell(c).value;
    headerCells.push(String(cellValueToPrimitive(v) ?? '').trim());
  }

  const headerIndex: Record<string, number> = {};
  headerCells.forEach((h, idx) => {
    if (h) headerIndex[h] = idx;
  });

  // Required headers
  for (const [fieldKey, fm] of Object.entries(src.columns)) {
    const h = fm.header;
    if (!h) continue;
    const colIdx = headerIndex[h];
    if (colIdx == null) {
      if (fm.required) {
        issues.push({ severity: 'ERROR', message: `Missing required column header: ${h}`, path: `xlsx.columns.${fieldKey}` });
      } else {
        issues.push({ severity: 'WARN', message: `Missing optional column header: ${h}`, path: `xlsx.columns.${fieldKey}` });
      }
    }
  }

  const unknownBehavior = spec.validation?.unknown_columns_behavior ?? 'warn';
  const knownHeaders = new Set(Object.values(src.columns).map((c) => c.header).filter(Boolean) as string[]);

  const canonicalRows: Array<Record<string, unknown>> = [];
  const maxRows = spec.validation?.max_rows_default ?? 50000;
  let processed = 0;

  for (let r = dataStartNumber; r <= sheet.rowCount; r++) {
    if (processed >= maxRows) {
      issues.push({ severity: 'ERROR', message: `Max rows exceeded (${maxRows})`, path: `xlsx.rows` });
      break;
    }

    const row = sheet.getRow(r);
    const out: Record<string, unknown> = {};
    const properties: Record<string, unknown> = {};

    // Mapped columns
    for (const [fieldKey, fm] of Object.entries(src.columns)) {
      const h = fm.header;
      if (!h) continue;
      const colIdx = headerIndex[h];
      const raw = colIdx == null ? null : normalizeExcelCellValue(row.getCell(colIdx + 1).value);
      const v = applyTransforms(raw, fm.transforms, cfg, issues, `row[${r}].${fieldKey}`);
      if (fm.required && isEmptyCell(v)) {
        issues.push({ severity: 'ERROR', message: `Missing required value for ${fieldKey}`, path: `row[${r}]` });
      }
      out[fieldKey] = v;
    }

    // Unknown columns -> properties
    if (unknownBehavior !== 'ignore') {
      for (let c = 0; c < headerCells.length; c++) {
        const header = headerCells[c];
        if (!header || knownHeaders.has(header)) continue;
        const v = normalizeExcelCellValue(row.getCell(c + 1).value);
        if (isEmptyCell(v)) continue;
        properties[header] = v;
      }

      if (Object.keys(properties).length > 0) {
        out.properties = properties;
        if (unknownBehavior === 'warn') {
          issues.push({ severity: 'WARN', message: `Unknown columns captured into properties (${Object.keys(properties).join(', ')})`, path: `row[${r}].properties` });
        } else if (unknownBehavior === 'error') {
          issues.push({ severity: 'ERROR', message: `Unknown columns present (${Object.keys(properties).join(', ')})`, path: `row[${r}].properties` });
        }
      }
    }

    // Skip fully empty lines
    if (!hasAnyValue(out) && Object.keys(properties).length === 0) continue;

    canonicalRows.push(out);
    processed++;
  }

  // Identity validation
  for (let i = 0; i < canonicalRows.length; i++) {
    const row = canonicalRows[i];
    for (const k of target.identity_keys) {
      if (isEmptyCell(row[k])) {
        issues.push({ severity: 'ERROR', message: `Missing identity key ${k}`, path: `rows[${i}].${k}` });
      }
    }
  }

  return {
    canonical: {
      docType: target.docType,
      header: { ...contextHeader },
      rows: canonicalRows,
      identityKeys: target.identity_keys,
    },
    issues,
  };
}

export function parseXmlToCanonical(args: {
  spec: MappingSpec;
  target: TargetSpec;
  fileBuffer: Buffer;
  contextHeader: Record<string, unknown>;
}): EngineResult {
  const { spec, target, fileBuffer, contextHeader } = args;
  const issues: ImportIssue[] = [];
  const cfg = buildTransformConfig(spec.transforms as unknown[]);
  const src = target.sources.xml;
  if (!src) {
    return {
      canonical: { docType: target.docType, header: { ...contextHeader }, rows: [], identityKeys: target.identity_keys },
      issues: [{ severity: 'ERROR', message: 'No XML source mapping for target', path: `targets.${target.docType}.sources.xml` }],
    };
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseTagValue: false,
    trimValues: false,
  });

  const xml = fileBuffer.toString('utf8');
  const parsedRaw = parser.parse(xml);
  const parsed = unwrapSingleRoot(parsedRaw);

  // ObjectSet style XML (used by wiring diagrams / IO-module exports)
  if (isXmlObjectSetSource(src)) {
    const os = src;

    const moduleAt = getAtPath(parsed, os.module_array_path);
    const modules: unknown[] = Array.isArray(moduleAt) ? moduleAt : moduleAt == null ? [] : [moduleAt];
    if (modules.length === 0) {
      issues.push({ severity: 'WARN', message: `No modules found at path: ${os.module_array_path}`, path: `xml.module_array_path` });
    }

    const maxRows = spec.validation?.max_rows_default ?? 50000;
    const canonicalRows: Array<Record<string, unknown>> = [];

    const knownModuleTypes = new Set(os.known_module_types ?? []);
    const knownPointTypes = new Set(os.known_point_types ?? []);

    const pointArrayKey = os.point_array_key ?? 'OI';

    const canonicalModulePiNames = new Set(
      Object.values(os.module_fields)
        .map((m) => ('pi' in m ? (m as unknown as { pi?: string }).pi : undefined))
        .filter((x): x is string => typeof x === 'string' && x.length > 0)
    );
    const canonicalPointPiNames = new Set(
      Object.values(os.point_fields)
        .map((m) => ('pi' in m ? (m as unknown as { pi?: string }).pi : undefined))
        .filter((x): x is string => typeof x === 'string' && x.length > 0)
    );

    // Use shared helpers (attribute & PI extraction)

    let produced = 0;
    for (let mi = 0; mi < modules.length; mi++) {
      const m = modules[mi];
      if (!isRecord(m)) continue;

      const modulePi = extractPiMap(m);
      const moduleOut: Record<string, unknown> = {};

      for (const [fieldKey, fm] of Object.entries(os.module_fields)) {
        const map = fm as unknown as { attr?: string; pi?: string; required?: boolean; transforms?: string[] };
        const raw = map.attr ? xmlAttr(m, map.attr) : map.pi ? modulePi[map.pi] : null;
        const val = normalizeCell(raw);
        const v = applyTransforms(val, map.transforms, cfg, issues, `modules[${mi}].${fieldKey}`);
        if (map.required && isEmptyCell(v)) {
          issues.push({ severity: 'ERROR', message: `Missing required value for ${fieldKey}`, path: `modules[${mi}]` });
        }
        moduleOut[fieldKey] = v;
      }

      // Known type warnings (do not fail import)
      const moduleType = moduleOut['module_xml_type'];
      if (typeof moduleType === 'string' && moduleType.trim() && knownModuleTypes.size > 0 && !knownModuleTypes.has(moduleType)) {
        issues.push({ severity: 'WARN', message: `Unknown module_xml_type: ${moduleType}`, path: `modules[${mi}].module_xml_type` });
      }

      const pointsAt = (m as Record<string, unknown>)[pointArrayKey];
      const points: unknown[] = Array.isArray(pointsAt) ? pointsAt : pointsAt == null ? [] : [pointsAt];
      for (let pi = 0; pi < points.length; pi++) {
        if (produced >= maxRows) {
          issues.push({ severity: 'ERROR', message: `Max rows exceeded (${maxRows})`, path: `xml.rows` });
          break;
        }
        const p = points[pi];
        if (!isRecord(p)) continue;

        const pointPi = extractPiMap(p);
        const pointOut: Record<string, unknown> = {};

        for (const [fieldKey, fm] of Object.entries(os.point_fields)) {
          const map = fm as unknown as { attr?: string; pi?: string; required?: boolean; transforms?: string[] };
          const raw = map.attr ? xmlAttr(p, map.attr) : map.pi ? pointPi[map.pi] : null;
          const val = normalizeCell(raw);
          const v = applyTransforms(val, map.transforms, cfg, issues, `rows[${produced}].${fieldKey}`);
          if (map.required && isEmptyCell(v)) {
            issues.push({ severity: 'ERROR', message: `Missing required value for ${fieldKey}`, path: `rows[${produced}]` });
          }
          pointOut[fieldKey] = v;
        }

        const pointType = pointOut['point_xml_type'];
        if (typeof pointType === 'string' && pointType.trim() && knownPointTypes.size > 0 && !knownPointTypes.has(pointType)) {
          issues.push({ severity: 'WARN', message: `Unknown point_xml_type: ${pointType}`, path: `rows[${produced}].point_xml_type` });
        }

        const row: Record<string, unknown> = { ...moduleOut, ...pointOut };

        if (os.preserve_property_bag ?? true) {
          const moduleProps: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(modulePi)) {
            if (canonicalModulePiNames.has(k)) continue;
            if (isEmptyCell(v)) continue;
            moduleProps[k] = v;
          }
          const pointProps: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(pointPi)) {
            if (canonicalPointPiNames.has(k)) continue;
            if (isEmptyCell(v)) continue;
            pointProps[k] = v;
          }
          if (Object.keys(moduleProps).length > 0 || Object.keys(pointProps).length > 0) {
            row.properties = { module_properties: moduleProps, point_properties: pointProps };
          }
        }

        if (!hasAnyValue(row)) continue;
        canonicalRows.push(row);
        produced++;
      }
    }

    // Identity validation
    for (let i = 0; i < canonicalRows.length; i++) {
      const row = canonicalRows[i];
      for (const k of target.identity_keys) {
        if (isEmptyCell(row[k])) {
          issues.push({ severity: 'ERROR', message: `Missing identity key ${k}`, path: `rows[${i}].${k}` });
        }
      }
    }

    return {
      canonical: {
        docType: target.docType,
        header: { ...contextHeader },
        rows: canonicalRows,
        identityKeys: target.identity_keys,
      },
      issues,
    };
  }

  if (!isXmlPathSource(src)) {
    return {
      canonical: { docType: target.docType, header: { ...contextHeader }, rows: [], identityKeys: target.identity_keys },
      issues: [{ severity: 'ERROR', message: 'Invalid XML source mapping for target', path: `targets.${target.docType}.sources.xml` }],
    };
  }

  if (!isXmlPathSource(src)) {
    return {
      canonical: { docType: target.docType, header: { ...contextHeader }, rows: [], identityKeys: target.identity_keys },
      issues: [{ severity: 'ERROR', message: 'Invalid XML source mapping (unknown format)', path: `targets.${target.docType}.sources.xml` }],
    };
  }
  const pathSrc = src;

  const atPath = getAtPath(parsed, pathSrc.root_array_path);
  const items: unknown[] = Array.isArray(atPath) ? atPath : atPath == null ? [] : [atPath];
  if (items.length === 0) {
    issues.push({ severity: 'WARN', message: `No items found at path: ${pathSrc.root_array_path}`, path: `xml.root_array_path` });
  }

  const maxRows = spec.validation?.max_rows_default ?? 50000;
  if (items.length > maxRows) {
    issues.push({ severity: 'ERROR', message: `Max rows exceeded (${maxRows})`, path: `xml.rows` });
  }

  const fieldKeys = Object.keys(pathSrc.fields);
  const canonicalRows: Array<Record<string, unknown>> = [];

  for (let i = 0; i < Math.min(items.length, maxRows); i++) {
    const item = items[i];
    const out: Record<string, unknown> = {};
    const props: Record<string, unknown> = {};

    for (const [fieldKey, fm] of Object.entries(pathSrc.fields)) {
      if (!fm.path) continue;
      const raw = getAtPath(item, fm.path);
      const val = normalizeCell(raw);
      const v = applyTransforms(val, fm.transforms, cfg, issues, `rows[${i}].${fieldKey}`);
      if (fm.required && isEmptyCell(v)) {
        issues.push({ severity: 'ERROR', message: `Missing required value for ${fieldKey}`, path: `rows[${i}]` });
      }
      out[fieldKey] = v;
    }

    // Capture unknown fields into properties
    if (isRecord(item)) {
      for (const k of Object.keys(item)) {
        // Skip xml parser metadata keys
        if (k.startsWith('@_')) continue;
        if (k === '#text') continue;
        const isMapped = fieldKeys.some((fk) => pathSrc.fields[fk]?.path === k);
        if (isMapped) continue;
        const v = normalizeCell(item[k]);
        if (isEmptyCell(v)) continue;
        props[k] = v;
      }
      if (Object.keys(props).length > 0) out.properties = props;
    }

    if (!hasAnyValue(out) && Object.keys(props).length === 0) continue;
    canonicalRows.push(out);
  }

  // Identity validation
  for (let i = 0; i < canonicalRows.length; i++) {
    const row = canonicalRows[i];
    for (const k of target.identity_keys) {
      if (isEmptyCell(row[k])) {
        issues.push({ severity: 'ERROR', message: `Missing identity key ${k}`, path: `rows[${i}].${k}` });
      }
    }
  }

  return {
    canonical: {
      docType: target.docType,
      header: { ...contextHeader },
      rows: canonicalRows,
      identityKeys: target.identity_keys,
    },
    issues,
  };
}
