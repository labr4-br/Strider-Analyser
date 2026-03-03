import { X, Scan } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ImagePreviewProps {
  file: File | null;
  previewUrl: string;
  isAnalyzing: boolean;
  onRemove: () => void;
  onAnalyze?: () => void;
}

export function ImagePreview({
  file,
  previewUrl,
  isAnalyzing,
  onRemove,
  onAnalyze,
}: ImagePreviewProps) {
  const displayName = file ? file.name : 'Diagrama restaurado';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900"
    >
      <div className="relative">
        <img
          src={previewUrl}
          alt={displayName}
          className="w-full h-80 lg:h-[420px] object-contain bg-gray-50 dark:bg-gray-950"
        />
        <button
          onClick={onRemove}
          disabled={isAnalyzing}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
            {displayName}
          </p>
          {file && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
        {onAnalyze && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              'bg-indigo-600 hover:bg-indigo-700 text-white',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            <Scan className={clsx('w-4 h-4', isAnalyzing && 'animate-spin')} />
            {isAnalyzing ? 'Analisando...' : 'Analisar Ameaças'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
