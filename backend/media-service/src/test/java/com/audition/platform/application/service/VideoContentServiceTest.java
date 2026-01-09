package com.audition.platform.application.service;

import com.audition.platform.application.dto.CreateVideoRequest;
import com.audition.platform.application.dto.VideoContentDto;
import com.audition.platform.domain.entity.VideoContent;
import com.audition.platform.domain.repository.VideoContentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Arrays;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VideoContentServiceTest {

    @Mock
    private VideoContentRepository videoContentRepository;

    @Mock
    private com.audition.platform.application.mapper.VideoContentMapper videoContentMapper;

    @InjectMocks
    private VideoContentService videoContentService;

    private VideoContent testVideo;

    @BeforeEach
    void setUp() {
        testVideo = VideoContent.builder()
                .id(1L)
                .userId(1L)
                .title("테스트 비디오")
                .videoUrl("https://example.com/video.mp4")
                .status(VideoContent.VideoStatus.PUBLISHED)
                .viewCount(0L)
                .likeCount(0L)
                .build();
    }

    @Test
    void shouldGetVideos() {
        // given
        Page<VideoContent> page = new PageImpl<>(Arrays.asList(testVideo));
        VideoContentDto dto = VideoContentDto.builder()
                .id(1L)
                .title("테스트 비디오")
                .build();

        when(videoContentRepository.findByUserIdAndStatus(anyLong(), any(), any(PageRequest.class)))
                .thenReturn(page);
        when(videoContentMapper.toDto(any(VideoContent.class))).thenReturn(dto);

        // when
        Page<VideoContentDto> result = videoContentService.getVideos(1L, PageRequest.of(0, 20));

        // then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("테스트 비디오");
    }

    @Test
    void shouldGetVideoAndIncrementViewCount() {
        // given
        VideoContentDto dto = VideoContentDto.builder()
                .id(1L)
                .title("테스트 비디오")
                .viewCount(1L)
                .build();

        when(videoContentRepository.findById(1L)).thenReturn(Optional.of(testVideo));
        when(videoContentRepository.save(any(VideoContent.class))).thenReturn(testVideo);
        when(videoContentMapper.toDto(testVideo)).thenReturn(dto);

        // when
        VideoContentDto result = videoContentService.getVideo(1L);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getViewCount()).isEqualTo(1L);
        verify(videoContentRepository, times(1)).save(any(VideoContent.class));
    }

    @Test
    void shouldCreateVideo() {
        // given
        CreateVideoRequest request = new CreateVideoRequest();
        request.setTitle("새 비디오");
        request.setVideoUrl("https://example.com/new-video.mp4");
        request.setStatus(VideoContent.VideoStatus.PUBLISHED);

        VideoContent savedVideo = VideoContent.builder()
                .id(2L)
                .title("새 비디오")
                .build();

        VideoContentDto dto = VideoContentDto.builder()
                .id(2L)
                .title("새 비디오")
                .build();

        when(videoContentRepository.save(any(VideoContent.class))).thenReturn(savedVideo);
        when(videoContentMapper.toDto(savedVideo)).thenReturn(dto);

        // when
        VideoContentDto result = videoContentService.createVideo(1L, request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("새 비디오");
        verify(videoContentRepository, times(1)).save(any(VideoContent.class));
    }

    @Test
    void shouldIncrementLikeCount() {
        // given
        VideoContentDto dto = VideoContentDto.builder()
                .id(1L)
                .likeCount(1L)
                .build();

        when(videoContentRepository.findById(1L)).thenReturn(Optional.of(testVideo));
        when(videoContentRepository.save(any(VideoContent.class))).thenReturn(testVideo);
        when(videoContentMapper.toDto(testVideo)).thenReturn(dto);

        // when
        VideoContentDto result = videoContentService.incrementLikeCount(1L);

        // then
        assertThat(result.getLikeCount()).isEqualTo(1L);
        verify(videoContentRepository, times(1)).save(any(VideoContent.class));
    }
}
