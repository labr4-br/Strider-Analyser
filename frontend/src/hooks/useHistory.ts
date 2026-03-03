import { useState, useCallback } from 'react';
import type { HistoryEntry } from '../types/history';

const STORAGE_KEY = 'stride_history';
const MAX_ENTRIES = 15;

function loadFromStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw) as HistoryEntry[];
    // Filter out entries from old format that don't have the analysis field
    return entries.filter(
      (e) => e && typeof e.analysis === 'object' && e.analysis !== null
    );
  } catch {
    return [];
  }
}

function persist(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Silently ignore QuotaExceededError
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadFromStorage);

  const save = useCallback((entry: HistoryEntry) => {
    setEntries((prev) => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    persist([]);
  }, []);

  return { entries, save, remove, clear };
}
