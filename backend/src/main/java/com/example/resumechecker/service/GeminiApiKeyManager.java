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
        int index = 1;

        // Loop to dynamically find GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
        while (true) {
            String key = env.getProperty("GEMINI_API_KEY_" + index);
            if (key != null && !key.trim().isEmpty() && !key.contains("YOUR_API_KEY")) {
                loadedKeys.add(key.trim());
            } else {
                break;
            }
            index++;
        }

        // Fallback: check ATS_GEMINI_API_KEY for legacy/existing deployments
        if (loadedKeys.isEmpty()) {
            String atsKey = env.getProperty("ATS_GEMINI_API_KEY");
            if (atsKey != null && !atsKey.trim().isEmpty() && !atsKey.contains("YOUR_API_KEY")) {
                loadedKeys.add(atsKey.trim());
            }
        }

        // Fallback: check default gemini.api.key value defined in application.properties
        if (loadedKeys.isEmpty()) {
            String defaultKey = env.getProperty("gemini.api.key");
            if (defaultKey != null && !defaultKey.trim().isEmpty() && !defaultKey.contains("YOUR_API_KEY")) {
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
