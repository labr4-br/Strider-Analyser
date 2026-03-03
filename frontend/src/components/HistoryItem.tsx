import { Trash2 } from 'lucide-react';
import { HistoryEntry } from '../types/history';

interface HistoryItemProps {
  entry: HistoryEntry;
  isActive: boolean;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getMaxSeverityLabel(entry: HistoryEntry): { label: string; cls: string } | null {
  const criticalCount = entry.analysis?.criticalCount ?? 0;
  const highCount = entry.analysis?.highCount ?? 0;
  if (criticalCount > 0) return { label: 'Crítico', cls: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' };
  if (highCount > 0) return { label: 'Alto', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400' };
  return null;
}

export function HistoryItem({ entry, isActive, onSelect, onDelete }: HistoryItemProps) {
  const severityBadge = getMaxSeverityLabel(entry);

  return (
    <div
      className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-950/40'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      onClick={() => onSelect(entry)}
    >
      {/* Thumbnail */}
      <img
        src={`data:${entry.imageMimeType};base64,${entry.imageBase64}`}
        alt={entry.imageName}
        className="w-10 h-10 rounded-md object-cover shrink-0 border border-gray-200 dark:border-gray-700"
      />

      {/* Metadata */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
          {entry.imageName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {formatDate(entry.timestamp)}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {entry.analysis?.totalThreats ?? 0} ameaças
          </span>
          {severityBadge && (
            <span className={`text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded ${severityBadge.cls}`}>
              {severityBadge.label}
            </span>
          )}
        </div>
      </div>

      {/* Delete button — visible on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(entry.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
        title="Remover"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
