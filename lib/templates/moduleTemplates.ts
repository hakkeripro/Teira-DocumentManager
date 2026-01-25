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
};

export type ModuleTemplate = {
  id: ModuleTemplateId;
  label: string;
  terminals: ModuleTemplateTerminal[];
};

function t(code: string, label: string, order: number, group?: string): ModuleTemplateTerminal {
  return { terminal_code: code, print_label: label, order, group };
}

export const MODULE_TEMPLATES: Record<ModuleTemplateId, ModuleTemplate> = {
  'DI-16': {
    id: 'DI-16',
    label: 'DI-16',
    terminals: [
      t('DI1', 'DI1 / 1', 1, 'RET2'),
      t('RET2', 'RET / 2', 2, 'RET2'),
      t('G', 'G', 3),
      t('G0', 'G0', 4),
      t('DI2', 'DI2 / 3', 5, 'RET2'),
      t('DI3', 'DI3 / 4', 6, 'RET5'),
      t('RET5', 'RET / 5', 7, 'RET5'),
      t('DI4', 'DI4 / 6', 8, 'RET5'),
      t('DI5', 'DI5 / 7', 9, 'RET8'),
      t('RET8', 'RET / 8', 10, 'RET8'),
      t('DI6', 'DI6 / 9', 11, 'RET11'),
      t('DI7', 'DI7 / 10', 12, 'RET11'),
      t('RET11', 'RET / 11', 13, 'RET11'),
      t('DI8', 'DI8 / 12', 14, 'RET14'),
      t('DI9', 'DI9 / 13', 15, 'RET14'),
      t('RET14', 'RET / 14', 16, 'RET14'),
      t('DI10', 'DI10 / 15', 17, 'RET17'),
      t('DI11', 'DI11 / 16', 18, 'RET17'),
      t('RET17', 'RET / 17', 19, 'RET17'),
      t('DI12', 'DI12 / 18', 20, 'RET20'),
      t('DI13', 'DI13 / 19', 21, 'RET20'),
      t('RET20', 'RET / 20', 22, 'RET20'),
      t('DI14', 'DI14 / 21', 23, 'RET23'),
      t('DI15', 'DI15 / 22', 24, 'RET23'),
      t('RET23', 'RET / 23', 25, 'RET23'),
      t('DI16', 'DI16 / 24', 26, 'RET23'),
    ],
  },
  'UI-16': {
    id: 'UI-16',
    label: 'UI-16',
    terminals: [
      t('UI1', 'UI1 / 1', 1, 'RET2'),
      t('RET2', 'RET / 2', 2, 'RET2'),
      t('G', 'G', 3),
      t('G0', 'G0', 4),
      t('UI2', 'UI2 / 3', 5, 'RET2'),
      t('UI3', 'UI3 / 4', 6, 'RET5'),
      t('RET5', 'RET / 5', 7, 'RET5'),
      t('UI4', 'UI4 / 6', 8, 'RET5'),
      t('UI5', 'UI5 / 7', 9, 'RET8'),
      t('RET8', 'RET / 8', 10, 'RET8'),
      t('UI6', 'UI6 / 9', 11, 'RET11'),
      t('UI7', 'UI7 / 10', 12, 'RET11'),
      t('RET11', 'RET / 11', 13, 'RET11'),
      t('UI8', 'UI8 / 12', 14, 'RET14'),
      t('UI9', 'UI9 / 13', 15, 'RET14'),
      t('RET14', 'RET / 14', 16, 'RET14'),
      t('UI10', 'UI10 / 15', 17, 'RET17'),
      t('UI11', 'UI11 / 16', 18, 'RET17'),
      t('RET17', 'RET / 17', 19, 'RET17'),
      t('UI12', 'UI12 / 18', 20, 'RET20'),
      t('UI13', 'UI13 / 19', 21, 'RET20'),
      t('RET20', 'RET / 20', 22, 'RET20'),
      t('UI14', 'UI14 / 21', 23, 'RET23'),
      t('UI15', 'UI15 / 22', 24, 'RET23'),
      t('RET23', 'RET / 23', 25, 'RET23'),
      t('UI16', 'UI16 / 24', 26, 'RET23'),
    ],
  },
  'AO-V-8': {
    id: 'AO-V-8',
    label: 'AO-V-8',
    terminals: [
      t('AO1', 'AO1 / 1', 1, 'RET2'),
      t('RET2', 'RET / 2', 2, 'RET2'),
      t('G', 'G', 3),
      t('G0', 'G0', 4),
      t('AO2', 'AO2 / 4', 5, 'RET5'),
      t('RET5', 'RET / 5', 6, 'RET5'),
      t('AO3', 'AO3 / 7', 7, 'RET8'),
      t('RET8', 'RET / 8', 8, 'RET8'),
      t('AO4', 'AO4 / 10', 9, 'RET11'),
      t('RET11', 'RET / 11', 10, 'RET11'),
      t('AO5', 'AO5 / 13', 11, 'RET14'),
      t('RET14', 'RET / 14', 12, 'RET14'),
      t('AO6', 'AO6 / 16', 13, 'RET17'),
      t('RET17', 'RET / 17', 14, 'RET17'),
      t('AO7', 'AO7 / 19', 15, 'RET20'),
      t('RET20', 'RET / 20', 16, 'RET20'),
      t('AO8', 'AO8 / 22', 17, 'RET23'),
      t('RET23', 'RET / 23', 18, 'RET23'),
    ],
  },
  'DO-FA-12': {
    id: 'DO-FA-12',
    label: 'DO-FA-12',
    terminals: [
      t('DO1_NO', 'DO1 NO / 1', 1, 'DO1'),
      t('DO1_C', 'DO1 C / 2', 2, 'DO1'),
      t('G', 'G', 3),
      t('G0', 'G0', 4),
      t('DO2_NO', 'DO2 NO / 3', 5, 'DO2'),
      t('DO2_C', 'DO2 C / 4', 6, 'DO2'),
      t('DO3_NO', 'DO3 NO / 5', 7, 'DO3'),
      t('DO3_C', 'DO3 C / 6', 8, 'DO3'),
      t('DO4_NO', 'DO4 NO / 7', 9, 'DO4'),
      t('DO4_C', 'DO4 C / 8', 10, 'DO4'),
      t('DO5_NO', 'DO5 NO / 9', 11, 'DO5'),
      t('DO5_C', 'DO5 C / 10', 12, 'DO5'),
      t('DO6_NO', 'DO6 NO / 11', 13, 'DO6'),
      t('DO6_C', 'DO6 C / 12', 14, 'DO6'),
      t('DO7_NO', 'DO7 NO / 13', 15, 'DO7'),
      t('DO7_C', 'DO7 C / 14', 16, 'DO7'),
      t('DO8_NO', 'DO8 NO / 15', 17, 'DO8'),
      t('DO8_C', 'DO8 C / 16', 18, 'DO8'),
      t('DO9_NO', 'DO9 NO / 17', 19, 'DO9'),
      t('DO9_C', 'DO9 C / 18', 20, 'DO9'),
      t('DO10_NO', 'DO10 NO / 19', 21, 'DO10'),
      t('DO10_C', 'DO10 C / 20', 22, 'DO10'),
      t('DO11_NO', 'DO11 NO / 21', 23, 'DO11'),
      t('DO11_C', 'DO11 C / 22', 24, 'DO11'),
      t('DO12_NO', 'DO12 NO / 23', 25, 'DO12'),
      t('DO12_C', 'DO12 C / 24', 26, 'DO12'),
    ],
  },
  'DO-FA-12-H': {
    id: 'DO-FA-12-H',
    label: 'DO-FA-12-H',
    terminals: [
      // Same terminal map as DO-FA-12
      ...(
        [
          t('DO1_NO', 'DO1 NO / 1', 1, 'DO1'),
          t('DO1_C', 'DO1 C / 2', 2, 'DO1'),
          t('G', 'G', 3),
          t('G0', 'G0', 4),
          t('DO2_NO', 'DO2 NO / 3', 5, 'DO2'),
          t('DO2_C', 'DO2 C / 4', 6, 'DO2'),
          t('DO3_NO', 'DO3 NO / 5', 7, 'DO3'),
          t('DO3_C', 'DO3 C / 6', 8, 'DO3'),
          t('DO4_NO', 'DO4 NO / 7', 9, 'DO4'),
          t('DO4_C', 'DO4 C / 8', 10, 'DO4'),
          t('DO5_NO', 'DO5 NO / 9', 11, 'DO5'),
          t('DO5_C', 'DO5 C / 10', 12, 'DO5'),
          t('DO6_NO', 'DO6 NO / 11', 13, 'DO6'),
          t('DO6_C', 'DO6 C / 12', 14, 'DO6'),
          t('DO7_NO', 'DO7 NO / 13', 15, 'DO7'),
          t('DO7_C', 'DO7 C / 14', 16, 'DO7'),
          t('DO8_NO', 'DO8 NO / 15', 17, 'DO8'),
          t('DO8_C', 'DO8 C / 16', 18, 'DO8'),
          t('DO9_NO', 'DO9 NO / 17', 19, 'DO9'),
          t('DO9_C', 'DO9 C / 18', 20, 'DO9'),
          t('DO10_NO', 'DO10 NO / 19', 21, 'DO10'),
          t('DO10_C', 'DO10 C / 20', 22, 'DO10'),
          t('DO11_NO', 'DO11 NO / 21', 23, 'DO11'),
          t('DO11_C', 'DO11 C / 22', 24, 'DO11'),
          t('DO12_NO', 'DO12 NO / 23', 25, 'DO12'),
          t('DO12_C', 'DO12 C / 24', 26, 'DO12'),
        ]
      ),
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
