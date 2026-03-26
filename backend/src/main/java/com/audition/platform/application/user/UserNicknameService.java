package com.audition.platform.application.user;

import com.audition.platform.domain.user.NicknamePolicy;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class UserNicknameService {

    private final UserRepository userRepository;

    public UserNicknameService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * trim → 형식 검증 → 대소문자 무시 중복 검사 후 정규화된 닉네임 반환.
     *
     * @param excludeUserId 변경 시 자기 자신 제외(신규 가입은 null)
     */
    public String prepareNicknameOrThrow(String raw, UUID excludeUserId) {
        String n = NicknamePolicy.normalizeInput(raw);
        if (n.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "닉네임이 필요합니다.");
        }
        try {
            NicknamePolicy.validateOrThrow(n);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, e.getMessage());
        }
        boolean taken = excludeUserId == null
                ? userRepository.existsByNicknameIgnoreCase(n)
                : userRepository.existsByNicknameIgnoreCaseAndIdNot(n, excludeUserId);
        if (taken) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다.");
        }
        return n;
    }
}
