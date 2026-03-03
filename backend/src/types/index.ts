import { StrideAnalysis } from '../schemas/stride';

export interface ReportRequest {
  analysis: StrideAnalysis;
  imageBase64?: string;
}

export interface SSEChunk {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  fullText?: string;
  message?: string;
}
