-- 대표 이미지 3종 URL (원본/미디엄/썸네일). cover_image 는 원본과 동기화용으로 유지.
-- 레거시 단일 URL은 스키마상 `cover_image` 컬럼(image_url 아님). 기존 행은 이 값으로 3컬럼 채움.
ALTER TABLE public.auditions
    ADD COLUMN IF NOT EXISTS image_original_url TEXT,
    ADD COLUMN IF NOT EXISTS image_medium_url TEXT,
    ADD COLUMN IF NOT EXISTS image_thumb_url TEXT;

UPDATE public.auditions
SET image_original_url = cover_image,
    image_medium_url = cover_image,
    image_thumb_url = cover_image
WHERE cover_image IS NOT NULL
  AND TRIM(cover_image) <> '';
