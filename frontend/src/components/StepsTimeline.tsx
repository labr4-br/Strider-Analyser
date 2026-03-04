import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import { StepInfo } from '../hooks/useStrideGraph';

interface StepsTimelineProps {
  steps: StepInfo[];
}

export function StepsTimeline({ steps }: StepsTimelineProps) {
  if (steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <AnimatePresence initial={false}>
        {steps.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 text-xs"
          >
            {step.status === 'active' ? (
              <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
            ) : (
              <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
            )}
            <span
              className={
                step.status === 'active'
                  ? 'text-indigo-400 font-medium'
                  : 'text-gray-500 line-through'
              }
            >
              {step.label}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
