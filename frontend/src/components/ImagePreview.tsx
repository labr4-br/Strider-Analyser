import { X, Scan, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { StepInfo } from '../hooks/useStrideGraph';

interface ImagePreviewProps {
  file: File | null;
  previewUrl: string;
  isAnalyzing: boolean;
  onRemove: () => void;
  onAnalyze?: () => void;
  steps?: StepInfo[];
  phase?: string;
}

export function ImagePreview({
  file,
  previewUrl,
  isAnalyzing,
  onRemove,
  onAnalyze,
  steps = [],
  phase,
}: ImagePreviewProps) {
  const displayName = file ? file.name : 'Diagrama restaurado';
  const isUnderstanding = phase === 'understanding';
  const showOverlay = isUnderstanding || steps.length > 0;

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

        {/* Progress overlay */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-[6px] flex items-end"
            >
              <div className="w-full p-5 flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {isUnderstanding && steps.length === 0 && (
                    <motion.div
                      key="understanding"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-2.5"
                    >
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                      <span className="text-sm font-medium text-white">
                        Entendendo a arquitetura...
                      </span>
                    </motion.div>
                  )}
                  {steps.map((step) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-2.5"
                    >
                      {step.status === 'active' ? (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                      ) : (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span
                        className={clsx(
                          'text-sm font-medium',
                          step.status === 'active'
                            ? 'text-white'
                            : 'text-white/60',
                        )}
                      >
                        {step.label}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onRemove}
          disabled={isAnalyzing}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors disabled:opacity-50 z-10"
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
