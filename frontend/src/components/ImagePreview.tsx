import { X, Scan, Brain, Check, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { StepInfo } from '../hooks/useStrideGraph';

interface ImagePreviewProps {
  file: File | null;
  previewUrl: string;
  isAnalyzing: boolean;
  onRemove: () => void;
  onAnalyze?: () => void;
  onDownload?: () => void;
  steps?: StepInfo[];
  phase?: string;
}

export function ImagePreview({
  file,
  previewUrl,
  isAnalyzing,
  onRemove,
  onAnalyze,
  onDownload,
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
      className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 h-full flex flex-col"
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .text-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.4) 0%,
            rgba(255,255,255,0.9) 40%,
            rgba(255,255,255,1) 50%,
            rgba(255,255,255,0.9) 60%,
            rgba(255,255,255,0.4) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 2.5s ease-in-out infinite;
        }
      `}</style>

      <div className="relative flex-1">
        <img
          src={previewUrl}
          alt={displayName}
          className="w-full h-full min-h-[320px] object-contain bg-gray-50 dark:bg-gray-950"
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
              <div className="w-full p-5 flex flex-col gap-1.5">
                <AnimatePresence initial={false}>
                  {isUnderstanding && steps.length === 0 && (
                    <motion.div
                      key="understanding"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-2.5"
                    >
                      <Brain className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-[13px] font-medium text-shimmer">
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
                        <Brain className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-white/30 shrink-0" />
                      )}
                      <span
                        className={clsx(
                          'text-[13px] font-medium',
                          step.status === 'active'
                            ? 'text-shimmer'
                            : 'text-white/30',
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
        {phase === 'chat_ready' && onDownload ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar Relatório PDF
          </motion.button>
        ) : onAnalyze ? (
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
        ) : null}
      </div>
    </motion.div>
  );
}
