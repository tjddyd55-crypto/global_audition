-- 단일 단계 오디션은 audition_rounds 행이 없다.
-- 합격/불합격 알림을 기존 audition_round_notifications 에 넣으려면 round_id 가 비어야 한다.
-- 기존 다단계 알림 행의 round_id 는 바꾸지 않는다. NULL 이 아닌 값은 라운드 FK 를 그대로 따른다.

ALTER TABLE public.audition_round_notifications
    ALTER COLUMN round_id DROP NOT NULL;

COMMENT ON COLUMN public.audition_round_notifications.round_id IS
    '다단계 알림은 라운드를 가리킨다. 단일 단계 합격/불합격 알림은 라운드가 없어 NULL 이다.';
