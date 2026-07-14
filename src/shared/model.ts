import type { SchemaOptions } from 'mongoose';

/**
 * Shared Mongoose schema options applied to every model for consistency:
 * - `timestamps` adds createdAt / updatedAt automatically.
 * - The `toJSON` transform normalizes documents for API responses:
 *   exposes `id` (string) instead of `_id`, drops the Mongoose `__v`, and
 *   strips any `password` field so it can never leak, even if accidentally selected.
 */
const transform = (_doc: unknown, ret: Record<string, unknown>): Record<string, unknown> => {
  if (ret._id != null) {
    ret.id = String(ret._id);
  }
  delete ret._id;
  delete ret.__v;
  delete ret.password;
  return ret;
};

// `satisfies` (not an annotation) keeps the precise literal type so it stays
// assignable to each model's specific, generic-parameterized schema options —
// annotating as `SchemaOptions` would pin the generics and break method typing.
export const baseSchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true, transform },
  toObject: { virtuals: true, transform },
} satisfies SchemaOptions;
