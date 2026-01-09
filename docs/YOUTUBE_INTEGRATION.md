# YouTube 통합 가이드

## 📌 개요

이 프로젝트는 YouTube를 영상 스토리지로 사용합니다. 지망생이 YouTube에 영상을 업로드하고, 플랫폼에서는 YouTube URL만 저장하여 재생합니다.

## ✅ 구현된 기능

### 백엔드

1. **YouTube URL 검증**
   - `YouTubeUrlValidator.isValidYouTubeUrl()` - URL 유효성 검증
   - 지원 형식:
     - `https://www.youtube.com/watch?v=VIDEO_ID`
     - `https://youtu.be/VIDEO_ID`
     - `https://www.youtube.com/embed/VIDEO_ID`

2. **영상 ID 추출**
   - `YouTubeUrlValidator.extractVideoId()` - URL에서 영상 ID 추출

3. **썸네일 자동 생성**
   - YouTube 영상 ID로 썸네일 URL 자동 생성
   - 형식: `https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg`

4. **임베드 URL 생성**
   - `YouTubeUrlValidator.generateEmbedUrl()` - iframe 재생용 URL 생성
   - 형식: `https://www.youtube.com/embed/{VIDEO_ID}`

### 프론트엔드

1. **YouTube 재생기 컴포넌트**
   - `components/video/YouTubePlayer.tsx`
   - YouTube URL을 받아서 iframe으로 재생

2. **YouTube 유틸리티 함수**
   - `lib/utils/youtube.ts`
   - URL 검증, ID 추출, 썸네일/임베드 URL 생성

## 🔧 사용 방법

### 백엔드에서 영상 생성

```java
CreateVideoRequest request = new CreateVideoRequest();
request.setTitle("테스트 영상");
request.setVideoUrl("https://www.youtube.com/watch?v=VIDEO_ID");
request.setStatus(VideoContent.VideoStatus.PUBLISHED);

// 썸네일은 자동으로 생성됨
VideoContentDto video = videoContentService.createVideo(userId, request);
```

### 프론트엔드에서 영상 재생

```tsx
import YouTubePlayer from '@/components/video/YouTubePlayer'

<YouTubePlayer 
  videoUrl={video.videoUrl}
  embedUrl={video.embedUrl} // 선택사항
  width="100%"
  height={400}
/>
```

## 📝 개인 채널 기능

지망생은 `ApplicantProfile`에 YouTube 채널 URL을 저장할 수 있습니다:

```java
// ApplicantProfile 엔티티에 이미 youtubeUrl 필드가 있음
applicantProfile.setYoutubeUrl("https://www.youtube.com/@channel");
```

## 🎯 장점

1. **무료**: YouTube 스토리지 무료 사용
2. **간단**: URL만 저장하면 됨
3. **안정적**: YouTube의 CDN 활용
4. **모바일 최적화**: YouTube가 자동 처리

## ⚠️ 제한사항

1. **YouTube 정책 의존**: YouTube 정책 변경 시 영향 가능
2. **광고**: YouTube 광고가 표시될 수 있음
3. **커스터마이징 제한**: 완전한 커스터마이징 불가

## 🚀 향후 개선 사항

1. **YouTube API 연동**: 자동 업로드 기능
2. **채널 영상 자동 동기화**: YouTube Data API 사용
3. **썸네일 캐싱**: 성능 최적화
