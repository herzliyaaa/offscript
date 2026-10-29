import type { PostKind, RelationshipStatus } from './world.types.js';

export const POST_KINDS: PostKind[] = [
  'post',
  'reply',
  'quote',
  'headline',
  'dm',
];

export const RELATIONSHIP_STATUSES: RelationshipStatus[] = [
  'neutral',
  'friendly',
  'close',
  'romantic',
  'rival',
  'enemy',
  'mentor',
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function slugify(value: string, max = 20): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, max) || 'user'
  );
}

export function normalizeRawHandle(
  value: string | undefined,
  fallbackName: string,
): string {
  const base = (value ?? '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30);

  return `@${base || slugify(fallbackName, 30)}`;
}

export function uniqueHandle(
  raw: string | undefined,
  fallbackName: string,
  used: Set<string>,
): string {
  const base = normalizeRawHandle(raw, fallbackName).slice(1, 16) || 'user';
  let handle = `@${base}`;
  let suffix = 2;

  while (used.has(handle)) {
    handle = `@${base.slice(0, 13)}${suffix}`;
    suffix += 1;
  }

  used.add(handle);
  return handle;
}

export function normalizePostKind(kind: string | undefined): PostKind {
  return POST_KINDS.includes(kind as PostKind) ? (kind as PostKind) : 'post';
}

export function normalizeFeedKind(kind: string | undefined): PostKind {
  const normalized = normalizePostKind(kind);
  return normalized === 'dm' ? 'reply' : normalized;
}

export function normalizeRelationshipStatus(
  status: string | undefined,
  fallback: RelationshipStatus = 'neutral',
): RelationshipStatus {
  return RELATIONSHIP_STATUSES.includes(status as RelationshipStatus)
    ? (status as RelationshipStatus)
    : fallback;
}

export function statusForLevel(level: number): RelationshipStatus {
  if (level <= -60) {
    return 'enemy';
  }
  if (level <= -20) {
    return 'rival';
  }
  if (level >= 70) {
    return 'close';
  }
  if (level >= 30) {
    return 'friendly';
  }
  return 'neutral';
}

export function normalizeStats(
  input: Record<string, number> | undefined,
  labels: string[],
): Record<string, number> {
  const stats: Record<string, number> = {};

  for (const label of labels) {
    const value = input?.[label];
    stats[label] =
      typeof value === 'number' && Number.isFinite(value)
        ? clamp(Math.round(value), 0, 100)
        : 50;
  }

  return stats;
}
