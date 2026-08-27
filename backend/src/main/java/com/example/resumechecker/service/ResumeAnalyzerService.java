package com.example.resumechecker.service;

import com.example.resumechecker.dto.ResumeCheckResponse;
import com.example.resumechecker.model.AnalysisResult;
import com.example.resumechecker.repository.AnalysisResultRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeAnalyzerService {

private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private final AnalysisResultRepository repository;
    private final ObjectMapper objectMapper;
    private final GeminiApiKeyManager apiKeyManager;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    public ResumeCheckResponse analyzeResume(MultipartFile file, String jobDescription) {
        try {
            // 1. Extract text from PDF/DOCX
            Tika tika = new Tika();
            String resumeText;
            try (InputStream stream = file.getInputStream()) {
                resumeText = tika.parseToString(stream);
            }

            if (resumeText == null || resumeText.trim().isEmpty()) {
                throw new RuntimeException("Could not extract any text from the uploaded file.");
            }

            // 2. Validate API key configuration
            if (apiKeyManager.getKeyCount() == 0) {
                throw new RuntimeException("Gemini API key is not configured. Please configure GEMINI_API_KEY_1 or ATS_GEMINI_API_KEY as an environment variable.");
            }

         // 3. Construct prompt
String promptText = String.format("""
Analyze the following resume against the given job description.

Return ONLY valid JSON.

IMPORTANT:
The ATS Score and Match Percentage MUST always be the same value.
Calculate one final ATS score between 0 and 100 based on keyword matching, skills, experience, education, projects, and overall relevance.
Use this same number for both:
- atsScore
- matchPercentage

Do not return different values.
Resume:
%s

Job Description:
%s

JSON Format:
{
  "atsScore": 0,
  "matchPercentage": 0,
  "matchedKeywords": [],
  "missingKeywords": [],
  "skillsFound": [],
  "missingSkills": [],
  "strengths": [],
  "weaknesses": [],
  "grammarSuggestions": [],
  "resumeImprovementSuggestions": [],
  "optimizedProfessionalSummary": "",
  "hiringRecommendation": ""
}
""", resumeText, jobDescription);

            // 4. Create request payload map
            Map<String, Object> contentsPart = Map.of("text", promptText);
            Map<String, Object> contentsItem = Map.of("parts", List.of(contentsPart));
            List<Object> contents = List.of(contentsItem);

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("responseMimeType", "application/json");

            Map<String, Object> responseSchema = new HashMap<>();
            responseSchema.put("type", "OBJECT");

            Map<String, Object> properties = new HashMap<>();
            properties.put("atsScore", Map.of("type", "INTEGER"));
            properties.put("matchPercentage", Map.of("type", "INTEGER"));
            properties.put("matchedKeywords", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));
            properties.put("missingKeywords", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));
            properties.put("skillsFound", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));
            properties.put("missingSkills", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));
            properties.put("strengths", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));
            properties.put("weaknesses", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));
            properties.put("grammarSuggestions", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));
            properties.put("resumeImprovementSuggestions", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));
            properties.put("optimizedProfessionalSummary", Map.of("type", "STRING"));
            properties.put("hiringRecommendation", Map.of("type", "STRING"));

            responseSchema.put("properties", properties);
            responseSchema.put("required", List.of(
                    "atsScore", "matchPercentage", "matchedKeywords", "missingKeywords",
                    "skillsFound", "missingSkills", "strengths", "weaknesses",
                    "grammarSuggestions", "resumeImprovementSuggestions",
                    "optimizedProfessionalSummary", "hiringRecommendation"
            ));

            generationConfig.put("responseSchema", responseSchema);

            Map<String, Object> payload = Map.of(
                    "contents", contents,
                    "generationConfig", generationConfig
            );

            String jsonPayload = objectMapper.writeValueAsString(payload);

            // 5. Send request to Gemini API with request-level fallback/rotation
            List<String> keys = apiKeyManager.getAvailableKeys();
            HttpResponse<String> response = null;
            boolean success = false;
            int keyIndex = 0;

            while (keyIndex < keys.size()) {
                String currentKey = keys.get(keyIndex);
                log.info("Attempting Gemini API request with Key {} of {}.", (keyIndex + 1), keys.size());

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(GEMINI_API_URL + "?key=" + currentKey))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(120))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .build();

                try {
                    response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                    System.out.println("Gemini Status: " + response.statusCode());

                    if (response.statusCode() == 200) {
                        success = true;
                        break; // Success!
                    }

                    // Check if error is temporary (quota, rate-limit, service unavailable)
                    if (isQuotaOrRateLimitError(response.statusCode(), response.body())) {
                        log.warn("Gemini API Key {} failed with status {} (Quota/Rate Limit/Temporary). Switching to next key.", 
                                 (keyIndex + 1), response.statusCode());
                        keyIndex++;
                    } else {
                        // Client error or invalid configuration - do not retry
                        log.error("Gemini API request failed with client/server error.");
                        log.error("Status: {}", response.statusCode());
                        log.error("Body: {}", response.body());
                        throw new RuntimeException("Gemini API Error\nStatus: " + response.statusCode() + "\nResponse: " + response.body());
                    }
                } catch (java.io.IOException | InterruptedException e) {
                    log.warn("Network error occurred using Gemini API Key {}: {}. Switching to next key.", 
                             (keyIndex + 1), e.getMessage());
                    keyIndex++;
                }
            }

            if (!success) {
                log.error("All configured Gemini API keys have failed or exhausted their quota.");
                throw new RuntimeException("AI service is currently busy. Please try again later.");
            }

            // 6. Parse Gemini response
            JsonNode rootNode = objectMapper.readTree(response.body());
            JsonNode candidates = rootNode.path("candidates");
            if (candidates.isMissingNode() || !candidates.isArray() || candidates.isEmpty()) {
                throw new RuntimeException("Invalid response structure from Gemini API: no candidates found.");
            }

            JsonNode firstCandidate = candidates.get(0);
            JsonNode parts = firstCandidate.path("content").path("parts");
            if (parts.isMissingNode() || !parts.isArray() || parts.isEmpty()) {
                throw new RuntimeException("Invalid response structure from Gemini API: no content parts found.");
            }

            String geminiJsonText = parts.get(0).path("text").asText();
            GeminiResponseStructure geminiResult = objectMapper.readValue(geminiJsonText, GeminiResponseStructure.class);

            // 7. Format Section Analysis Markdown
            String sectionAnalysis = formatSectionAnalysis(geminiResult);

            // 8. Save to database
            AnalysisResult result = AnalysisResult.builder()
                    .fileName(file.getOriginalFilename())
                    .atsScore(geminiResult.getMatchPercentage())
                    .build();
            try {
                repository.save(result);
            } catch (Exception e) {
                log.error("Failed to save analysis result to database", e);
            }

            // 9. Map and return response DTO
           return ResumeCheckResponse.builder()
    .atsScore(geminiResult.getMatchPercentage())

                    .matchedKeywords(geminiResult.getMatchedKeywords())
                    .missingKeywords(geminiResult.getMissingKeywords())
                    .sectionAnalysis(sectionAnalysis)
                    .matchPercentage(geminiResult.getMatchPercentage())
                    .skillsFound(geminiResult.getSkillsFound())
                    .missingSkills(geminiResult.getMissingSkills())
                    .strengths(geminiResult.getStrengths())
                    .weaknesses(geminiResult.getWeaknesses())
                    .grammarSuggestions(geminiResult.getGrammarSuggestions())
                    .resumeImprovementSuggestions(geminiResult.getResumeImprovementSuggestions())
                    .optimizedProfessionalSummary(geminiResult.getOptimizedProfessionalSummary())
                    .hiringRecommendation(geminiResult.getHiringRecommendation())
                    .build();

        } catch (Exception e) {
            log.error("Error analyzing resume", e);
            throw new RuntimeException("Failed to analyze resume: " + e.getMessage(), e);
        }
    }

    private String formatSectionAnalysis(GeminiResponseStructure geminiResult) {
        StringBuilder sb = new StringBuilder();
        
        sb.append("### Match Overview\n");
        sb.append("- **Match Percentage:** ").append(geminiResult.getMatchPercentage()).append("%\n");
        sb.append("- **Hiring Recommendation:** ").append(geminiResult.getHiringRecommendation()).append("\n\n");

        sb.append("### Skills\n");
        sb.append("- **Skills Found:** ").append(geminiResult.getSkillsFound().isEmpty() ? "None detected" : String.join(", ", geminiResult.getSkillsFound())).append("\n");
        sb.append("- **Missing Skills:** ").append(geminiResult.getMissingSkills().isEmpty() ? "None missing" : String.join(", ", geminiResult.getMissingSkills())).append("\n\n");

        sb.append("### Strengths & Weaknesses\n");
        sb.append("- **Strengths:**\n");
        for (String strength : geminiResult.getStrengths()) {
            sb.append("  * ").append(strength).append("\n");
        }
        if (geminiResult.getStrengths().isEmpty()) {
            sb.append("  * None noted\n");
        }
        sb.append("- **Weaknesses:**\n");
        for (String weakness : geminiResult.getWeaknesses()) {
            sb.append("  * ").append(weakness).append("\n");
        }
        if (geminiResult.getWeaknesses().isEmpty()) {
            sb.append("  * None noted\n");
        }
        sb.append("\n");

        sb.append("### Suggestions & Improvements\n");
        sb.append("- **Grammar & Phrasing Suggestions:**\n");
        for (String sugg : geminiResult.getGrammarSuggestions()) {
            sb.append("  * ").append(sugg).append("\n");
        }
        if (geminiResult.getGrammarSuggestions().isEmpty()) {
            sb.append("  * No issues found\n");
        }
        sb.append("- **Resume Improvement Suggestions:**\n");
        for (String sugg : geminiResult.getResumeImprovementSuggestions()) {
            sb.append("  * ").append(sugg).append("\n");
        }
        if (geminiResult.getResumeImprovementSuggestions().isEmpty()) {
            sb.append("  * No improvements suggested\n");
        }
        sb.append("\n");

        sb.append("### Optimized Professional Summary\n");
        sb.append(geminiResult.getOptimizedProfessionalSummary());

        return sb.toString();
    }

    private boolean isQuotaOrRateLimitError(int statusCode, String responseBody) {
        if (statusCode == 429 || statusCode == 503) {
            return true;
        }
        if (responseBody != null) {
            String lowerBody = responseBody.toLowerCase();
            return lowerBody.contains("resource_exhausted") 
                || lowerBody.contains("unavailable")
                || lowerBody.contains("quota exceeded")
                || lowerBody.contains("rate limit exceeded");
        }
        return false;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class GeminiResponseStructure {
        private int atsScore;
        private int matchPercentage;
        private List<String> matchedKeywords;
        private List<String> missingKeywords;
        private List<String> skillsFound;
        private List<String> missingSkills;
        private List<String> strengths;
        private List<String> weaknesses;
        private List<String> grammarSuggestions;
        private List<String> resumeImprovementSuggestions;
        private String optimizedProfessionalSummary;
        private String hiringRecommendation;
    }
}
