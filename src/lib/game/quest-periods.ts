import type { QuestCadence } from "@/lib/types/game";

/** UTC calendar date YYYY-MM-DD (rolls at 00:00 UTC). */
export function getUtcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Monday UTC date YYYY-MM-DD for the ISO week containing `date`.
 * Weekly quests reset when this key changes (Monday 00:00 UTC boundaries).
 */
export function getMondayUtcDateKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = d.getUTCDay();
  const offsetToMonday = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + offsetToMonday);
  return d.toISOString().slice(0, 10);
}

export function getPeriodKeyForCadence(cadence: QuestCadence, date = new Date()): string {
  return cadence === "daily" ? getUtcDateKey(date) : getMondayUtcDateKey(date);
}

function timestampToDate(value: unknown): Date | null {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Infer period from legacy docs created before `periodKey` existed. */
export function inferPeriodKeyFromLegacyDoc(data: Record<string, unknown>, cadence: QuestCadence): string | undefined {
  const last = timestampToDate(data.lastUpdatedAt);
  if (!last) {
    return undefined;
  }
  return getPeriodKeyForCadence(cadence, last);
}

export function resolveStoredPeriodKey(data: Record<string, unknown>, cadence: QuestCadence): string | undefined {
  const pk = data.periodKey;
  if (typeof pk === "string" && pk.length > 0) {
    return pk;
  }
  return inferPeriodKeyFromLegacyDoc(data, cadence);
}

/** True if saved progress belongs to a prior daily/weekly period (or is unreadable legacy data). */
export function isProgressStale(data: Record<string, unknown> | undefined, cadence: QuestCadence, now = new Date()): boolean {
  if (!data) {
    return true;
  }
  const resolved = resolveStoredPeriodKey(data, cadence);
  if (!resolved) {
    return true;
  }
  return resolved !== getPeriodKeyForCadence(cadence, now);
}
