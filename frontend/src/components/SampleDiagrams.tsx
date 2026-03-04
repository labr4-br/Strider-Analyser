import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { FolderOpen, Loader2 } from 'lucide-react';

interface SampleDiagramsProps {
  onFileSelect: (file: File) => void;
}

const SAMPLES = [
  { id: 'news-feed', name: 'News Feed', file: 'news-feed.png' },
  { id: 'chat-system', name: 'Chat System', file: 'chat-system.png' },
  { id: 'video-streaming', name: 'Video Streaming', file: 'video-streaming.png' },
  { id: 'cloud-storage', name: 'Cloud Storage', file: 'cloud-storage.png' },
  { id: 'notification', name: 'Notification', file: 'notification.png' },
  { id: 'rate-limiter', name: 'Rate Limiter', file: 'rate-limiter.png' },
  { id: 'kubernetes', name: 'Kubernetes', file: 'kubernetes.png' },
  { id: 'service-mesh', name: 'Service Mesh', file: 'service-mesh.png' },
  { id: 'metrics-monitoring', name: 'Metrics & Monitoring', file: 'metrics-monitoring.png' },
  { id: 'ad-click', name: 'Ad Click Aggregation', file: 'ad-click.png' },
  { id: 'autocomplete', name: 'Autocomplete', file: 'autocomplete.png' },
  { id: 'proximity', name: 'Proximity Service', file: 'proximity.png' },
];

export function SampleDiagrams({ onFileSelect }: SampleDiagramsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelect = useCallback(async (sample: typeof SAMPLES[number]) => {
    setLoadingId(sample.id);
    try {
      const res = await fetch(`/samples/${sample.file}`);
      const blob = await res.blob();
      const file = new File([blob], sample.file, { type: 'image/png' });
      onFileSelect(file);
    } catch {
      console.error('Failed to load sample');
    } finally {
      setLoadingId(null);
    }
  }, [onFileSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
    >
      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <FolderOpen className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Diagramas de Exemplo
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Selecione um diagrama para testar a análise
          </p>
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {SAMPLES.map((sample, i) => {
            const isLoading = loadingId === sample.id;

            return (
              <motion.button
                key={sample.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                onClick={() => handleSelect(sample)}
                disabled={!!loadingId}
                className={clsx(
                  'group relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-150',
                  'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isLoading && 'bg-indigo-50 dark:bg-indigo-950/20',
                )}
              >
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                  <img
                    src={`/samples/${sample.file}`}
                    alt={sample.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center leading-tight">
                  {sample.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
