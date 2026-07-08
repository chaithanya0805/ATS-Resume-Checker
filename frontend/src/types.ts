export interface AnalysisResult {
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  sectionAnalysis: string;
  matchPercentage: number;
  skillsFound: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  grammarSuggestions: string[];
  resumeImprovementSuggestions: string[];
  optimizedProfessionalSummary: string;
  hiringRecommendation: string;
}

export interface HistoryItem {
  id: number;
  fileName: string;
  atsScore: number;
  matchedKeywords: string;
  missingKeywords: string;
  sectionAnalysis: string;
  createdAt: string;
  matchPercentage: number;
  skillsFound: string;
  missingSkills: string;
  strengths: string;
  weaknesses: string;
  grammarSuggestions: string;
  resumeImprovementSuggestions: string;
  optimizedProfessionalSummary: string;
  hiringRecommendation: string;
}
