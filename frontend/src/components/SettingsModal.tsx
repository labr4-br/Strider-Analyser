import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import { LLMSettings, OPENAI_MODELS } from '../hooks/useSettings';
import { OpenAIIcon } from './OpenAIIcon';

interface SettingsModalProps {
  open: boolean;
  settings: LLMSettings;
  onSave: (next: Partial<LLMSettings>) => void;
  onClose: () => void;
}

export function SettingsModal({ open, settings, onSave, onClose }: SettingsModalProps) {
  const [draft, setDraft] = useState<LLMSettings>(settings);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setShowKey(false);
    }
  }, [open, settings]);

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const maskedKey = draft.apiKey
    ? `${draft.apiKey.slice(0, 7)}${'•'.repeat(Math.max(0, draft.apiKey.length - 11))}${draft.apiKey.slice(-4)}`
    : '';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 inset-0 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <OpenAIIcon className="w-[18px] h-[18px] shrink-0 text-gray-400 dark:text-gray-500" />
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Configurações</h2>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-none mt-0.5">OpenAI API</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-4">
                {/* API Key */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">API Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={showKey ? draft.apiKey : maskedKey}
                      onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
                      onFocus={() => setShowKey(true)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-600">
                    {draft.apiKey ? 'Salva localmente no navegador' : 'Obrigatório para realizar análises'}
                  </p>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Modelo</label>
                  <select
                    value={draft.model}
                    onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {OPENAI_MODELS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Token limit + Temperature */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Max Tokens</label>
                    <input
                      type="number"
                      value={draft.maxTokens}
                      onChange={(e) => setDraft((d) => ({ ...d, maxTokens: Number(e.target.value) || 4096 }))}
                      min={1024}
                      max={128000}
                      step={1024}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Temperatura</label>
                    <input
                      type="number"
                      value={draft.temperature}
                      onChange={(e) => setDraft((d) => ({ ...d, temperature: Number(e.target.value) }))}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!draft.apiKey.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
