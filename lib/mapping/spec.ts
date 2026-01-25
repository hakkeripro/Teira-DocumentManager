import { z } from 'zod';

const TransformConfigReplace = z.object({ from: z.string(), to: z.string() });
const TransformConfigDefault = z.object({ value: z.any() });

export const TransformDefSchema = z.union([
  z.string(),
  z.object({ replace: TransformConfigReplace }),
  z.object({ default: TransformConfigDefault }),
]);

export const FieldMapSchema = z.object({
  // XLSX field mapping uses `header`, XML uses `path`.
  header: z.string().optional(),
  path: z.string().optional(),
  required: z.boolean().optional(),
  transforms: z.array(z.string()).optional(),
});

export const ObjectSetFieldMapSchema = z
  .object({
    // For ObjectSet-style XML, map either an OI attribute or a PI Name.
    attr: z.string().optional(),
    pi: z.string().optional(),
    required: z.boolean().optional(),
    transforms: z.array(z.string()).optional(),
  })
  .refine((v) => Boolean(v.attr) !== Boolean(v.pi), {
    message: 'ObjectSet field map must define exactly one of `attr` or `pi`',
  });

export const TargetXlsxSchema = z.object({
  sheet: z.string(),
  header_row: z.number().int().positive(),
  row_start: z.number().int().positive(),
  columns: z.record(FieldMapSchema),
});

export const TargetXmlPathSchema = z.object({
  format: z.literal('path').optional(),
  root_array_path: z.string(),
  fields: z.record(FieldMapSchema),
});

export const TargetXmlObjectSetSchema = z.object({
  format: z.literal('objectset'),
  module_array_path: z.string(),
  point_array_key: z.string().optional(),
  known_module_types: z.array(z.string()).optional(),
  known_point_types: z.array(z.string()).optional(),
  module_fields: z.record(ObjectSetFieldMapSchema),
  point_fields: z.record(ObjectSetFieldMapSchema),
  preserve_property_bag: z.boolean().optional(),
});

export const TargetXmlSchema = z.union([TargetXmlPathSchema, TargetXmlObjectSetSchema]);

export const TargetSchema = z.object({
  docType: z.string(),
  identity_keys: z.array(z.string()).min(1),
  canonical: z.object({
    header_fields: z.array(z.string()).default([]),
    row_fields: z.array(z.string()).min(1),
  }),
  sources: z.object({
    xlsx: TargetXlsxSchema.optional(),
    xml: TargetXmlSchema.optional(),
  }),
});

export const MappingSpecSchema = z.object({
  version: z.number().int(),
  meta: z.record(z.any()).optional(),
  transforms: z.array(TransformDefSchema).default([]),
  context: z.record(z.any()).optional(),
  targets: z.array(TargetSchema),
  validation: z
    .object({
      required_context: z.array(z.string()).optional(),
      required_fields_behavior: z.enum(['error', 'warn']).optional(),
      unknown_columns_behavior: z.enum(['ignore', 'warn', 'error']).optional(),
      max_rows_default: z.number().int().positive().optional(),
    })
    .optional(),
  commit: z
    .object({
      mode: z.enum(['upsert_by_identity', 'append_only']).optional(),
      dry_run_supported: z.boolean().optional(),
      audit_required: z.boolean().optional(),
    })
    .optional(),
});

export type MappingSpec = z.infer<typeof MappingSpecSchema>;
export type TargetSpec = z.infer<typeof TargetSchema>;
