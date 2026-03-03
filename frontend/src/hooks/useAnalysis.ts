import { useState, useCallback, useRef } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { strideAnalysisSchema, StrideAnalysis } from '../schemas/stride';
import { LLMSettings } from './useSettings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeepPartialAnalysis = any;

export function useAnalysis(settingsRef?: { current: LLMSettings }) {
  const [overrideState, setOverrideState] = useState<StrideAnalysis | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);

  const { object, error, isLoading, submit, stop } = useObject({
    api: '/api/analyze',
    schema: strideAnalysisSchema,
    onError(err) {
      console.error('[useAnalysis] stream error:', err);
    },
    onFinish({ object: obj, error: finishErr }) {
      if (finishErr) {
        console.error('[useAnalysis] finish error:', finishErr);
      } else {
        console.log('[useAnalysis] finished, threats:', obj?.totalThreats);
      }
    },
  });

  const status = overrideState ? 'done'
    : isLoading ? 'streaming'
    : error ? 'error'
    : object ? 'done'
    : 'idle';

  const analysis: DeepPartialAnalysis | null = overrideState ?? object ?? null;

  const analyze = useCallback(async (file: File) => {
    setOverrideState(null);
    const base64 = await fileToBase64(file);
    const mimeType = file.type;
    setImageData({ base64, mimeType });
    const llm = settingsRef?.current;
    submit({
      imageBase64: base64,
      mimeType,
      ...(llm && {
        llmSettings: {
          model: llm.model,
          maxTokens: llm.maxTokens,
          apiKey: llm.apiKey,
          temperature: llm.temperature,
        },
      }),
    });
  }, [submit, settingsRef]);

  const downloadReport = useCallback(async (chatMessages?: Array<{ role: string; text: string }>) => {
    const data = overrideState ?? object;
    if (!data) return;

    const body: Record<string, unknown> = {
      analysis: data,
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
  }, [object, overrideState, imageData]);

  const loadState = useCallback((savedAnalysis: StrideAnalysis, savedImageData?: { base64: string; mimeType: string }) => {
    setOverrideState(savedAnalysis);
    if (savedImageData) setImageData(savedImageData);
  }, []);

  const reset = useCallback(() => {
    setOverrideState(null);
    setImageData(null);
  }, []);

  return {
    status,
    analysis,
    error: error?.message,
    isLoading,
    analyze,
    downloadReport,
    loadState,
    reset,
    imageData,
    stop,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix, keep only base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
