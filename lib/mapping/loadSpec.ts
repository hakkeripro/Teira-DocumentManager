import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { MappingSpecSchema, type MappingSpec } from '@/lib/mapping/spec';

declare global {
  // eslint-disable-next-line no-var
  var __teiraMappingSpec: MappingSpec | undefined;
}

export async function loadMappingSpecFromRepo(): Promise<MappingSpec> {
  if (global.__teiraMappingSpec) return global.__teiraMappingSpec;

  const specPath = path.join(process.cwd(), 'docs', 'mapping', 'MappingSpec.yaml');
  const raw = await fs.readFile(specPath, 'utf8');
  const parsed = YAML.parse(raw);
  const spec = MappingSpecSchema.parse(parsed);
  global.__teiraMappingSpec = spec;
  return spec;
}
