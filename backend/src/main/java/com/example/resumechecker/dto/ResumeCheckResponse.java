package com.example.resumechecker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeCheckResponse {
    private int atsScore;
    private List<String> matchedKeywords;
    private List<String> missingKeywords;
    private String sectionAnalysis;
    private int matchPercentage;
    private List<String> skillsFound;
    private List<String> missingSkills;
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> grammarSuggestions;
    private List<String> resumeImprovementSuggestions;
    private String optimizedProfessionalSummary;
    private String hiringRecommendation;
}
