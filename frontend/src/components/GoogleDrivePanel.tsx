import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { HardDrive, FolderOpen, Image, ChevronRight, Loader2, Link2, X } from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl?: string;
  modifiedTime: string;
  size?: string;
}

interface GoogleDrivePanelProps {
  onFileSelect: (file: File) => void;
}

const MOCK_FILES: DriveFile[] = [];

export function GoogleDrivePanel({ onFileSelect }: GoogleDrivePanelProps) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [files] = useState<DriveFile[]>(MOCK_FILES);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConnect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setConnected(true);
      setBrowsing(true);
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setBrowsing(false);
    setSelectedId(null);
  };

  const handleSelect = (file: DriveFile) => {
    setSelectedId(file.id);
  };

  const handleImport = () => {
    const file = files.find(f => f.id === selectedId);
    if (!file) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setBrowsing(false);
      const mockFile = new File(
        [new Uint8Array(1024)],
        file.name,
        { type: file.mimeType },
      );
      onFileSelect(mockFile);
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <HardDrive className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Arquivos Carregados
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              Importe diagramas do Google Drive
            </p>
          </div>
        </div>

        {connected && (
          <button
            onClick={handleDisconnect}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {!connected ? (
            <motion.div
              key="connect"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                <Link2 className="w-4.5 h-4.5 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center max-w-[200px]">
                Conecte ao Google Drive para importar diagramas diretamente
              </p>
              <button
                onClick={handleConnect}
                disabled={loading}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors',
                  'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
                  'hover:bg-gray-800 dark:hover:bg-gray-200',
                  'disabled:opacity-60',
                )}
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <HardDrive className="w-3.5 h-3.5" />
                )}
                {loading ? 'Conectando...' : 'Conectar Google Drive'}
              </button>
            </motion.div>
          ) : browsing ? (
            <motion.div
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                <FolderOpen className="w-3 h-3" />
                <span>Meu Drive</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-600 dark:text-gray-300">Diagramas</span>
              </div>

              <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 max-h-[200px] overflow-y-auto">
                {files.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <Image className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      Nenhuma imagem encontrada
                    </p>
                  </div>
                ) : (
                  files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => handleSelect(file)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                        selectedId === file.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/40',
                      )}
                    >
                      {file.thumbnailUrl ? (
                        <img
                          src={file.thumbnailUrl}
                          alt=""
                          className="w-8 h-8 rounded object-cover bg-gray-100 dark:bg-gray-800"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Image className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          {file.size ?? '—'}
                        </p>
                      </div>
                      {selectedId === file.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {files.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={handleImport}
                    disabled={!selectedId || loading}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors',
                      'bg-indigo-600 hover:bg-indigo-700 text-white',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                    )}
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Image className="w-3.5 h-3.5" />
                    )}
                    Importar
                  </button>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
