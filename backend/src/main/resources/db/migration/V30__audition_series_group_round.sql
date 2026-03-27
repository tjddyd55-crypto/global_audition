-- 시리즈(그룹) 단위 공고: 동일 group_id 내 round(=series_round)는 유일. 레거시는 group_id = id, round = 1.
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS group_id UUID;
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS series_round INTEGER NOT NULL DEFAULT 1;

UPDATE auditions SET group_id = id WHERE group_id IS NULL;

ALTER TABLE auditions ALTER COLUMN group_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_auditions_group_series_round ON auditions (group_id, series_round);
