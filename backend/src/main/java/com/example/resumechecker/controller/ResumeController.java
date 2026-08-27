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

@RestController
@RequestMapping("/api/v1/resume")
@RequiredArgsConstructor
@Slf4j
public class ResumeController {

    private final ResumeAnalyzerService resumeAnalyzerService;
    private final AnalysisResultRepository repository;

    @PostMapping("/check")
    public ResponseEntity<ResumeCheckResponse> checkResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam("jobDescription") String jobDescription) {
        
        if (file.isEmpty() || jobDescription == null || jobDescription.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        ResumeCheckResponse response = resumeAnalyzerService.analyzeResume(file, jobDescription);
        return ResponseEntity.ok(response);
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
