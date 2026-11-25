-- Correct the source locale and provide reviewed display titles for the Development-only demo.
-- The UUID, source title and DEMO marker identify the fixture; other postings are untouched.
WITH demo AS (
    UPDATE auditions SET default_locale = 'ko'
    WHERE id = '4318b8f5-c66e-437b-b4c1-3f2ca566b5c0'
      AND title = '[DEV-DEMO] 후보 공유 투표 (5명)'
    RETURNING id, description, location, agency_name, recruit_fields, qualifications, schedules, benefits
)
INSERT INTO audition_translations(audition_id, locale, title, description, location, agency_name,
                                  recruit_fields, qualifications, schedules, benefits, manually_edited)
SELECT demo.id, localized.locale, localized.title, COALESCE(demo.description,''), COALESCE(demo.location,''),
       COALESCE(demo.agency_name,''), COALESCE(demo.recruit_fields,'{}'), COALESCE(demo.qualifications,'{}'),
       COALESCE(demo.schedules,'{}'), COALESCE(demo.benefits,'{}'), TRUE
FROM demo CROSS JOIN (VALUES
    ('en', '[DEV-DEMO] Public Voting – 5 Candidates'),
    ('mn', '[DEV-DEMO] Олон нийтийн санал хураалт (5 оролцогч)'),
    ('km', '[DEV-DEMO] ការបោះឆ្នោតសាធារណៈ (បេក្ខជន ៥ នាក់)'),
    ('uz', '[DEV-DEMO] Ommaviy ovoz berish (5 nomzod)')
) localized(locale, title)
ON CONFLICT (audition_id, locale) DO UPDATE
SET title = EXCLUDED.title, status='COMPLETED', provider='MANUAL', origin='MANUAL',
    manually_edited=TRUE, stale=FALSE, updated_at=NOW(), row_version=audition_translations.row_version+1
WHERE NOT audition_translations.manually_edited
   OR audition_translations.title IN ('', '[DEV-DEMO] 후보 공유 투표 (5명)', '[DEV-DEMO] 후보공유 투표 (5명)', '[DEV-DEMO] hawami gae-i hae (5da)');
