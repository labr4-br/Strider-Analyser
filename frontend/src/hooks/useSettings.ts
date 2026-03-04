import { useState, useCallback } from 'react';

export interface LLMSettings {
  model: string;
  maxTokens: number;
  apiKey: string;
  temperature: number;
}

const STORAGE_KEY = 'stride-llm-settings';

const DEFAULTS: LLMSettings = {
  model: 'gpt-4o',
  maxTokens: 16384,
  apiKey: import.meta.env.VITE_DEFAULT_OPENAI_KEY ?? '',
  temperature: 0.7,
};

export const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3', 'o3-mini', 'o4-mini'];

function load(): LLMSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time: seed localStorage with defaults (includes env key)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS));
      return DEFAULTS;
    }
    const saved = { ...DEFAULTS, ...JSON.parse(raw) };
    // If saved has no key but env has one, backfill it
    if (!saved.apiKey && DEFAULTS.apiKey) {
      saved.apiKey = DEFAULTS.apiKey;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }
    return saved;
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<LLMSettings>(load);

  const setSettings = useCallback((next: Partial<LLMSettings>) => {
    setSettingsState((prev) => {
      const merged = { ...prev, ...next };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const isConfigured = !!settings.apiKey.trim();

  return { settings, setSettings, isConfigured };
}
