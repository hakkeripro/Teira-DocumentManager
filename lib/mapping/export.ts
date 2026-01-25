import type { MappingSpec, TargetSpec } from '@/lib/mapping/spec';
import { escapeXml, isRecord } from '@/lib/mapping/utils';
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

export async function exportCanonicalToXlsx(args: {
  spec: MappingSpec;
  target: TargetSpec;
  header: Record<string, unknown>;
  rows: Array<Record<string, unknown>>;
}): Promise<Uint8Array> {
  const { target, rows } = args;
  const src = target.sources.xlsx;
  if (!src) {
    throw new Error('Target does not support XLSX export');
  }

  const columns = src.columns;
  const fieldOrder = target.canonical.row_fields.filter((f) => f in columns);
  // Fallback to declared column order if canonical.row_fields is incomplete
  const orderedFields = fieldOrder.length > 0 ? fieldOrder : Object.keys(columns);
  const headers = orderedFields.map((f) => columns[f]?.header ?? f);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(src.sheet);
  ws.addRow(headers);

  for (const r of rows) {
    ws.addRow(
      orderedFields.map((f) => {
        const v = r[f];
        if (v == null) return '';
        return v;
      })
    );
  }

  const buf = await wb.xlsx.writeBuffer();
  // ExcelJS returns a Buffer in Node, but keep this safe for other runtimes.
  if (buf instanceof Uint8Array) return new Uint8Array(buf);
  return new Uint8Array(buf as ArrayBuffer);
}

function renderProperties(properties: unknown): string {
  if (!properties || typeof properties !== 'object') return '';
  const entries = Object.entries(properties as Record<string, unknown>);
  if (entries.length === 0) return '';
  return (
    '<Properties>' +
    entries
      .map(([k, v]) => {
        const key = escapeXml(String(k));
        const val = escapeXml(String(v ?? ''));
        return `<Property key="${key}">${val}</Property>`;
      })
      .join('') +
    '</Properties>'
  );
}

