export interface AnalysisResult {
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  sectionAnalysis: string;
}

export interface HistoryItem {
  id: number;
  fileName: string;
  atsScore: number;
  matchedKeywords: string;
  missingKeywords: string;
  sectionAnalysis: string;
  createdAt: string;
}
