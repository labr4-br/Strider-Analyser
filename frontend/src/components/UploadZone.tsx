import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <motion.label
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={clsx(
        'flex flex-col items-center justify-center gap-4',
        'border-2 border-dashed rounded-2xl p-12 cursor-pointer',
        'transition-all duration-200',
        isDragging
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
          : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      )}
    >
      <div
        className={clsx(
          'p-4 rounded-full transition-colors',
          isDragging
            ? 'bg-indigo-100 dark:bg-indigo-900/40'
            : 'bg-gray-100 dark:bg-gray-800'
        )}
      >
        <Upload
          className={clsx(
            'w-8 h-8 transition-colors',
            isDragging ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
          )}
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Arraste e solte seu diagrama de arquitetura
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          ou clique para enviar (PNG, JPG, SVG, WebP)
        </p>
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className="hidden"
      />
    </motion.label>
  );
}
