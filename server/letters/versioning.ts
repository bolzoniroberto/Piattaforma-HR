import type { EmployeeLetter } from '@shared/schema';

export interface VersionInfo {
  /** 1 for the first letter of a chain, then 2, 3, … */
  version: number;
  /** The previous version, when this letter replaces one. */
  replaces: { id: string; version: number; publishedAt: number | null } | null;
  /** The next version, when this letter has been replaced. */
  replacedBy: { id: string; version: number; publishedAt: number | null } | null;
}

/**
 * Rebuilds version numbers from the replaces_id chain. `letters` must contain
 * every non-draft letter of the users involved (revoked ones included), so that
 * chains are complete. Guards against cycles from inconsistent data.
 */
export function computeVersions(letters: EmployeeLetter[]): Map<string, VersionInfo> {
  const byId = new Map(letters.map(l => [l.id, l]));
  const successor = new Map<string, EmployeeLetter>();
  for (const l of letters) {
    if (!l.replacesId) continue;
    const current = successor.get(l.replacesId);
    // If a letter was replaced more than once, the most recent replacement wins.
    if (!current || (l.publishedAt ?? 0) > (current.publishedAt ?? 0)) successor.set(l.replacesId, l);
  }

  const versionCache = new Map<string, number>();
  function versionOf(id: string, seen = new Set<string>()): number {
    const cached = versionCache.get(id);
    if (cached) return cached;
    const prevId = byId.get(id)?.replacesId;
    const v = prevId && byId.has(prevId) && !seen.has(prevId)
      ? versionOf(prevId, new Set(seen).add(id)) + 1
      : 1;
    versionCache.set(id, v);
    return v;
  }

  const result = new Map<string, VersionInfo>();
  for (const l of letters) {
    const prev = l.replacesId ? byId.get(l.replacesId) : undefined;
    const next = successor.get(l.id);
    result.set(l.id, {
      version: versionOf(l.id),
      replaces: prev ? { id: prev.id, version: versionOf(prev.id), publishedAt: prev.publishedAt } : null,
      replacedBy: next ? { id: next.id, version: versionOf(next.id), publishedAt: next.publishedAt } : null,
    });
  }
  return result;
}
