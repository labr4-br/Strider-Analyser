import { useState, useCallback, useRef } from 'react';
import { LLMSettings } from './useSettings';
import { StrideAnalysis } from '../schemas/stride';

type Phase = 'idle' | 'understanding' | 'validating' | 'analyzing' | 'chat_ready';

export interface StepInfo {
  id: string;
  label: string;
  status: 'active' | 'done';
}

interface ChatMessage {
  id: string;
  role: string;
  parts: Array<{ type: string; text?: string }>;
}

interface GraphEvent {
  type: string;
  phase?: string;
  text?: string;
  architectureDescription?: string;
  partial?: StrideAnalysis;
  questions?: string[];
  threadId?: string;
  message?: string;
  step?: string;
  label?: string;
}

export function useStrideGraph(settingsRef?: { current: LLMSettings }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [architectureDescription, setArchitectureDescription] = useState('');
  const [strideAnalysis, setStrideAnalysis] = useState<StrideAnalysis | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [steps, setSteps] = useState<StepInfo[]>([]);
  const [reasoningText, setReasoningText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const parseSSEStream = useCallback(async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event: GraphEvent = JSON.parse(line.slice(6));

          switch (event.type) {
            case 'phase':
              if (event.phase) setPhase(event.phase as Phase);
              break;
            case 'arch_delta':
              if (event.text) setArchitectureDescription(event.text);
              break;
            case 'interrupt':
              setPhase('validating');
              if (event.architectureDescription) {
                setArchitectureDescription(event.architectureDescription);
              }
              break;
            case 'analysis_delta':
              if (event.partial) setStrideAnalysis(event.partial);
              break;
            case 'step':
              if (event.step && event.label) {
                setSteps(prev => {
                  const updated = prev.map(s =>
                    s.status === 'active' ? { ...s, status: 'done' as const } : s,
                  );
                  if (event.step === 'done') return updated;
                  return [...updated, { id: event.step!, label: event.label!, status: 'active' as const }];
                });
              }
              break;
            case 'analysis_partial':
              if (event.partial) setStrideAnalysis(event.partial as StrideAnalysis);
              break;
            case 'reasoning_delta':
              if (event.text) setReasoningText(prev => prev + event.text);
              break;
            case 'questions':
              if (event.questions) setSuggestedQuestions(event.questions);
              break;
            case 'text_delta':
              if (event.text) {
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === 'assistant') {
                    const existingText = last.parts
                      .filter(p => p.type === 'text')
                      .map(p => p.text)
                      .join('');
                    return [
                      ...prev.slice(0, -1),
                      { ...last, parts: [{ type: 'text', text: existingText + event.text }] },
                    ];
                  }
                  return [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      role: 'assistant',
                      parts: [{ type: 'text', text: event.text }],
                    },
                  ];
                });
              }
              break;
            case 'done':
              if (event.threadId) setThreadId(event.threadId);
              break;
            case 'error':
              setError(event.message || 'Unknown error');
              break;
          }
        } catch {
        }
      }
    }
  }, []);

  const startAnalysis = useCallback(async (file: File) => {
    setError(null);
    setPhase('understanding');
    setArchitectureDescription('');
    setStrideAnalysis(null);
    setSuggestedQuestions([]);
    setMessages([]);
    setThreadId(null);
    setSteps([]);
    setReasoningText('');

    const base64 = await fileToBase64(file);
    const mimeType = file.type;
    setImageData({ base64, mimeType });

    const llm = settingsRef?.current;
    if (!llm?.apiKey) {
      setError('API key is required');
      setPhase('idle');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/graph/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          llmSettings: {
            model: llm.model,
            maxTokens: llm.maxTokens,
            apiKey: llm.apiKey,
            temperature: llm.temperature,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        setError(err.error || 'Request failed');
        setPhase('idle');
        return;
      }

      await parseSSEStream(response);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        setPhase('idle');
      }
    }
  }, [settingsRef, parseSSEStream]);

  const resumeValidation = useCallback(async (action: 'approve' | 'correct', feedback?: string) => {
    if (!threadId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/graph/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          action: 'resume',
          ...(action === 'correct' && feedback ? { feedback } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Resume failed' }));
        setError(err.error || 'Resume failed');
        return;
      }

      await parseSSEStream(response);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    }
  }, [threadId, parseSSEStream]);

  const sendMessage = useCallback(async (msg: { text: string }) => {
    if (!threadId || !msg.text.trim()) return;

    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        parts: [{ type: 'text', text: msg.text }],
      },
    ]);
    setError(null);
    setChatLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/graph/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          action: 'message',
          message: msg.text,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Message failed' }));
        setError(err.error || 'Message failed');
        return;
      }

      await parseSSEStream(response);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setChatLoading(false);
    }
  }, [threadId, parseSSEStream]);

  const downloadReport = useCallback(async (chatMessages?: Array<{ role: string; text: string }>) => {
    if (!strideAnalysis) return;

    const body: Record<string, unknown> = {
      analysis: strideAnalysis,
      imageBase64: imageData?.base64 || '',
    };
    if (chatMessages && chatMessages.length > 0) {
      body.chatMessages = chatMessages;
    }

    const response = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error('PDF generation failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stride-threat-report.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }, [strideAnalysis, imageData]);

  const loadState = useCallback((savedAnalysis: StrideAnalysis, savedImageData?: { base64: string; mimeType: string }) => {
    setStrideAnalysis(savedAnalysis);
    setArchitectureDescription(savedAnalysis.architectureDescription || '');
    setPhase('chat_ready');
    setSuggestedQuestions([]);
    setMessages([]);
    if (savedImageData) setImageData(savedImageData);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPhase('idle');
    setArchitectureDescription('');
    setStrideAnalysis(null);
    setSuggestedQuestions([]);
    setMessages([]);
    setThreadId(null);
    setError(null);
    setImageData(null);
    setSteps([]);
    setReasoningText('');
  }, []);

  const status = phase === 'idle' ? 'idle'
    : phase === 'understanding' || phase === 'analyzing' ? 'streaming'
    : phase === 'chat_ready' ? 'done'
    : phase;

  return {
    phase,
    status,
    architectureDescription,
    strideAnalysis,
    analysis: strideAnalysis,
    suggestedQuestions,
    messages,
    threadId,
    error,
    imageData,
    steps,
    reasoningText,
    isLoading: phase === 'understanding' || phase === 'analyzing' || chatLoading,
    startAnalysis,
    resumeValidation,
    sendMessage,
    downloadReport,
    loadState,
    reset,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
