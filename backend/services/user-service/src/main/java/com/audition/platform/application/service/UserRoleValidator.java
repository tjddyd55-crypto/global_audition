package com.audition.platform.application.service;

import com.audition.platform.domain.entity.User;
import com.audition.platform.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * 사용자 역할 검증 서비스 (STEP 1: 권한 SSOT)
 * User Service는 권한 판단의 SSOT
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserRoleValidator {

    private final UserRepository userRepository;

    /**
     * 지원자(APPLICANT) 권한 검증
     */
    public void requireApplicant(Long userId) {
        requireRole(userId, User.UserType.APPLICANT, "지원자만 수행할 수 있습니다");
    }

    /**
     * 기획사(AGENCY) 권한 검증
     * BUSINESS도 AGENCY로 간주 (하위 호환성)
     */
    public void requireAgency(Long userId) {
        User user = getUser(userId);
        if (user.getUserType() != User.UserType.AGENCY && user.getUserType() != User.UserType.BUSINESS) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "기획사만 수행할 수 있습니다");
        }
    }

    /**
     * 트레이너(TRAINER) 권한 검증
     */
    public void requireTrainer(Long userId) {
        requireRole(userId, User.UserType.TRAINER, "트레이너만 수행할 수 있습니다");
    }

    /**
     * 관리자(ADMIN) 권한 검증
     */
    public void requireAdmin(Long userId) {
        requireRole(userId, User.UserType.ADMIN, "관리자만 수행할 수 있습니다");
    }

    /**
     * 기획사 또는 트레이너 권한 검증 (심사/피드백용)
     */
    public void requireAgencyOrTrainer(Long userId) {
        User user = getUser(userId);
        boolean isAgency = user.getUserType() == User.UserType.AGENCY || user.getUserType() == User.UserType.BUSINESS;
        boolean isTrainer = user.getUserType() == User.UserType.TRAINER;
        
        if (!isAgency && !isTrainer) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "기획사 또는 트레이너만 수행할 수 있습니다");
        }
    }

    /**
     * 공통 역할 검증 메서드 (STEP 1)
     */
    public void requireRole(Long userId, User.UserType expectedRole, String errorMessage) {
        User user = getUser(userId);
        if (user.getUserType() != expectedRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, errorMessage);
        }
    }

    /**
     * 사용자 조회 및 인증 확인
     */
    private User getUser(Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));
    }

    /**
     * 사용자 역할 조회 (다른 서비스에서 사용)
     */
    public User.UserType getUserRole(Long userId) {
        return getUser(userId).getUserType();
    }

    /**
     * 역할이 특정 역할인지 확인
     */
    public boolean hasRole(Long userId, User.UserType role) {
        try {
            User user = getUser(userId);
            return user.getUserType() == role || 
                   (role == User.UserType.AGENCY && user.getUserType() == User.UserType.BUSINESS);
        } catch (Exception e) {
            return false;
        }
    }
}

