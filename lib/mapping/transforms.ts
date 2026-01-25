export type ImportIssue = {
  severity: 'WARN' | 'ERROR';
  message: string;
  path?: string;
};

export type TransformConfig = {
  replace?: { from: string; to: string };
  default?: { value: unknown };
};

type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

export function buildTransformConfig(defs: unknown[]): TransformConfig {
  const cfg: TransformConfig = {};
  for (const d of defs) {
    if (!isRecord(d)) continue;

    const rep = d['replace'];
    if (isRecord(rep) && typeof rep['from'] === 'string' && typeof rep['to'] === 'string') {
      cfg.replace = { from: rep['from'], to: rep['to'] };
    }

    const def = d['default'];
    if (isRecord(def) && 'value' in def) {
      cfg.default = { value: def['value'] };
    }
  }
  return cfg;
}

export function applyTransforms(
  input: unknown,
  transforms: string[] | undefined,
  cfg: TransformConfig,
  issues: ImportIssue[],
  issuePath: string
): unknown {
  let v: unknown = input;
  const chain = transforms ?? [];

  for (const t of chain) {
    switch (t) {
      case 'trim': {
        if (typeof v === 'string') v = v.trim();
        break;
      }
      case 'normalize_ws': {
        if (typeof v === 'string') v = v.replace(/\s+/g, ' ').trim();
        break;
      }
      case 'to_upper': {
        if (typeof v === 'string') v = v.toUpperCase();
        break;
      }
      case 'to_lower': {
        if (typeof v === 'string') v = v.toLowerCase();
        break;
      }
      case 'replace': {
        if (typeof v === 'string' && cfg.replace) {
          v = v.split(cfg.replace.from).join(cfg.replace.to);
        }
        break;
      }
      case 'parse_int': {
        if (typeof v === 'number') {
          v = Number.isFinite(v) ? Math.trunc(v) : v;
          break;
        }
        if (typeof v === 'string') {
          const n = parseInt(v, 10);
          if (Number.isNaN(n)) {
            issues.push({ severity: 'ERROR', message: `Invalid int: ${v}`, path: issuePath });
          } else {
            v = n;
          }
        }
        break;
      }
      case 'parse_float': {
        if (typeof v === 'number') {
          v = Number.isFinite(v) ? v : v;
          break;
        }
        if (typeof v === 'string') {
          const n = parseFloat(v);
          if (Number.isNaN(n)) {
            issues.push({ severity: 'ERROR', message: `Invalid float: ${v}`, path: issuePath });
          } else {
            v = n;
          }
        }
        break;
      }
      case 'default': {
        if ((v == null || v === '') && cfg.default) v = cfg.default.value;
        break;
      }
      default: {
        // Unknown transform: warn but do not fail
        issues.push({ severity: 'WARN', message: `Unknown transform: ${t}`, path: issuePath });
      }
    }
  }

  return v;
}
