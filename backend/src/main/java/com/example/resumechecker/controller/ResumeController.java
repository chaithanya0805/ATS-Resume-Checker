package com.example.resumechecker.controller;

import com.example.resumechecker.dto.ResumeCheckResponse;
import com.example.resumechecker.model.AnalysisResult;
import com.example.resumechecker.repository.AnalysisResultRepository;
import com.example.resumechecker.service.ResumeAnalyzerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/resume")
@RequiredArgsConstructor
@Slf4j
public class ResumeController {

    private final ResumeAnalyzerService resumeAnalyzerService;
    private final AnalysisResultRepository repository;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        log.info("[HEALTH] Health check endpoint reached.");
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    @PostMapping("/test-json")
    public ResponseEntity<Map<String, String>> testJson(@RequestBody Map<String, Object> payload) {
        log.info("[TEST-JSON] Received JSON POST payload: {}", payload);
        return ResponseEntity.ok(Map.of("status", "OK", "message", "JSON POST successful", "payload", payload.toString()));
    }

    @PostMapping("/test-multipart-text")
    public ResponseEntity<Map<String, String>> testMultipartText(
            @RequestParam("file") MultipartFile file,
            @RequestParam("description") String description) {
        String filename = file != null ? file.getOriginalFilename() : "null";
        long size = file != null ? file.getSize() : 0;
        log.info("[TEST-MULTIPART-TEXT] Received file: {}, size: {} bytes, description: {}", filename, size, description);
        return ResponseEntity.ok(Map.of("status", "OK", "filename", filename, "size", String.valueOf(size), "description", description));
    }

    @PostMapping("/test-multipart-file")
    public ResponseEntity<Map<String, String>> testMultipartFile(
            @RequestParam("file") MultipartFile file) {
        String filename = file != null ? file.getOriginalFilename() : "null";
        long size = file != null ? file.getSize() : 0;
        log.info("[TEST-MULTIPART-FILE] Received PDF file: {}, size: {} bytes", filename, size);
        return ResponseEntity.ok(Map.of("status", "OK", "filename", filename, "size", String.valueOf(size)));
    }

    @PostMapping("/check")
    public ResponseEntity<ResumeCheckResponse> checkResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam("jobDescription") String jobDescription) {
        log.info("[API POST /check] VERY FIRST LINE of checkResume reached.");
        
        String filename = file != null ? file.getOriginalFilename() : "null";
        long fileSize = file != null ? file.getSize() : 0;
        log.info("[API REQUEST] Incoming ATS check request received. File: {}, Size: {} bytes", filename, fileSize);

        if (file == null || file.isEmpty() || jobDescription == null || jobDescription.trim().isEmpty()) {
            log.warn("[API REQUEST] Validation failed: file is empty or jobDescription is blank");
            return ResponseEntity.badRequest().build();
        }

        log.info("[API REQUEST] Starting processing for file: {}", filename);
        long startTime = System.currentTimeMillis();

        try {
            ResumeCheckResponse response = resumeAnalyzerService.analyzeResume(file, jobDescription);
            long durationMs = System.currentTimeMillis() - startTime;
            log.info("[API REQUEST] Completed successfully. File: {}, Duration: {} ms", filename, durationMs);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[API ERROR] Failed to analyze resume for file: " + filename, e);
            throw e;
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<AnalysisResult>> getHistory() {
        return ResponseEntity.ok(repository.findAllByOrderByCreatedAtDesc());
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<Void> deleteHistory(@PathVariable Long id) {
        log.info("[DELETE] Starting history deletion for id={}", id);
        long startTime = System.nanoTime();
        int affectedRows = repository.deleteByIdDirectly(id);
        long endTime = System.nanoTime();
        long durationMs = (endTime - startTime) / 1_000_000;
        log.info("[DELETE] Completed deletion for id={}, affectedRows={}, durationMs={} ms", id, affectedRows, durationMs);

        if (affectedRows == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
