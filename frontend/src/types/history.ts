import { StrideAnalysis } from '../schemas/stride';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  imageName: string;
  imageBase64: string;
  imageMimeType: string;
  analysis: StrideAnalysis;
}
