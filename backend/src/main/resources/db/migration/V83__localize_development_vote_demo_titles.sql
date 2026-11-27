-- Add reviewed display titles for the existing Development public voting fixture.
WITH demo AS (
    SELECT id, description, location, agency_name, recruit_fields, qualifications, schedules, benefits
    FROM auditions
    WHERE id = '4318b8f5-c66e-437b-b4c1-3f2ca566b5c0'
      AND title = '[DEV-DEMO] 후보 공유 투표 (5명)'
)
INSERT INTO audition_translations(audition_id, locale, title, description, location, agency_name,
                                  recruit_fields, qualifications, schedules, benefits, manually_edited)
SELECT demo.id, localized.locale, localized.title, COALESCE(demo.description,''), COALESCE(demo.location,''),
       COALESCE(demo.agency_name,''), COALESCE(demo.recruit_fields,'{}'), COALESCE(demo.qualifications,'{}'),
       COALESCE(demo.schedules,'{}'), COALESCE(demo.benefits,'{}'), TRUE
FROM demo CROSS JOIN (VALUES
    ('zh-CN', '[DEV-DEMO] 候选人公开投票（5人）'),
    ('zh-TW', '[DEV-DEMO] 候選人公開投票（5 人）'),
    ('ja', '[DEV-DEMO] 候補者公開投票（5名）')
) localized(locale, title)
ON CONFLICT (audition_id, locale) DO NOTHING;
