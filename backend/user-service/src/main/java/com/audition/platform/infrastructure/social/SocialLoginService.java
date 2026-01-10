package com.audition.platform.infrastructure.social;

import com.audition.platform.domain.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocialLoginService {

    private final WebClient.Builder webClientBuilder;

    @Value("${social.google.client-id:}")
    private String googleClientId;

    @Value("${social.kakao.client-id:}")
    private String kakaoClientId;

    @Value("${social.naver.client-id:}")
    private String naverClientId;

    @Value("${social.facebook.client-id:}")
    private String facebookClientId;

    /**
     * Google 사용자 정보 조회
     */
    public SocialUserInfo getGoogleUserInfo(String accessToken) {
        try {
            WebClient webClient = webClientBuilder.build();
            Map<String, Object> userInfo = webClient.get()
                    .uri("https://www.googleapis.com/oauth2/v2/userinfo")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (userInfo == null) {
                throw new RuntimeException("Google 사용자 정보를 가져올 수 없습니다");
            }

            return SocialUserInfo.builder()
                    .providerId((String) userInfo.get("id"))
                    .email((String) userInfo.get("email"))
                    .name((String) userInfo.get("name"))
                    .profileImageUrl((String) userInfo.get("picture"))
                    .provider(User.Provider.GOOGLE)
                    .build();
        } catch (Exception e) {
            log.error("Google 사용자 정보 조회 실패", e);
            throw new RuntimeException("Google 로그인 실패: " + e.getMessage());
        }
    }

    /**
     * Kakao 사용자 정보 조회
     */
    public SocialUserInfo getKakaoUserInfo(String accessToken) {
        try {
            WebClient webClient = webClientBuilder.build();
            Map<String, Object> userInfo = webClient.get()
                    .uri("https://kapi.kakao.com/v2/user/me")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (userInfo == null) {
                throw new RuntimeException("Kakao 사용자 정보를 가져올 수 없습니다");
            }

            Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");

            return SocialUserInfo.builder()
                    .providerId(String.valueOf(userInfo.get("id")))
                    .email((String) kakaoAccount.get("email"))
                    .name((String) profile.get("nickname"))
                    .profileImageUrl((String) profile.get("profile_image_url"))
                    .provider(User.Provider.KAKAO)
                    .build();
        } catch (Exception e) {
            log.error("Kakao 사용자 정보 조회 실패", e);
            throw new RuntimeException("Kakao 로그인 실패: " + e.getMessage());
        }
    }

    /**
     * Naver 사용자 정보 조회
     */
    public SocialUserInfo getNaverUserInfo(String accessToken) {
        try {
            WebClient webClient = webClientBuilder.build();
            Map<String, Object> response = webClient.get()
                    .uri("https://openapi.naver.com/v1/nid/me")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new RuntimeException("Naver 사용자 정보를 가져올 수 없습니다");
            }

            Map<String, Object> userInfo = (Map<String, Object>) response.get("response");

            return SocialUserInfo.builder()
                    .providerId((String) userInfo.get("id"))
                    .email((String) userInfo.get("email"))
                    .name((String) userInfo.get("name"))
                    .profileImageUrl((String) userInfo.get("profile_image"))
                    .provider(User.Provider.NAVER)
                    .build();
        } catch (Exception e) {
            log.error("Naver 사용자 정보 조회 실패", e);
            throw new RuntimeException("Naver 로그인 실패: " + e.getMessage());
        }
    }

    /**
     * Facebook 사용자 정보 조회
     */
    public SocialUserInfo getFacebookUserInfo(String accessToken) {
        try {
            WebClient webClient = webClientBuilder.build();
            Map<String, Object> userInfo = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("graph.facebook.com")
                            .path("/v18.0/me")
                            .queryParam("fields", "id,name,email,picture")
                            .queryParam("access_token", accessToken)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (userInfo == null) {
                throw new RuntimeException("Facebook 사용자 정보를 가져올 수 없습니다");
            }

            Map<String, Object> picture = (Map<String, Object>) userInfo.get("picture");
            Map<String, Object> pictureData = picture != null ? (Map<String, Object>) picture.get("data") : null;
            String profileImageUrl = pictureData != null ? (String) pictureData.get("url") : null;

            return SocialUserInfo.builder()
                    .providerId((String) userInfo.get("id"))
                    .email((String) userInfo.get("email"))
                    .name((String) userInfo.get("name"))
                    .profileImageUrl(profileImageUrl)
                    .provider(User.Provider.FACEBOOK)
                    .build();
        } catch (Exception e) {
            log.error("Facebook 사용자 정보 조회 실패", e);
            throw new RuntimeException("Facebook 로그인 실패: " + e.getMessage());
        }
    }

    /**
     * 소셜 로그인 제공자에 따라 사용자 정보 조회
     */
    public SocialUserInfo getUserInfo(String provider, String accessToken) {
        return switch (provider.toUpperCase()) {
            case "GOOGLE" -> getGoogleUserInfo(accessToken);
            case "KAKAO" -> getKakaoUserInfo(accessToken);
            case "NAVER" -> getNaverUserInfo(accessToken);
            case "FACEBOOK" -> getFacebookUserInfo(accessToken);
            default -> throw new RuntimeException("지원하지 않는 소셜 로그인 제공자입니다: " + provider);
        };
    }
}
