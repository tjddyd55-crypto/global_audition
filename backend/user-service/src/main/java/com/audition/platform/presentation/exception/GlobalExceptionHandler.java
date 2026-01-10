package com.audition.platform.presentation.exception;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadableException(
            HttpMessageNotReadableException ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("status", HttpStatus.BAD_REQUEST.value());
        error.put("error", "HttpMessageNotReadableException");
        
        String message = "요청 데이터 형식이 올바르지 않습니다";
        
        Throwable cause = ex.getCause();
        if (cause instanceof InvalidFormatException) {
            InvalidFormatException ife = (InvalidFormatException) cause;
            String fieldName = ife.getPath().stream()
                    .map(ref -> ref.getFieldName())
                    .reduce((first, second) -> second)
                    .orElse("알 수 없는 필드");
            
            if (LocalDate.class.equals(ife.getTargetType())) {
                message = fieldName + " 필드는 'yyyy-MM-dd' 형식이어야 합니다 (예: 2000-01-01). 입력된 값: " + ife.getValue();
            } else {
                message = fieldName + " 필드의 형식이 올바르지 않습니다: " + ife.getValue();
            }
        } else if (cause != null) {
            message = "JSON 파싱 오류: " + cause.getMessage();
        } else {
            message = ex.getMessage() != null ? ex.getMessage() : "요청 데이터를 읽을 수 없습니다";
        }
        
        error.put("message", message);
        error.put("exceptionType", ex.getClass().getName());
        
        System.err.println("=== HttpMessageNotReadableException ===");
        System.err.println("Message: " + message);
        if (cause != null) {
            System.err.println("Cause: " + cause.getClass().getName());
            System.err.println("Cause Message: " + cause.getMessage());
        }
        ex.printStackTrace();
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

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
        
        System.err.println("=== DataIntegrityViolationException ===");
        System.err.println("Message: " + ex.getMessage());
        
        // Root Cause 추적
        Throwable rootCause = ex.getRootCause();
        if (rootCause != null) {
            System.err.println("Root Cause Type: " + rootCause.getClass().getName());
            System.err.println("Root Cause Message: " + rootCause.getMessage());
            
            if (rootCause instanceof SQLException) {
                SQLException sqlEx = (SQLException) rootCause;
                System.err.println("SQL State: " + sqlEx.getSQLState());
                System.err.println("SQL Error Code: " + sqlEx.getErrorCode());
                System.err.println("SQL Message: " + sqlEx.getMessage());
            }
        }
        ex.printStackTrace();
        
        error.put("message", "데이터 무결성 오류: " + ex.getMessage());
        if (rootCause != null) {
            error.put("rootCause", rootCause.getClass().getName());
            error.put("rootCauseMessage", rootCause.getMessage());
            if (rootCause instanceof SQLException) {
                SQLException sqlEx = (SQLException) rootCause;
                error.put("sqlState", sqlEx.getSQLState());
                error.put("sqlErrorCode", sqlEx.getErrorCode());
                error.put("sqlMessage", sqlEx.getMessage());
            }
        } else if (ex.getCause() != null) {
            error.put("cause", ex.getCause().getClass().getName());
            error.put("causeMessage", ex.getCause().getMessage());
        }
        error.put("status", HttpStatus.BAD_REQUEST.value());
        error.put("error", "DataIntegrityViolationException");
        
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
        error.put("message", ex.getMessage() != null ? ex.getMessage() : "처리 중 오류가 발생했습니다");
        error.put("status", HttpStatus.BAD_REQUEST.value());
        error.put("error", "RuntimeException");
        error.put("exceptionType", ex.getClass().getName());
        
        System.err.println("=== RuntimeException ===");
        System.err.println("Message: " + ex.getMessage());
        ex.printStackTrace();
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(TransactionSystemException.class)
    public ResponseEntity<Map<String, Object>> handleTransactionException(TransactionSystemException ex) {
        Map<String, Object> error = new HashMap<>();
        
        System.err.println("=== TransactionSystemException ===");
        System.err.println("Message: " + ex.getMessage());
        
        Throwable rootCause = ex.getRootCause();
        if (rootCause != null) {
            System.err.println("Root Cause Type: " + rootCause.getClass().getName());
            System.err.println("Root Cause Message: " + rootCause.getMessage());
            
            if (rootCause instanceof SQLException) {
                SQLException sqlEx = (SQLException) rootCause;
                System.err.println("SQL State: " + sqlEx.getSQLState());
                System.err.println("SQL Error Code: " + sqlEx.getErrorCode());
                System.err.println("SQL Message: " + sqlEx.getMessage());
            }
            
            error.put("message", "트랜잭션 오류: " + rootCause.getMessage());
            error.put("rootCause", rootCause.getClass().getName());
            error.put("rootCauseMessage", rootCause.getMessage());
            
            if (rootCause instanceof SQLException) {
                SQLException sqlEx = (SQLException) rootCause;
                error.put("sqlState", sqlEx.getSQLState());
                error.put("sqlErrorCode", sqlEx.getErrorCode());
                error.put("sqlMessage", sqlEx.getMessage());
            }
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
        
        // ⚠️ 항상 스택 트레이스 전체 출력 (Railway 로그에서 확인)
        System.err.println("===========================================");
        System.err.println("=== UNCAUGHT EXCEPTION ===");
        System.err.println("Exception Type: " + ex.getClass().getName());
        System.err.println("Message: " + ex.getMessage());
        
        // Cause 체인 전체 출력 (최대 10단계)
        Throwable cause = ex.getCause();
        int depth = 0;
        while (cause != null && depth < 10) {
            System.err.println("Cause [" + depth + "]: " + cause.getClass().getName());
            System.err.println("Cause [" + depth + "] Message: " + cause.getMessage());
            
            // SQLException 특별 처리
            if (cause instanceof SQLException) {
                SQLException sqlEx = (SQLException) cause;
                System.err.println("SQL State: " + sqlEx.getSQLState());
                System.err.println("SQL Error Code: " + sqlEx.getErrorCode());
                System.err.println("SQL Message: " + sqlEx.getMessage());
            }
            
            // 다음 Cause로 이동
            cause = cause.getCause();
            depth++;
        }
        
        // Root Cause 추적
        Throwable rootCause = ex;
        while (rootCause.getCause() != null) {
            rootCause = rootCause.getCause();
        }
        if (rootCause != ex) {
            System.err.println("Root Cause Type: " + rootCause.getClass().getName());
            System.err.println("Root Cause Message: " + rootCause.getMessage());
        }
        
        // 전체 스택 트레이스 출력
        System.err.println("=== Full Stack Trace ===");
        ex.printStackTrace();
        System.err.println("===========================================");
        
        // 응답 구성
        error.put("message", "서버 오류가 발생했습니다: " + (ex.getMessage() != null ? ex.getMessage() : "알 수 없는 오류"));
        error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        error.put("error", ex.getClass().getSimpleName());
        error.put("exceptionType", ex.getClass().getName());
        error.put("exceptionMessage", ex.getMessage());
        
        // Cause 정보 포함
        Throwable firstCause = ex.getCause();
        if (firstCause != null) {
            error.put("cause", firstCause.getClass().getName());
            error.put("causeMessage", firstCause.getMessage());
            
            // SQLException이면 SQL 정보도 포함
            if (firstCause instanceof SQLException) {
                SQLException sqlEx = (SQLException) firstCause;
                error.put("sqlState", sqlEx.getSQLState());
                error.put("sqlErrorCode", sqlEx.getErrorCode());
                error.put("sqlMessage", sqlEx.getMessage());
            }
        }
        
        // Root Cause 정보
        if (rootCause != ex) {
            error.put("rootCause", rootCause.getClass().getName());
            error.put("rootCauseMessage", rootCause.getMessage());
        }
        
        // 스택 트레이스 첫 줄
        StackTraceElement[] stackTrace = ex.getStackTrace();
        if (stackTrace.length > 0) {
            error.put("firstStackTrace", stackTrace[0].toString());
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
