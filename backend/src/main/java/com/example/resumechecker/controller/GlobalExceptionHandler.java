package com.example.resumechecker.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private ResponseEntity<Map<String, String>> buildCorsErrorResponse(
            HttpStatus status, String error, String message, HttpServletRequest request) {
        
        String origin = request.getHeader("Origin");
        HttpHeaders headers = new HttpHeaders();
        if (origin != null) {
            headers.add("Access-Control-Allow-Origin", origin);
            headers.add("Access-Control-Allow-Credentials", "true");
            headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
            headers.add("Access-Control-Allow-Headers", "*");
        }
        
        return new ResponseEntity<>(
                Map.of("error", error, "message", message),
                headers,
                status
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException e, HttpServletRequest request) {
        log.error("[EXCEPTION] MaxUploadSizeExceededException caught: ", e);
        return buildCorsErrorResponse(HttpStatus.PAYLOAD_TOO_LARGE, "File too large", e.getMessage(), request);
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, String>> handleMultipartException(MultipartException e, HttpServletRequest request) {
        log.error("[EXCEPTION] MultipartException caught: ", e);
        return buildCorsErrorResponse(HttpStatus.BAD_REQUEST, "Multipart parsing failed", e.getMessage(), request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e, HttpServletRequest request) {
        log.error("[EXCEPTION] General exception caught: ", e);
        return buildCorsErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", e.getMessage(), request);
    }
}
