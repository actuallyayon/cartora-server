import type { Model } from 'mongoose';

/** Convert a display name into a URL-safe slug. */
export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Generate a slug that is unique within a collection. If the base slug is taken,
 * appends `-2`, `-3`, … until free. `excludeId` lets updates keep their own slug.
 */
export const generateUniqueSlug = async (
  model: Model<Record<string, unknown>>,
  name: string,
  excludeId?: string,
): Promise<string> => {
  const base = slugify(name) || 'item';
  let candidate = base;
  let suffix = 1;

  while (
    await model.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
  ) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
};
