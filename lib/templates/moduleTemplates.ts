// Module template library (v1) for Teira DocumentManager.
//
// Source of truth: docs/12_MODULE_TEMPLATE_LIBRARY.md

export type ModuleTemplateId =
  | 'DI-16'
  | 'UI-16'
  | 'AO-V-8'
  | 'DO-FA-12'
  | 'DO-FA-12-H'
  | 'PS'
  | 'AS-P';

export type ModuleTemplateTerminal = {
  /** Stable code used as a terminal-row key inside the editor state. */
  terminal_code: string;
  /** Printed label shown in the grid ("Liitin"). */
  print_label: string;
  /** Deterministic order within the page. */
  order: number;
  /** Optional grouping hint (e.g. RET sharing) for future UI. */
  group?: string;
  /** Connector lines for print parity (stacked in Liitin column). */
  connector_lines?: string[];
};

export type ModuleTemplate = {
  id: ModuleTemplateId;
  label: string;
  terminals: ModuleTemplateTerminal[];
};

function t(code: string, label: string, order: number, group?: string, connector_lines?: string[]): ModuleTemplateTerminal {
  return { terminal_code: code, print_label: label, order, group, connector_lines };
}

export const MODULE_TEMPLATES: Record<ModuleTemplateId, ModuleTemplate> = {
  'DI-16': {
    id: 'DI-16',
    label: 'DI-16',
    terminals: [
      // Each DI channel has connector_lines: [DI/n, RET/m, G, G0]
      t('DI1', 'DI1 / 1', 1, 'GRP1', ['DI1 / 1', 'RET / 2', 'G', 'G0']),
      t('DI2', 'DI2 / 3', 2, 'GRP2', ['DI2 / 3', 'RET / 2', 'G', 'G0']),
      t('DI3', 'DI3 / 4', 3, 'GRP3', ['DI3 / 4', 'RET / 5', 'G', 'G0']),
      t('DI4', 'DI4 / 6', 4, 'GRP4', ['DI4 / 6', 'RET / 5', 'G', 'G0']),
      t('DI5', 'DI5 / 7', 5, 'GRP5', ['DI5 / 7', 'RET / 8', 'G', 'G0']),
      t('DI6', 'DI6 / 9', 6, 'GRP6', ['DI6 / 9', 'RET / 11', 'G', 'G0']),
      t('DI7', 'DI7 / 10', 7, 'GRP7', ['DI7 / 10', 'RET / 11', 'G', 'G0']),
      t('DI8', 'DI8 / 12', 8, 'GRP8', ['DI8 / 12', 'RET / 14', 'G', 'G0']),
      t('DI9', 'DI9 / 13', 9, 'GRP9', ['DI9 / 13', 'RET / 14', 'G', 'G0']),
      t('DI10', 'DI10 / 15', 10, 'GRP10', ['DI10 / 15', 'RET / 17', 'G', 'G0']),
      t('DI11', 'DI11 / 16', 11, 'GRP11', ['DI11 / 16', 'RET / 17', 'G', 'G0']),
      t('DI12', 'DI12 / 18', 12, 'GRP12', ['DI12 / 18', 'RET / 20', 'G', 'G0']),
      t('DI13', 'DI13 / 19', 13, 'GRP13', ['DI13 / 19', 'RET / 20', 'G', 'G0']),
      t('DI14', 'DI14 / 21', 14, 'GRP14', ['DI14 / 21', 'RET / 23', 'G', 'G0']),
      t('DI15', 'DI15 / 22', 15, 'GRP15', ['DI15 / 22', 'RET / 23', 'G', 'G0']),
      t('DI16', 'DI16 / 24', 16, 'GRP16', ['DI16 / 24', 'RET / 23', 'G', 'G0']),
    ],
  },
  'UI-16': {
    id: 'UI-16',
    label: 'UI-16',
    terminals: [
      // Each UI channel has connector_lines: [UI/n, RET/m, G, G0]
      t('UI1', 'UI1 / 1', 1, 'GRP1', ['UI1 / 1', 'RET / 2', 'G', 'G0']),
      t('UI2', 'UI2 / 3', 2, 'GRP2', ['UI2 / 3', 'RET / 2', 'G', 'G0']),
      t('UI3', 'UI3 / 4', 3, 'GRP3', ['UI3 / 4', 'RET / 5', 'G', 'G0']),
      t('UI4', 'UI4 / 6', 4, 'GRP4', ['UI4 / 6', 'RET / 5', 'G', 'G0']),
      t('UI5', 'UI5 / 7', 5, 'GRP5', ['UI5 / 7', 'RET / 8', 'G', 'G0']),
      t('UI6', 'UI6 / 9', 6, 'GRP6', ['UI6 / 9', 'RET / 11', 'G', 'G0']),
      t('UI7', 'UI7 / 10', 7, 'GRP7', ['UI7 / 10', 'RET / 11', 'G', 'G0']),
      t('UI8', 'UI8 / 12', 8, 'GRP8', ['UI8 / 12', 'RET / 14', 'G', 'G0']),
      t('UI9', 'UI9 / 13', 9, 'GRP9', ['UI9 / 13', 'RET / 14', 'G', 'G0']),
      t('UI10', 'UI10 / 15', 10, 'GRP10', ['UI10 / 15', 'RET / 17', 'G', 'G0']),
      t('UI11', 'UI11 / 16', 11, 'GRP11', ['UI11 / 16', 'RET / 17', 'G', 'G0']),
      t('UI12', 'UI12 / 18', 12, 'GRP12', ['UI12 / 18', 'RET / 20', 'G', 'G0']),
      t('UI13', 'UI13 / 19', 13, 'GRP13', ['UI13 / 19', 'RET / 20', 'G', 'G0']),
      t('UI14', 'UI14 / 21', 14, 'GRP14', ['UI14 / 21', 'RET / 23', 'G', 'G0']),
      t('UI15', 'UI15 / 22', 15, 'GRP15', ['UI15 / 22', 'RET / 23', 'G', 'G0']),
      t('UI16', 'UI16 / 24', 16, 'GRP16', ['UI16 / 24', 'RET / 23', 'G', 'G0']),
    ],
  },
  'AO-V-8': {
    id: 'AO-V-8',
    label: 'AO-V-8',
    terminals: [
      // Each AO channel has connector_lines: [AO/n, RET/m, G, G0]
      t('AO1', 'AO1 / 1', 1, 'GRP1', ['AO1 / 1', 'RET / 2', 'G', 'G0']),
      t('AO2', 'AO2 / 4', 2, 'GRP2', ['AO2 / 4', 'RET / 5', 'G', 'G0']),
      t('AO3', 'AO3 / 7', 3, 'GRP3', ['AO3 / 7', 'RET / 8', 'G', 'G0']),
      t('AO4', 'AO4 / 10', 4, 'GRP4', ['AO4 / 10', 'RET / 11', 'G', 'G0']),
      t('AO5', 'AO5 / 13', 5, 'GRP5', ['AO5 / 13', 'RET / 14', 'G', 'G0']),
      t('AO6', 'AO6 / 16', 6, 'GRP6', ['AO6 / 16', 'RET / 17', 'G', 'G0']),
      t('AO7', 'AO7 / 19', 7, 'GRP7', ['AO7 / 19', 'RET / 20', 'G', 'G0']),
      t('AO8', 'AO8 / 22', 8, 'GRP8', ['AO8 / 22', 'RET / 23', 'G', 'G0']),
    ],
  },
  'DO-FA-12': {
    id: 'DO-FA-12',
    label: 'DO-FA-12',
    terminals: [
      // Each DO channel has connector_lines: [DO NO/n, DO C/m, G, G0]
      t('DO1', 'DO1 NO / 1', 1, 'DO1', ['DO1 NO / 1', 'DO1 C / 2', 'G', 'G0']),
      t('DO2', 'DO2 NO / 3', 2, 'DO2', ['DO2 NO / 3', 'DO2 C / 4', 'G', 'G0']),
      t('DO3', 'DO3 NO / 5', 3, 'DO3', ['DO3 NO / 5', 'DO3 C / 6', 'G', 'G0']),
      t('DO4', 'DO4 NO / 7', 4, 'DO4', ['DO4 NO / 7', 'DO4 C / 8', 'G', 'G0']),
      t('DO5', 'DO5 NO / 9', 5, 'DO5', ['DO5 NO / 9', 'DO5 C / 10', 'G', 'G0']),
      t('DO6', 'DO6 NO / 11', 6, 'DO6', ['DO6 NO / 11', 'DO6 C / 12', 'G', 'G0']),
      t('DO7', 'DO7 NO / 13', 7, 'DO7', ['DO7 NO / 13', 'DO7 C / 14', 'G', 'G0']),
      t('DO8', 'DO8 NO / 15', 8, 'DO8', ['DO8 NO / 15', 'DO8 C / 16', 'G', 'G0']),
      t('DO9', 'DO9 NO / 17', 9, 'DO9', ['DO9 NO / 17', 'DO9 C / 18', 'G', 'G0']),
      t('DO10', 'DO10 NO / 19', 10, 'DO10', ['DO10 NO / 19', 'DO10 C / 20', 'G', 'G0']),
      t('DO11', 'DO11 NO / 21', 11, 'DO11', ['DO11 NO / 21', 'DO11 C / 22', 'G', 'G0']),
      t('DO12', 'DO12 NO / 23', 12, 'DO12', ['DO12 NO / 23', 'DO12 C / 24', 'G', 'G0']),
    ],
  },
  'DO-FA-12-H': {
    id: 'DO-FA-12-H',
    label: 'DO-FA-12-H',
    terminals: [
      // Same connector_lines structure as DO-FA-12
      t('DO1', 'DO1 NO / 1', 1, 'DO1', ['DO1 NO / 1', 'DO1 C / 2', 'G', 'G0']),
      t('DO2', 'DO2 NO / 3', 2, 'DO2', ['DO2 NO / 3', 'DO2 C / 4', 'G', 'G0']),
      t('DO3', 'DO3 NO / 5', 3, 'DO3', ['DO3 NO / 5', 'DO3 C / 6', 'G', 'G0']),
      t('DO4', 'DO4 NO / 7', 4, 'DO4', ['DO4 NO / 7', 'DO4 C / 8', 'G', 'G0']),
      t('DO5', 'DO5 NO / 9', 5, 'DO5', ['DO5 NO / 9', 'DO5 C / 10', 'G', 'G0']),
      t('DO6', 'DO6 NO / 11', 6, 'DO6', ['DO6 NO / 11', 'DO6 C / 12', 'G', 'G0']),
      t('DO7', 'DO7 NO / 13', 7, 'DO7', ['DO7 NO / 13', 'DO7 C / 14', 'G', 'G0']),
      t('DO8', 'DO8 NO / 15', 8, 'DO8', ['DO8 NO / 15', 'DO8 C / 16', 'G', 'G0']),
      t('DO9', 'DO9 NO / 17', 9, 'DO9', ['DO9 NO / 17', 'DO9 C / 18', 'G', 'G0']),
      t('DO10', 'DO10 NO / 19', 10, 'DO10', ['DO10 NO / 19', 'DO10 C / 20', 'G', 'G0']),
      t('DO11', 'DO11 NO / 21', 11, 'DO11', ['DO11 NO / 21', 'DO11 C / 22', 'G', 'G0']),
      t('DO12', 'DO12 NO / 23', 12, 'DO12', ['DO12 NO / 23', 'DO12 C / 24', 'G', 'G0']),
    ],
  },
  PS: {
    id: 'PS',
    label: 'PS (Power Supply)',
    terminals: [
      // Placeholder terminals until user provides the exact PS page reference.
      t('PS_TBD1', 'PS TBD / 1', 1, 'TBD'),
      t('PS_TBD2', 'PS TBD / 2', 2, 'TBD'),
      t('PS_TBD3', 'PS TBD / 3', 3, 'TBD'),
      t('PS_TBD4', 'PS TBD / 4', 4, 'TBD'),
    ],
  },
  'AS-P': {
    id: 'AS-P',
    label: 'AS-P (Automation Server)',
    terminals: [
      t('ETH1', 'Ethernet 1 / RJ-45', 1, 'ETH'),
      t('ETH2', 'Ethernet 2 / RJ-45', 2, 'ETH'),
      t('BUS1_P1', 'TX/RX+ / 1', 3, 'BUS1'),
      t('BUS1_N2', 'TX/RX- / 2', 4, 'BUS1'),
      t('BUS1_RET3', 'RET / 3', 5, 'BUS1'),
      t('BUS1_BIAS4', 'Bias+ / 4', 6, 'BUS1'),
      t('BUS2_P1', 'TX/RX+ / 1 (2. väylä)', 7, 'BUS2'),
      t('BUS2_N2', 'TX/RX- / 2 (2. väylä)', 8, 'BUS2'),
      t('BUS2_RET3', 'RET / 3 (2. väylä)', 9, 'BUS2'),
      t('BUS2_BIAS4', 'Bias+ / 4 (2. väylä)', 10, 'BUS2'),
      t('BUS3_P5', 'TX/RX+ / 5', 11, 'BUS3'),
      t('BUS3_N6', 'TX/RX- / 6', 12, 'BUS3'),
      t('BUS3_RET7', 'RET / 7', 13, 'BUS3'),
      t('BUS4_P5', 'TX/RX+ / 5 (2. kanava)', 14, 'BUS4'),
      t('BUS4_N6', 'TX/RX- / 6 (2. kanava)', 15, 'BUS4'),
      t('BUS4_RET7', 'RET / 7 (2. kanava)', 16, 'BUS4'),
      t('LON1_11', 'LON-1 / 11', 17, 'LON1'),
      t('LON2_12', 'LON-2 / 12', 18, 'LON1'),
      t('LON1_11_B', 'LON-1 / 11 (2. kanava)', 19, 'LON2'),
      t('LON2_12_B', 'LON-2 / 12 (2. kanava)', 20, 'LON2'),

    ],
  },
};

