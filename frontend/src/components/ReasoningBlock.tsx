import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown } from 'lucide-react';

interface ReasoningBlockProps {
  text: string;
  isStreaming: boolean;
}

export function ReasoningBlock({ text, isStreaming }: ReasoningBlockProps) {
  const [open, setOpen] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isStreaming) return;
    startRef.current = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isStreaming]);

  // Auto-scroll while streaming
  useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [text, open]);

  // Auto-collapse when streaming ends
  useEffect(() => {
    if (!isStreaming && text) {
      const timeout = setTimeout(() => setOpen(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isStreaming, text]);

  if (!text) return null;

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-amber-950/30 transition-colors"
      >
        <Brain className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-xs font-medium text-amber-400">
          {isStreaming ? 'Raciocinando' : 'Raciocínio'}
        </span>
        {isStreaming && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {elapsed}s
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 text-amber-400/60 ml-auto transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              ref={contentRef}
              className="px-3 pb-3 max-h-48 overflow-y-auto scrollbar-thin text-xs text-amber-200/70 leading-relaxed whitespace-pre-wrap font-mono"
            >
              {text}
              {isStreaming && (
                <span className="inline-block w-1.5 h-3 bg-amber-400 animate-pulse rounded-sm ml-0.5" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