export function exportCanonicalToXml(args: {
  spec: MappingSpec;
  target: TargetSpec;
  context: { projectCode: string; centerCode: string };
  rows: Array<Record<string, unknown>>;
}): string {
  const { target, context, rows } = args;
  const src = target.sources.xml;
  if (!src) {
    throw new Error('Target does not support XML export');
  }

  // ObjectSet style XML export (roundtrip with PI property bag)
  if (isXmlObjectSetSource(src)) {
    const os = src;

    const modulePiNames = new Set(Object.values(os.module_fields).map((m) => m.pi).filter((x): x is string => typeof x === 'string' && x.length > 0));
    const pointPiNames = new Set(Object.values(os.point_fields).map((m) => m.pi).filter((x): x is string => typeof x === 'string' && x.length > 0));

    const escAttr = (v: unknown): string => escapeXml(String(v ?? ''));
    const renderPi = (name: string, value: unknown): string => {
      if (value == null || value === '') return '';
      return `<PI Name="${escapeXml(name)}" Value="${escAttr(value)}"/>`;
    };

    type ModuleKey = string;
    type Row = Record<string, unknown>;

    const modules = new Map<ModuleKey, { meta: Row; rows: Row[]; moduleProps: Record<string, unknown> }>();

    for (const r of rows) {
      const mName = String(r['module_name'] ?? '');
      const mType = String(r['module_xml_type'] ?? '');
      const mDescr = String(r['module_descr'] ?? '');
      const mId = String(r['module_id'] ?? '');
      const key = `${mName}|${mType}|${mDescr}|${mId}`;
      const props = (r['properties'] && typeof r['properties'] === 'object' && !Array.isArray(r['properties']) ? (r['properties'] as Record<string, unknown>) : {}) as Record<string, unknown>;
      const moduleProps = (props['module_properties'] && typeof props['module_properties'] === 'object' && !Array.isArray(props['module_properties'])
        ? (props['module_properties'] as Record<string, unknown>)
        : {}) as Record<string, unknown>;
      const bucket = modules.get(key);
      if (!bucket) {
        modules.set(key, { meta: r, rows: [r], moduleProps: { ...moduleProps } });
      } else {
        bucket.rows.push(r);
        // Merge module props
        for (const [k, v] of Object.entries(moduleProps)) {
          if (bucket.moduleProps[k] == null) bucket.moduleProps[k] = v;
        }
      }
    }

    const modulesXml = Array.from(modules.values())
      .map(({ meta, rows: modRows, moduleProps }) => {
        const mName = meta['module_name'];
        const mType = meta['module_xml_type'];
        const mDescr = meta['module_descr'];
        const moduleAttrs = `${mDescr ? ` DESCR="${escAttr(mDescr)}"` : ''} NAME="${escAttr(mName)}"${mType ? ` TYPE="${escAttr(mType)}"` : ''}`;

        const modulePis = Array.from(modulePiNames)
          .map((piName) => {
            // Map canonical module PI names back from known canonical fields
            // Currently: ModuleID is stored in `module_id`
            if (piName === 'ModuleID') return renderPi(piName, meta['module_id']);
            return '';
          })
          .join('');

        const moduleBagPis = Object.entries(moduleProps)
          .filter(([k]) => !modulePiNames.has(k))
          .map(([k, v]) => renderPi(k, v))
          .join('');

        const pointsXml = modRows
          .map((r) => {
            const pName = r['point_name'];
            const pType = r['point_xml_type'];
            const pDescr = r['point_descr'];
            const pointAttrs = `${pDescr ? ` DESCR="${escAttr(pDescr)}"` : ''} NAME="${escAttr(pName)}"${pType ? ` TYPE="${escAttr(pType)}"` : ''}`;

            const props = (r['properties'] && typeof r['properties'] === 'object' && !Array.isArray(r['properties']) ? (r['properties'] as Record<string, unknown>) : {}) as Record<string, unknown>;
            const pointProps = (props['point_properties'] && typeof props['point_properties'] === 'object' && !Array.isArray(props['point_properties'])
              ? (props['point_properties'] as Record<string, unknown>)
              : {}) as Record<string, unknown>;

            // Canonical point PIs
            const canonPiXml = Array.from(pointPiNames)
              .map((piName) => {
                if (piName === 'InputChannelNumber') return renderPi(piName, r['input_channel_number']);
                if (piName === 'OutputChannelNumber') return renderPi(piName, r['output_channel_number']);
                if (piName === 'NOTE2') return renderPi(piName, r['note2']);
                return '';
              })
              .join('');

            const bagPiXml = Object.entries(pointProps)
              .filter(([k]) => !pointPiNames.has(k))
              .map(([k, v]) => renderPi(k, v))
              .join('');

            return `<OI${pointAttrs}>${canonPiXml}${bagPiXml}</OI>`;
          })
          .join('');

        return `<OI${moduleAttrs}>${modulePis}${moduleBagPis}${pointsXml}</OI>`;
      })
      .join('');

    const metaXml = `
  <MetaInformation>
    <ExportedBy Value="TEIRA"/>
    <ProjectCode Value="${escAttr(context.projectCode)}"/>
    <CenterCode Value="${escAttr(context.centerCode)}"/>
    <DocType Value="${escapeXml(target.docType)}"/>
  </MetaInformation>`;

    return `<?xml version="1.0" encoding="UTF-8"?>\n<ObjectSet ExportMode="TEIRA" Version="1.0">${metaXml}\n  <ExportedObjects>${modulesXml}</ExportedObjects>\n</ObjectSet>`;
  }

  if (!isXmlPathSource(src)) {
    throw new Error('Invalid XML source mapping (unknown format)');
  }
  const pathSrc = src;

  // Build doc section for root_array_path, assuming last segment is the item node name
  const pathParts = pathSrc.root_array_path.split('.').filter(Boolean);
  if (pathParts.length < 1) throw new Error('Invalid root_array_path');

  const itemTag = pathParts[pathParts.length - 1];
  const containers = pathParts.slice(0, -1);

  const fieldTagByKey: Record<string, string> = {};
  for (const [fieldKey, fm] of Object.entries(pathSrc.fields)) {
    // Use the last segment of the path as the XML tag name
    const p = (fm.path ?? fieldKey).split('.').filter(Boolean);
    fieldTagByKey[fieldKey] = p[p.length - 1] ?? fieldKey;
  }

  const itemsXml = rows
    .map((r) => {
      const fieldsXml = Object.keys(pathSrc.fields)
        .map((fieldKey) => {
          const tag = fieldTagByKey[fieldKey] ?? fieldKey;
          const v = r[fieldKey];
          if (v == null || v === '') return '';
          return `<${tag}>${escapeXml(String(v))}</${tag}>`;
        })
        .join('');
      const propsXml = renderProperties(r['properties']);
      return `<${itemTag}>${fieldsXml}${propsXml}</${itemTag}>`;
    })
    .join('');

  // Wrap items into containers
  let section = itemsXml;
  for (let i = containers.length - 1; i >= 0; i--) {
    const tag = containers[i];
    section = `<${tag}>${section}</${tag}>`;
  }

  const metaXml = `<Meta><ProjectCode>${escapeXml(context.projectCode)}</ProjectCode><CenterCode>${escapeXml(
    context.centerCode
  )}</CenterCode><DocType>${escapeXml(target.docType)}</DocType></Meta>`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<TEIRAExport>${metaXml}${section}</TEIRAExport>`;
}
