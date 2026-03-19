-- V6: detail_content(jsonb) 제거 · qualifications/schedules text[] 확정
-- 운영 배포 순서: 본 마이그레이션 적용 → Spring 백엔드 기동 → 프론트. 순서 위반 시 JPA 매핑 오류.
-- SSOT 배열: recruit_fields, qualifications, schedules, benefits, gallery_images (모두 text[])

SET search_path TO public;

ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS qualifications TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS schedules TEXT[] NOT NULL DEFAULT '{}';

-- detail_content JSON → 배열 이전 (컬럼이 있는 환경만)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auditions' AND column_name = 'detail_content'
  ) THEN
    UPDATE public.auditions SET qualifications = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(detail_content->'qualification')),
      '{}'::text[]
    ) WHERE detail_content IS NOT NULL AND jsonb_typeof(detail_content->'qualification') = 'array';

    UPDATE public.auditions SET schedules = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(detail_content->'schedule')),
      '{}'::text[]
    ) WHERE detail_content IS NOT NULL AND jsonb_typeof(detail_content->'schedule') = 'array';

    UPDATE public.auditions SET recruit_fields = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(detail_content->'recruit')),
      recruit_fields
    )
    WHERE detail_content IS NOT NULL
      AND jsonb_typeof(detail_content->'recruit') = 'array'
      AND (recruit_fields IS NULL OR recruit_fields = '{}');

    UPDATE public.auditions SET benefits = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(detail_content->'benefits')),
      benefits
    )
    WHERE detail_content IS NOT NULL
      AND jsonb_typeof(detail_content->'benefits') = 'array'
      AND (benefits IS NULL OR benefits = '{}');

    ALTER TABLE public.auditions DROP COLUMN detail_content;
  END IF;
END $$;
