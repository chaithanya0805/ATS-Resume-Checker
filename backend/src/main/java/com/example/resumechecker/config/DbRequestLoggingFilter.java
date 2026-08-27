package com.example.resumechecker.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.UUID;

@Component
@Slf4j
public class DbRequestLoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest) {
            HttpServletRequest req = (HttpServletRequest) request;
            String requestId = UUID.randomUUID().toString().substring(0, 8);
            long startTime = System.currentTimeMillis();
            
            String method = req.getMethod();
            String uri = req.getRequestURI();
            String contentType = req.getContentType();
            int contentLength = req.getContentLength();
            String origin = req.getHeader("Origin");
            String userAgent = req.getHeader("User-Agent");

            log.info("[FILTER][REQ-ID:{}] Received Request: {} {} | Content-Type: {} | Content-Length: {} | Origin: {} | User-Agent: {}",
                    requestId, method, uri, contentType, contentLength, origin, userAgent);
            
            try {
                chain.doFilter(request, response);
            } finally {
                long duration = System.currentTimeMillis() - startTime;
                log.info("[FILTER][REQ-ID:{}] Finished Request: {} {} | Duration: {} ms",
                        requestId, method, uri, duration);
            }
        } else {
            chain.doFilter(request, response);
        }
    }
}
