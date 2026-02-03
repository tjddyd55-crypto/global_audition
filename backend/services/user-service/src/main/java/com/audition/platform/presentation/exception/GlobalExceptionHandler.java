package com.audition.platform.presentation.exception;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
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
        
        log.warn("잘못된 요청 형식: {}", message);
        if (cause != null) {
            log.debug("Cause: {} - {}", cause.getClass().getName(), cause.getMessage());
        }
        
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
        
        log.error("데이터 무결성 위반: {}", ex.getMessage(), ex);
        
        // Root Cause 추적
        Throwable rootCause = ex.getRootCause();
        if (rootCause != null) {
            log.debug("Root Cause: {} - {}", rootCause.getClass().getName(), rootCause.getMessage());
            
            if (rootCause instanceof SQLException) {
                SQLException sqlEx = (SQLException) rootCause;
                log.debug("SQL State: {}, Error Code: {}, Message: {}", 
                    sqlEx.getSQLState(), sqlEx.getErrorCode(), sqlEx.getMessage());
            }
        }
        
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
        
        log.warn("제약 조건 위반: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("message", ex.getMessage() != null ? ex.getMessage() : "처리 중 오류가 발생했습니다");
        error.put("status", HttpStatus.BAD_REQUEST.value());
        error.put("error", "RuntimeException");
        error.put("exceptionType", ex.getClass().getName());
        
        log.error("런타임 예외 발생: {}", ex.getMessage(), ex);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(TransactionSystemException.class)
    public ResponseEntity<Map<String, Object>> handleTransactionException(TransactionSystemException ex) {
        Map<String, Object> error = new HashMap<>();
        
        log.error("트랜잭션 오류: {}", ex.getMessage(), ex);
        
        Throwable rootCause = ex.getRootCause();
        if (rootCause != null) {
            log.debug("Root Cause: {} - {}", rootCause.getClass().getName(), rootCause.getMessage());
            
            if (rootCause instanceof SQLException) {
                SQLException sqlEx = (SQLException) rootCause;
                log.debug("SQL State: {}, Error Code: {}, Message: {}", 
                    sqlEx.getSQLState(), sqlEx.getErrorCode(), sqlEx.getMessage());
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
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        Map<String, Object> error = new HashMap<>();
        
        // 예상치 못한 예외 로깅
        log.error("예상치 못한 예외 발생: {}", ex.getMessage(), ex);
        
        // Root Cause 추적
        Throwable rootCause = ex;
        while (rootCause.getCause() != null) {
            rootCause = rootCause.getCause();
        }
        if (rootCause != ex) {
            log.debug("Root Cause: {} - {}", rootCause.getClass().getName(), rootCause.getMessage());
        }
        
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
