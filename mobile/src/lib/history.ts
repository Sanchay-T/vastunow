import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AnalysisResult } from '@/lib/types/vastu';

const HISTORY_KEY = 'vastuHistory';
const REPORT_PREFIX = 'vastuReport:';
const MAX_ENTRIES = 20;

export interface HistoryEntry {
  id: string;
  score: number;
  grade: string;
  facing?: string;
  rooms: number;
  createdAt: number;
  /** Local URI of the plan the user uploaded, used as a card thumbnail. */
  thumbUri?: string;
}

/** Storage is shared with older builds, so treat every entry as unvalidated. */
function isValidEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const e = value as Partial<HistoryEntry>;
  return (
    typeof e.id === 'string' && e.id.length > 0 &&
    typeof e.score === 'number' && Number.isFinite(e.score) &&
    typeof e.grade === 'string' &&
    typeof e.rooms === 'number' && Number.isFinite(e.rooms) &&
    typeof e.createdAt === 'number' && Number.isFinite(e.createdAt) &&
    (e.facing === undefined || typeof e.facing === 'string') &&
    (e.thumbUri === undefined || typeof e.thumbUri === 'string')
  );
}

export async function listHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidEntry) : [];
  } catch {
    return [];
  }
}

/**
 * Keeps the summary shown on the home screen alongside the full report, so an
 * older report opens straight from the device instead of needing the network.
 */
export async function saveReport(
  result: AnalysisResult,
  meta: { facing?: string; rooms: number; thumbUri?: string },
): Promise<void> {
  try {
    const entry: HistoryEntry = {
      id: result.id,
      score: result.overall_score,
      grade: result.grade,
      facing: meta.facing,
      rooms: meta.rooms,
      createdAt: Date.now(),
      thumbUri: meta.thumbUri,
    };

    const existing = await listHistory();
    const next = [entry, ...existing.filter((e) => e.id !== entry.id)];
    const dropped = next.slice(MAX_ENTRIES);
    const kept = next.slice(0, MAX_ENTRIES);

    // Report first: an index entry pointing at a missing report would show a
    // card that cannot open, whereas an unreferenced report is invisible.
    await AsyncStorage.setItem(REPORT_PREFIX + result.id, JSON.stringify(result));
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(kept));

    if (dropped.length) {
      await AsyncStorage.multiRemove(dropped.map((e) => REPORT_PREFIX + e.id));
    }
  } catch {
    /* history is a convenience; never block the report on it */
  }
}

export async function loadReport(id: string): Promise<AnalysisResult | null> {
  try {
    const raw = await AsyncStorage.getItem(REPORT_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function deleteReport(id: string): Promise<void> {
  try {
    const existing = await listHistory();
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(existing.filter((e) => e.id !== id)));
    await AsyncStorage.removeItem(REPORT_PREFIX + id);
  } catch {
    /* leave the list as it was */
  }
}

/** "Today", "Yesterday", "3 days ago", then a plain date. */
export function relativeDate(ts: number): string {
  const day = 24 * 60 * 60 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startOfToday.getTime() - ts) / day);

  if (ts >= startOfToday.getTime()) return 'Today';
  if (diffDays < 1) return 'Yesterday';
  if (diffDays < 6) return `${diffDays + 1} days ago`;

  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
