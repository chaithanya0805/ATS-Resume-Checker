package com.example.resumechecker.service;

import com.example.resumechecker.dto.ResumeCheckResponse;
import com.example.resumechecker.model.AnalysisResult;
import com.example.resumechecker.repository.AnalysisResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeAnalyzerService {

    private final AnalysisResultRepository repository;

    public ResumeCheckResponse analyzeResume(MultipartFile file, String jobDescription) {
        try {
            // 1. Extract text from PDF
            Tika tika = new Tika();
            String resumeText;
            try (InputStream stream = file.getInputStream()) {
                resumeText = tika.parseToString(stream);
            }

            // 2. Extract keywords (Simple implementation using stop words and basic tokenization)
            List<String> jdKeywords = extractKeywords(jobDescription);
            Set<String> resumeTokens = extractKeywords(resumeText).stream()
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());

            // 3. Match keywords
            List<String> matchedKeywords = new ArrayList<>();
            List<String> missingKeywords = new ArrayList<>();

            for (String jdWord : jdKeywords) {
                if (resumeTokens.contains(jdWord.toLowerCase())) {
                    matchedKeywords.add(jdWord);
                } else {
                    missingKeywords.add(jdWord);
                }
            }

            // 4. Calculate Score
            int score = 0;
            if (!jdKeywords.isEmpty()) {
                score = (int) (((double) matchedKeywords.size() / jdKeywords.size()) * 100);
            }

            // 5. Basic Section Analysis
            String analysis = generateSectionAnalysis(resumeText);

            // 6. Save to DB
            AnalysisResult result = AnalysisResult.builder()
                    .fileName(file.getOriginalFilename())
                    .atsScore(score)
                    .matchedKeywords(String.join(", ", matchedKeywords))
                    .missingKeywords(String.join(", ", missingKeywords))
                    .sectionAnalysis(analysis)
                    .build();
            repository.save(result);

            return ResumeCheckResponse.builder()
                    .atsScore(score)
                    .matchedKeywords(matchedKeywords)
                    .missingKeywords(missingKeywords)
                    .sectionAnalysis(analysis)
                    .build();

        } catch (Exception e) {
            log.error("Error analyzing resume", e);
            throw new RuntimeException("Failed to analyze resume: " + e.getMessage());
        }
    }

    private List<String> extractKeywords(String text) {
        // Simple tokenization and filtering out common stop words
        if (text == null || text.trim().isEmpty()) return new ArrayList<>();
        
        Set<String> stopWords = Set.of("the", "and", "a", "to", "of", "in", "i", "is", "that", "it", "on", "you", "this", "for", "but", "with", "are", "have", "be", "at", "or", "as", "was", "so", "if", "out", "not", "we", "my", "your", "can");
        
        // Remove punctuation and split
        String[] words = text.replaceAll("[^a-zA-Z0-9 ]", " ").toLowerCase().split("\\s+");
        
        return Arrays.stream(words)
                .filter(w -> w.length() > 2)
                .filter(w -> !stopWords.contains(w))
                .distinct()
                .collect(Collectors.toList());
    }

    private String generateSectionAnalysis(String resumeText) {
        String lowerText = resumeText.toLowerCase();
        boolean hasEducation = lowerText.contains("education") || lowerText.contains("university") || lowerText.contains("college");
        boolean hasExperience = lowerText.contains("experience") || lowerText.contains("work history") || lowerText.contains("employment");
        boolean hasSkills = lowerText.contains("skills") || lowerText.contains("technologies");

        StringBuilder analysis = new StringBuilder();
        if (hasEducation) analysis.append("Education section found. ");
        else analysis.append("Education section missing or unclear. ");

        if (hasExperience) analysis.append("Experience section found. ");
        else analysis.append("Experience section missing or unclear. ");

        if (hasSkills) analysis.append("Skills section found.");
        else analysis.append("Skills section missing or unclear.");

        return analysis.toString();
    }
}
