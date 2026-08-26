package com.example.resumechecker.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class GeminiApiKeyManager {

    private final List<String> apiKeys;

    public GeminiApiKeyManager(Environment env) {
        List<String> loadedKeys = new ArrayList<>();

        // Loop to find GEMINI_API_KEY_1 through GEMINI_API_KEY_20 (ignores gaps)
        for (int i = 1; i <= 20; i++) {
            String key = env.getProperty("GEMINI_API_KEY_" + i);
            boolean isConfigured = key != null && !key.trim().isEmpty() && !key.contains("YOUR_API_KEY");
            log.info("Gemini API Key {}: {}", i, isConfigured ? "configured" : "not configured");
            if (isConfigured) {
                loadedKeys.add(key.trim());
            }
        }

        // Fallback: check ATS_GEMINI_API_KEY for legacy/existing deployments
        if (loadedKeys.isEmpty()) {
            String atsKey = env.getProperty("ATS_GEMINI_API_KEY");
            boolean isConfigured = atsKey != null && !atsKey.trim().isEmpty() && !atsKey.contains("YOUR_API_KEY");
            log.info("Legacy ATS_GEMINI_API_KEY: {}", isConfigured ? "configured" : "not configured");
            if (isConfigured) {
                loadedKeys.add(atsKey.trim());
            }
        }

        // Fallback: check default gemini.api.key value defined in application.properties
        if (loadedKeys.isEmpty()) {
            String defaultKey = env.getProperty("gemini.api.key");
            boolean isConfigured = defaultKey != null && !defaultKey.trim().isEmpty() && !defaultKey.contains("YOUR_API_KEY");
            log.info("Default gemini.api.key: {}", isConfigured ? "configured" : "not configured");
            if (isConfigured) {
                loadedKeys.add(defaultKey.trim());
            }
        }

        this.apiKeys = Collections.unmodifiableList(loadedKeys);
        log.info("Initialized GeminiApiKeyManager with {} API key(s).", this.apiKeys.size());
    }

    /**
     * Returns an unmodifiable list of all configured API keys.
     */
    public List<String> getAvailableKeys() {
        return apiKeys;
    }

    /**
     * Returns the total number of configured API keys.
     */
    public int getKeyCount() {
        return apiKeys.size();
    }
}
