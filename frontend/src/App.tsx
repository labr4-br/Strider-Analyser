import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RotateCcw, AlertCircle } from 'lucide-react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ImagePreview } from './components/ImagePreview';
import { StreamingOutput } from './components/StreamingOutput';
import { StrideGrid } from './components/StrideGrid';
import { ChatPanel } from './components/ChatPanel';
import { Sidebar } from './components/Sidebar';
import { useAnalysis } from './hooks/useAnalysis';
import { useHistory } from './hooks/useHistory';
import { useFollowUpChat } from './hooks/useFollowUpChat';
import { Theme } from './types/stride';
import { HistoryEntry } from './types/history';
import { StrideAnalysis } from './schemas/stride';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialSidebar(): boolean {
  return typeof window !== 'undefined' && window.innerWidth >= 768;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(getInitialSidebar);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const { status, analysis, error, isLoading, analyze, downloadReport, reset, loadState, imageData } = useAnalysis();
  const history = useHistory();

  // Only pass a complete StrideAnalysis to the chat context when done
  const chatAnalysis = status === 'done' ? (analysis as StrideAnalysis | null) : null;
  const chat = useFollowUpChat(chatAnalysis);

  const savedRef = useRef(false);

  const handleThemeChange = useCallback((t: Theme) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);

  useState(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  });

  const handleFileSelect = useCallback((file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setActiveHistoryId(null);
    savedRef.current = false;
    reset();
  }, [reset]);

  const handleRemove = useCallback(() => {
    setImageFile(null);
    if (previewUrl && !activeHistoryId) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setActiveHistoryId(null);
    savedRef.current = false;
    reset();
  }, [previewUrl, activeHistoryId, reset]);

  const handleAnalyze = useCallback(() => {
    if (imageFile) {
      savedRef.current = false;
      analyze(imageFile);
    }
  }, [imageFile, analyze]);

  // Auto-save to history when analysis completes
  useEffect(() => {
    if (status !== 'done' || !imageFile || savedRef.current || !analysis) return;
    savedRef.current = true;

    const completeAnalysis = analysis as StrideAnalysis;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [prefix, base64] = result.split(',');
      const mimeType = prefix.replace('data:', '').replace(';base64', '');

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        imageName: imageFile.name,
        imageBase64: base64 || '',
        imageMimeType: mimeType || imageFile.type || 'image/png',
        analysis: completeAnalysis,
      };

      history.save(entry);
      setActiveHistoryId(entry.id);
    };
    reader.readAsDataURL(imageFile);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFromHistory = useCallback((entry: HistoryEntry) => {
    if (previewUrl && !activeHistoryId) URL.revokeObjectURL(previewUrl);

    setImageFile(null);
    setPreviewUrl(`data:${entry.imageMimeType};base64,${entry.imageBase64}`);
    setActiveHistoryId(entry.id);
    savedRef.current = true;

    loadState(entry.analysis, { base64: entry.imageBase64, mimeType: entry.imageMimeType });

    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [previewUrl, activeHistoryId, loadState]);

  const handleDownload = useCallback(async () => {
    try {
      await downloadReport();
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [downloadReport]);

  const isAnalyzing = status === 'streaming';
  const isDone = status === 'done';
  const isError = status === 'error';
  const hasImage = !!previewUrl || !!imageFile;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 flex flex-col">
      <Header
        theme={theme}
        sidebarOpen={sidebarOpen}
        onThemeChange={handleThemeChange}
        onSidebarToggle={() => setSidebarOpen((o) => !o)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          entries={history.entries}
          activeId={activeHistoryId}
          onSelect={loadFromHistory}
          onDelete={history.remove}
          onClear={history.clear}
          onClose={() => setSidebarOpen(false)}
          onNew={handleRemove}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 py-8 space-y-6">
          {/* Upload zone — only when no image */}
          {!hasImage && <UploadZone onFileSelect={handleFileSelect} />}

          {/* Side-by-side: image left, analysis right */}
          {hasImage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left — image preview */}
              <ImagePreview
                file={imageFile}
                previewUrl={previewUrl}
                isAnalyzing={isAnalyzing}
                onRemove={handleRemove}
                onAnalyze={imageFile ? handleAnalyze : undefined}
              />

              {/* Right — streaming output */}
              <AnimatePresence mode="wait">
                {isError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </motion.div>
                ) : (isAnalyzing || isDone) && analysis ? (
                  <motion.div
                    key="stream"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2 h-full"
                  >
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Resultado da Análise
                    </p>
                    <StreamingOutput analysis={analysis} isStreaming={isAnalyzing} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}

          {/* Threat model grid — full width below */}
          {isDone && analysis && (analysis.categories?.length ?? 0) > 0 && (
            <StrideGrid analysis={analysis} />
          )}

          {/* Chat panel — only when done */}
          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ChatPanel {...chat} />
            </motion.div>
          )}

          {/* Action buttons */}
          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between pt-2"
            >
              <button
                onClick={handleRemove}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Nova Análise
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Baixar Relatório PDF
              </motion.button>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
