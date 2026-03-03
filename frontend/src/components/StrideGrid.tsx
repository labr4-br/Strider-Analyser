import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { StrideAnalysis, Threat } from '../schemas/stride';
import { StrideCard } from './StrideCard';
import { RiskMatrix } from './RiskMatrix';

interface StrideGridProps {
  analysis: Partial<StrideAnalysis>;
}

export function StrideGrid({ analysis }: StrideGridProps) {
  const categories = analysis.categories ?? [];

  // Collect all complete threats for the risk matrix
  const allThreats: Threat[] = categories
    .flatMap((cat) => cat.threats ?? [])
    .filter((t): t is Threat =>
      typeof t.likelihood === 'number' && typeof t.impact === 'number'
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-indigo-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Modelo de Ameaças
        </h2>
      </div>

      {allThreats.length > 0 && <RiskMatrix threats={allThreats} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, i) => (
          <StrideCard key={cat.key ?? i} category={cat} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
