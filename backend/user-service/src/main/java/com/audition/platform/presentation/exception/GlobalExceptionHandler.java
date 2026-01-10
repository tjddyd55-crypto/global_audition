package com.audition.platform.presentation.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, Object> errors = new HashMap<>();
        Map<String, String> fieldErrors = new HashMap<>();
        
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });
        
        errors.put("message", "입력값 검증에 실패했습니다");
        errors.put("errors", fieldErrors);
        errors.put("status", HttpStatus.BAD_REQUEST.value());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityException(DataIntegrityViolationException ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("message", "데이터 무결성 오류: " + ex.getMessage());
        if (ex.getCause() != null) {
            error.put("cause", ex.getCause().getMessage());
        }
        error.put("status", HttpStatus.BAD_REQUEST.value());
        error.put("error", "DataIntegrityViolationException");
        
        ex.printStackTrace();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolationException(ConstraintViolationException ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("message", "제약 조건 위반: " + ex.getMessage());
        error.put("status", HttpStatus.BAD_REQUEST.value());
        error.put("error", "ConstraintViolationException");
        
        ex.printStackTrace();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("message", ex.getMessage());
        error.put("status", HttpStatus.BAD_REQUEST.value());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(TransactionSystemException.class)
    public ResponseEntity<Map<String, Object>> handleTransactionException(TransactionSystemException ex) {
        Map<String, Object> error = new HashMap<>();
        Throwable rootCause = ex.getRootCause();
        if (rootCause != null) {
            error.put("message", "트랜잭션 오류: " + rootCause.getMessage());
            error.put("rootCause", rootCause.getClass().getName());
        } else {
            error.put("message", "트랜잭션 오류: " + ex.getMessage());
        }
        error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        error.put("error", "TransactionSystemException");
        
        ex.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("message", "서버 오류가 발생했습니다: " + ex.getMessage());
        error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        error.put("error", ex.getClass().getSimpleName());
        
        // 로깅
        ex.printStackTrace();
        
        // 항상 상세 정보 포함 (개발 환경)
        error.put("exceptionType", ex.getClass().getName());
        error.put("exceptionMessage", ex.getMessage());
        if (ex.getCause() != null) {
            error.put("cause", ex.getCause().getClass().getName() + ": " + ex.getCause().getMessage());
            if (ex.getCause().getCause() != null) {
                error.put("rootCause", ex.getCause().getCause().getClass().getName() + ": " + ex.getCause().getCause().getMessage());
            }
        }
        // 스택 트레이스의 첫 몇 줄만 포함
        StackTraceElement[] stackTrace = ex.getStackTrace();
        if (stackTrace.length > 0) {
            error.put("firstStackTrace", stackTrace[0].toString());
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
