import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { StrideAnalysis } from '../schemas/stride';

export interface LLMSettings {
  model: string;
  maxTokens: number;
  apiKey: string;
  temperature: number;
}

export const StrideStateAnnotation = Annotation.Root({
  imageBase64: Annotation<string>(),
  llmSettings: Annotation<LLMSettings>(),
  architectureDescription: Annotation<string>(),
  architectureComponents: Annotation<string[]>(),
  validationStatus: Annotation<'pending' | 'approved' | 'corrected'>(),
  userFeedback: Annotation<string | undefined>(),
  strideAnalysis: Annotation<StrideAnalysis | null>(),
  analysisStatus: Annotation<'pending' | 'streaming' | 'done'>(),
  suggestedQuestions: Annotation<string[]>(),
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  threadId: Annotation<string>(),
  createdAt: Annotation<string>(),
  phase: Annotation<'understanding' | 'validating' | 'analyzing' | 'chat_ready'>(),
});

export type StrideState = typeof StrideStateAnnotation.State;
