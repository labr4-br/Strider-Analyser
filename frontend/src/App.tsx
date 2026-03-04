import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { SampleDiagrams } from './components/SampleDiagrams';
import { ImagePreview } from './components/ImagePreview';
import { StreamingOutput } from './components/StreamingOutput';
import { StrideGrid } from './components/StrideGrid';
import { ActionPlanSection } from './components/ActionPlanSection';
import { ChatPanel } from './components/ChatPanel';
import { ValidationPanel } from './components/ValidationPanel';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { useStrideGraph } from './hooks/useStrideGraph';
import { useHistory } from './hooks/useHistory';
import { useSettings } from './hooks/useSettings';
import { SectionDivider } from './components/SectionDivider';
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { settings, setSettings, isConfigured } = useSettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const graph = useStrideGraph(settingsRef);
  const history = useHistory();

  const savedRef = useRef(false);
  const strideGridRef = useRef<HTMLDivElement>(null);

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
    graph.reset();
  }, [graph.reset]);

  const handleFileSelectAndAnalyze = useCallback((file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setActiveHistoryId(null);
    savedRef.current = false;
    setSidebarOpen(false);
    graph.startAnalysis(file);
  }, [graph.startAnalysis]);

  const handleRemove = useCallback(() => {
    setImageFile(null);
    if (previewUrl && !activeHistoryId) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setActiveHistoryId(null);
    savedRef.current = false;
    graph.reset();
  }, [previewUrl, activeHistoryId, graph.reset]);

  const handleAnalyze = useCallback(() => {
    if (imageFile) {
      savedRef.current = false;
      setSidebarOpen(false);
      graph.startAnalysis(imageFile);
    }
  }, [imageFile, graph.startAnalysis]);

  useEffect(() => {
    if (graph.phase !== 'chat_ready' || !imageFile || savedRef.current || !graph.analysis) return;
    savedRef.current = true;

    const completeAnalysis = graph.analysis as StrideAnalysis;

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
        threadId: graph.threadId || undefined,
      };

      history.save(entry);
      setActiveHistoryId(entry.id);
    };
    reader.readAsDataURL(imageFile);
  }, [graph.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (graph.phase === 'chat_ready' && graph.analysis?.categories?.length) {
      setTimeout(() => {
        strideGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [graph.phase, graph.analysis]);

  const loadFromHistory = useCallback((entry: HistoryEntry) => {
    if (previewUrl && !activeHistoryId) URL.revokeObjectURL(previewUrl);

    setImageFile(null);
    setPreviewUrl(`data:${entry.imageMimeType};base64,${entry.imageBase64}`);
    setActiveHistoryId(entry.id);
    savedRef.current = true;

    graph.loadState(entry.analysis, { base64: entry.imageBase64, mimeType: entry.imageMimeType });

    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [previewUrl, activeHistoryId, graph.loadState]);

  const handleDownload = useCallback(async () => {
    try {
      const chatMessages = graph.messages
        ?.filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role,
          text: m.parts
            ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join(' ') || '',
        }))
        .filter((m) => m.text.length > 0);

      await graph.downloadReport(chatMessages);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [graph.downloadReport, graph.messages]);

  const isAnalyzing = graph.phase === 'understanding' || graph.phase === 'analyzing' || graph.phase === 'prioritizing';
  const isDone = graph.phase === 'chat_ready';
  const isValidating = graph.phase === 'validating';
  const hasImage = !!previewUrl || !!imageFile;
  const hasError = !!graph.error;

  const chatStatus = graph.isLoading ? 'streaming' : isDone ? 'ready' : 'idle';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 flex flex-col">
      <Header
        theme={theme}
        sidebarOpen={sidebarOpen}
        isConfigured={isConfigured}
        onThemeChange={handleThemeChange}
        onSidebarToggle={() => setSidebarOpen((o) => !o)}
        onSettingsOpen={() => setSettingsOpen(true)}
      />
      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onSave={setSettings}
        onClose={() => setSettingsOpen(false)}
      />

      <div className="flex-1 relative">
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

        <main className={`min-h-[calc(100vh-2.5rem)] px-4 py-8 space-y-6 transition-[margin] duration-300 ${sidebarOpen ? 'md:ml-72' : ''}`}>
          {!hasImage && graph.phase === 'idle' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <UploadZone onFileSelect={handleFileSelect} />
              <SampleDiagrams onFileSelect={handleFileSelectAndAnalyze} />
            </div>
          )}

          {hasImage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <ImagePreview
                file={imageFile}
                previewUrl={previewUrl}
                isAnalyzing={isAnalyzing}
                onRemove={handleRemove}
                onAnalyze={imageFile ? handleAnalyze : undefined}
                onDownload={isDone ? handleDownload : undefined}
                steps={graph.steps}
                phase={graph.phase}
              />

              <AnimatePresence mode="wait">
                {hasError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{graph.error}</p>
                  </motion.div>
                ) : isValidating ? (
                  <motion.div
                    key="validation"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <ValidationPanel
                      architectureDescription={graph.architectureDescription}
                      onConfirm={() => graph.resumeValidation('approve')}
                      onCorrect={(feedback) => graph.resumeValidation('correct', feedback)}
                    />
                  </motion.div>
                ) : (isAnalyzing || isDone) ? (
                  <motion.div
                    key="stream"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <StreamingOutput
                      analysis={graph.analysis || { architectureDescription: graph.architectureDescription }}
                      isStreaming={isAnalyzing}
                      reasoningText={graph.reasoningText}
                    />
                  </motion.div>
                ) : graph.phase === 'understanding' ? (
                  <motion.div
                    key="understanding"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <StreamingOutput analysis={{ architectureDescription: graph.architectureDescription }} isStreaming={true} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}

          {isDone && graph.analysis && (graph.analysis.categories?.length ?? 0) > 0 && (
            <div ref={strideGridRef}>
              <StrideGrid analysis={graph.analysis} />
            </div>
          )}

          {isDone && graph.actionPlan && (
            <>
              <SectionDivider />
              <ActionPlanSection actionPlan={graph.actionPlan} />
            </>
          )}

          {isDone && (
            <>
              <SectionDivider />
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums shrink-0">
                    4
                  </span>
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    FAQ — Pergunte ao Especialista
                  </h2>
                </div>
                <ChatPanel
                  messages={graph.messages}
                  sendMessage={graph.sendMessage}
                  status={chatStatus}
                  suggestedQuestions={graph.suggestedQuestions}
                />
              </motion.div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