export function getTemplate(id: ModuleTemplateId): ModuleTemplate {
  return MODULE_TEMPLATES[id];
}

export function normalizeTemplateId(v: unknown): ModuleTemplateId | null {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return null;
  const k = s.toUpperCase();
  if (k === 'DI-16') return 'DI-16';
  if (k === 'UI-16') return 'UI-16';
  if (k === 'AO-V-8' || k === 'AOV-8' || k === 'AO8') return 'AO-V-8';
  if (k === 'DO-FA-12') return 'DO-FA-12';
  if (k === 'DO-FA-12-H' || k === 'DO-FA-12H') return 'DO-FA-12-H';
  if (k === 'PS') return 'PS';
  if (k === 'AS-P' || k === 'ASP') return 'AS-P';
  return null;
}

/**
 * Best-effort mapping from canonical module_xml_type into a module template.
 * If we cannot map safely, return null and leave the page editable with a placeholder template.
 */
export function templateForModuleXmlType(xmlType: unknown): ModuleTemplateId | null {
  const s = typeof xmlType === 'string' ? xmlType.trim() : '';
  if (!s) return null;
  const t = s.toUpperCase();
  if (t.includes('DI') && t.includes('16')) return 'DI-16';
  if (t.includes('UI') && t.includes('16')) return 'UI-16';
  if ((t.includes('AO') && t.includes('8')) || t.includes('AOV8') || t.includes('AO-V-8')) return 'AO-V-8';
  if (t.includes('DO') && t.includes('12') && t.includes('H')) return 'DO-FA-12-H';
  if (t.includes('DO') && t.includes('12')) return 'DO-FA-12';
  if (t.includes('AS-P') || t.includes('AUTOMATION') || t.includes('SERVER')) return 'AS-P';
  if (t === 'PS' || t.includes('POWER')) return 'PS';
  return null;
}
