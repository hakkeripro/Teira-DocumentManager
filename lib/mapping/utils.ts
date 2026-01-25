export function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

type AnyRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is AnyRecord {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function getAtPath(obj: unknown, dotPath: string): unknown {
  if (!dotPath) return obj;
  const parts = dotPath.split('.').filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (!isRecord(cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * Unwrap a single-root XML parse result.
 *
 * fast-xml-parser may include the XML declaration node (?xml). In that case the
 * parsed object has keys like { "?xml": {...}, "ObjectSet": {...} }.
 * Our MappingSpec paths are defined relative to the actual root element, so we
 * deterministically drop the declaration node and unwrap the real root.
 */
export function unwrapSingleRoot(obj: unknown): unknown {
  if (!isRecord(obj)) return obj;

  const keys = Object.keys(obj);

  // Typical case: a single root element.
  if (keys.length === 1) {
    return obj[keys[0]];
  }

  // If the XML declaration is present as "?xml" and there's exactly one other root key,
  // unwrap to the real root element deterministically.
  if (keys.length === 2 && keys.includes('?xml')) {
    const rootKey = keys.find((k) => k !== '?xml');
    if (rootKey) return obj[rootKey];
  }

  return obj;
}

export function isEmptyCell(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  return false;
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
