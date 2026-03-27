SET search_path TO public;

-- -----------------------------------------------------------------------------
-- 마스터 태그 (SYSTEM: 플랫폼 고정, USER: 관리자·운영 추가)
-- -----------------------------------------------------------------------------
CREATE TABLE tags (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(80)  NOT NULL,
    type       VARCHAR(20)  NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT true,
    CONSTRAINT tags_type_check CHECK (type IN ('SYSTEM', 'USER')),
    CONSTRAINT tags_name_unique UNIQUE (name)
);

CREATE INDEX idx_tags_active_sort ON tags (is_active, type, name);

-- -----------------------------------------------------------------------------
-- 오디션–태그 연결: catalog 태그는 tag_id, 직접 입력은 tag_id NULL + tag_name
-- -----------------------------------------------------------------------------
CREATE TABLE audition_tags (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audition_id  UUID NOT NULL REFERENCES auditions (id) ON DELETE CASCADE,
    tag_id       UUID NULL REFERENCES tags (id) ON DELETE RESTRICT,
    tag_name     VARCHAR(120) NULL,
    CONSTRAINT audition_tags_ref_or_custom CHECK (
        (tag_id IS NOT NULL AND (tag_name IS NULL OR length(trim(tag_name)) = 0))
        OR (tag_id IS NULL AND tag_name IS NOT NULL AND length(trim(tag_name)) > 0)
    )
);

CREATE INDEX idx_audition_tags_audition ON audition_tags (audition_id);

-- 시드: 기존 허용 목록과 동일한 SYSTEM 태그
INSERT INTO tags (name, type, is_active) VALUES
    ('보컬', 'SYSTEM', true),
    ('댄서', 'SYSTEM', true),
    ('팀', 'SYSTEM', true),
    ('배우', 'SYSTEM', true),
    ('모델', 'SYSTEM', true);

-- 레거시 auditions.tags → audition_tags (직입력 행으로 이관 후 이름 매칭으로 tag_id 연결)
INSERT INTO audition_tags (audition_id, tag_id, tag_name)
SELECT a.id, NULL, trim(t.elem)
FROM auditions a
CROSS JOIN LATERAL unnest(coalesce(a.tags, array[]::text[])) AS t(elem)
WHERE length(trim(t.elem)) > 0;

-- 동일 오디션·동일 커스텀명(대소문 무시) 중복 제거
DELETE FROM audition_tags
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               row_number() OVER (
                   PARTITION BY audition_id, lower(trim(tag_name))
                   ORDER BY id
               ) AS rn
        FROM audition_tags
        WHERE tag_id IS NULL
    ) sub
    WHERE rn > 1
);

-- 카탈로그명과 일치하면 tag_id로 승격 (tag_name 비움)
UPDATE audition_tags at
SET tag_id = t.id,
    tag_name = NULL
FROM tags t
WHERE at.tag_id IS NULL
  AND at.tag_name IS NOT NULL
  AND lower(trim(at.tag_name)) = lower(trim(t.name))
  AND t.is_active = true;

-- 동일 오디션·동일 tag_id 중복 제거
DELETE FROM audition_tags
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               row_number() OVER (
                   PARTITION BY audition_id, tag_id
                   ORDER BY id
               ) AS rn
        FROM audition_tags
        WHERE tag_id IS NOT NULL
    ) sub
    WHERE rn > 1
);

CREATE UNIQUE INDEX audition_tags_audition_tag_id_uniq
    ON audition_tags (audition_id, tag_id) WHERE tag_id IS NOT NULL;

CREATE UNIQUE INDEX audition_tags_audition_custom_uniq
    ON audition_tags (audition_id, lower(trim(tag_name))) WHERE tag_id IS NULL;

ALTER TABLE auditions DROP COLUMN tags;
