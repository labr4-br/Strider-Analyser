import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil, Eye } from 'lucide-react';

interface ValidationPanelProps {
  architectureDescription: string;
  onConfirm: () => void;
  onCorrect: (feedback: string) => void;
}

export function ValidationPanel({ architectureDescription, onConfirm, onCorrect }: ValidationPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(architectureDescription);

  const handleCorrect = () => {
    if (isEditing && editedText.trim()) {
      onCorrect(editedText);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Entendimento da Arquitetura
          </span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">Passo 1/3</span>
      </div>

      <div className="px-5 py-4 space-y-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Revise o entendimento gerado pela IA sobre sua arquitetura. Confirme se está correto ou corrija antes de prosseguir com a análise STRIDE.
        </p>

        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            autoFocus
          />
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {architectureDescription}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Check className="w-4 h-4" />
            Confirmar e continuar análise
          </button>
          <button
            onClick={handleCorrect}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            {isEditing ? 'Enviar correção' : 'Corrigir descrição'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
