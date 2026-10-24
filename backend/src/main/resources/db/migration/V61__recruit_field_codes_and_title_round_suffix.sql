-- V61: recruit_fields -> fixed codes (VOCAL, DANCE, RAP, PRODUCING, ACTING, MODEL, TEAM).
-- Display text comes from the frontend i18n catalog (recruitField.*). Unknown free text is kept as is.
-- Also strips trailing Korean/localized round suffix " (N<round>)" from titles; the UI composes round labels via i18n.
-- ASCII-only file: non-ASCII literals use U&'' escapes.

CREATE OR REPLACE FUNCTION pg_temp.v61_code(v text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN upper(btrim(v)) IN ('VOCAL','DANCE','RAP','PRODUCING','ACTING','MODEL','TEAM') THEN upper(btrim(v))
    WHEN lower(btrim(v)) IN ('vocal','vocals','vocalist', U&'\BCF4\CEEC', U&'\AC00\C218', U&'\0434\0443\0443', U&'\0434\0443\0443\0447\0438\043D') THEN 'VOCAL'
    WHEN lower(btrim(v)) IN ('dance','dancer', U&'\B304\C2A4', U&'\B304\C11C', U&'\0431\04AF\0436\0438\0433', U&'\0431\04AF\0436\0438\0433\0447\0438\043D') THEN 'DANCE'
    WHEN lower(btrim(v)) IN ('rap','rapper', U&'\B7A9', U&'\B798\D37C') THEN 'RAP'
    WHEN lower(btrim(v)) IN ('producing','producer','production', U&'\D504\B85C\B4C0\C2F1', U&'\D504\B85C\B4C0\C11C') THEN 'PRODUCING'
    WHEN lower(btrim(v)) IN ('acting','actor','actress', U&'\C5F0\AE30', U&'\BC30\C6B0', U&'\0436\04AF\0436\0438\0433\043B\044D\0445', U&'\0436\04AF\0436\0438\0433\0447\0438\043D') THEN 'ACTING'
    WHEN lower(btrim(v)) IN ('model','modeling', U&'\BAA8\B378', U&'\0437\0430\0433\0432\0430\0440 \04E9\043C\0441\04E9\0433\0447') THEN 'MODEL'
    WHEN lower(btrim(v)) IN ('team','group', U&'\D300', U&'\0431\0430\0433') THEN 'TEAM'
    ELSE btrim(v)
  END
$$;

CREATE OR REPLACE FUNCTION pg_temp.v61_codes(arr text[]) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(array_agg(c ORDER BY first_pos), '{}'::text[])
  FROM (
    SELECT pg_temp.v61_code(x) AS c, min(ord) AS first_pos
    FROM unnest(arr) WITH ORDINALITY AS t(x, ord)
    WHERE btrim(COALESCE(x, '')) <> ''
    GROUP BY pg_temp.v61_code(x)
  ) s
$$;

UPDATE public.auditions
   SET recruit_fields = pg_temp.v61_codes(recruit_fields)
 WHERE recruit_fields IS DISTINCT FROM pg_temp.v61_codes(recruit_fields);

UPDATE public.audition_translations
   SET recruit_fields = pg_temp.v61_codes(recruit_fields)
 WHERE recruit_fields IS DISTINCT FROM pg_temp.v61_codes(recruit_fields);

-- " (2<cha>)" / " (Round 2)" / " (2-r shat)" trailing suffix
UPDATE public.auditions
   SET title = regexp_replace(title, U&' \\((\\d+\CC28|Round \\d+|\\d+-\0440 \0448\0430\0442)\\)$', '')
 WHERE title ~ U&' \\((\\d+\CC28|Round \\d+|\\d+-\0440 \0448\0430\0442)\\)$';

UPDATE public.audition_translations
   SET title = regexp_replace(title, U&' \\((\\d+\CC28|Round \\d+|\\d+-\0440 \0448\0430\0442)\\)$', '')
 WHERE title ~ U&' \\((\\d+\CC28|Round \\d+|\\d+-\0440 \0448\0430\0442)\\)$';
