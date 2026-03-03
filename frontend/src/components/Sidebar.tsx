import { motion, AnimatePresence } from 'framer-motion';
import { Trash, Plus } from 'lucide-react';
import { HistoryEntry } from '../types/history';
import { HistoryItem } from './HistoryItem';

interface SidebarProps {
  open: boolean;
  entries: HistoryEntry[];
  activeId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
  onNew: () => void;
}

export function Sidebar({ open, entries, activeId, onSelect, onDelete, onClear, onClose, onNew }: SidebarProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/40 z-20"
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.aside
            key="sidebar"
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed md:relative z-30 md:z-auto top-0 md:top-auto left-0 h-full md:h-auto w-72 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Histórico {entries.length > 0 && `(${entries.length})`}
              </span>
              {entries.length > 0 && (
                <button
                  onClick={onClear}
                  className="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Limpar histórico"
                >
                  <Trash className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* New analysis button */}
            <div className="px-2 pt-2">
              <button
                onClick={onNew}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Análise
              </button>
            </div>

            {/* Entries list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {entries.length === 0 ? (
                <p className="text-xs text-center text-gray-400 dark:text-gray-600 py-8 px-4">
                  Nenhuma análise realizada ainda.
                  <br />
                  Faça upload de um diagrama para começar.
                </p>
              ) : (
                entries.map((entry) => (
                  <HistoryItem
                    key={entry.id}
                    entry={entry}
                    isActive={entry.id === activeId}
                    onSelect={onSelect}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
