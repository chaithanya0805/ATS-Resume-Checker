package com.example.resumechecker.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * TEMPORARY MIGRATION RUNNER
 * This is a temporary one-time migration utility for the active database used by the deployed backend.
 * Please delete this file from the codebase once the deployed database schema has been verified as fixed.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DbSchemaMigrationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Value("${spring.datasource.url:unknown}")
    private String rawDbUrl;

    @EventListener(ApplicationReadyEvent.class)
    public void runMigration() {
        try {
            log.info("[DB MIGRATION] Starting database schema verification runner...");

            // 1. Log JDBC URL and current database safely
            String maskedUrl = maskJdbcUrl(rawDbUrl);
            log.info("[DB] Active JDBC URL: {}", maskedUrl);

            String currentDb = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
            log.info("[DB] Current database: {}", currentDb);

            // 2. Define legacy columns to drop
            List<String> legacyColumns = List.of(
                    "grammar_suggestions",
                    "hiring_recommendation",
                    "match_percentage",
                    "matched_keywords",
                    "missing_keywords",
                    "missing_skills",
                    "optimized_professional_summary",
                    "resume_improvement_suggestions",
                    "section_analysis",
                    "skills_found",
                    "strengths",
                    "weaknesses"
            );

            // 3. Inspect current database columns
            log.info("[DB] Inspecting columns of 'analysis_results' table before migration...");
            List<String> columnsToDrop = new ArrayList<>();
            List<Map<String, Object>> columns = jdbcTemplate.queryForList("SHOW COLUMNS FROM analysis_results");
            
            for (Map<String, Object> col : columns) {
                String fieldName = (String) col.get("Field");
                String type = (String) col.get("Type");
                String nullable = (String) col.get("Null");
                log.info("  - Column found: {} ({}, Nullable={})", fieldName, type, nullable);

                if (legacyColumns.contains(fieldName)) {
                    columnsToDrop.add(fieldName);
                }
            }

            // 4. Drop legacy columns dynamically if they exist
            if (!columnsToDrop.isEmpty()) {
                log.info("[DB] LEGACY COLUMNS DETECTED FOR REMOVAL: {}", columnsToDrop);
                StringBuilder sql = new StringBuilder("ALTER TABLE analysis_results ");
                for (int i = 0; i < columnsToDrop.size(); i++) {
                    sql.append("DROP COLUMN ").append(columnsToDrop.get(i));
                    if (i < columnsToDrop.size() - 1) {
                        sql.append(", ");
                    }
                }
                
                String alterSql = sql.toString();
                log.info("[DB] Executing SQL: {}", alterSql);
                jdbcTemplate.execute(alterSql);
                log.info("[DB] Successfully executed ALTER TABLE schema migration.");
            } else {
                log.info("[DB] No legacy columns found. Database schema is already lightweight and matches target schema.");
            }

            // 5. Verify final columns
            log.info("[DB] Verifying final analysis_results schema columns:");
            List<Map<String, Object>> finalColumns = jdbcTemplate.queryForList("SHOW COLUMNS FROM analysis_results");
            for (Map<String, Object> col : finalColumns) {
                log.info("  - Final Column: {} ({})", col.get("Field"), col.get("Type"));
            }

        } catch (Exception e) {
            log.error("[DB ERROR] Failed to complete schema migration check. Error: ", e);
        }
    }

    private String maskJdbcUrl(String url) {
        if (url == null) return "null";
        String masked = url;
        // Mask inline credentials like jdbc:mysql://username:password@hostname
        if (masked.contains("@")) {
            masked = masked.replaceAll("(?<=://)[^/@]+:[^/@]+(?=@)", "*****");
            // If just username is present before host: jdbc:mysql://username@hostname
            masked = masked.replaceAll("(?<=://)[^/@]+(?=@)", "*****");
        }
        // Mask url query parameters if password=xxx is present
        masked = masked.replaceAll("(?i)(password=)[^&]+", "$1*****");
        return masked;
    }
}
