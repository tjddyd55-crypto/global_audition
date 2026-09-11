-- Option A: 정산 금액은 정수 USD 달러(major unit). 센트/소수/float 금지.
-- Toss amount.value 와 1:1. 소수 행이 있으면 마이그레이션을 실패시켜 조용한 반올림을 막는다.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.credit_packages WHERE price IS NULL OR price <> trunc(price) OR price < 1) THEN
        RAISE EXCEPTION 'credit_packages.price must already be whole USD dollars >= 1 before V43';
    END IF;
    IF EXISTS (SELECT 1 FROM public.payment_orders WHERE amount IS NULL OR amount <> trunc(amount) OR amount < 1) THEN
        RAISE EXCEPTION 'payment_orders.amount must already be whole USD dollars >= 1 before V43';
    END IF;
END $$;

ALTER TABLE public.credit_packages
    ALTER COLUMN price TYPE BIGINT USING trunc(price)::bigint;

ALTER TABLE public.payment_orders
    ALTER COLUMN amount TYPE BIGINT USING trunc(amount)::bigint;

ALTER TABLE public.credit_packages
    DROP CONSTRAINT IF EXISTS credit_packages_price_whole_usd;
ALTER TABLE public.credit_packages
    ADD CONSTRAINT credit_packages_price_whole_usd CHECK (price >= 1);

ALTER TABLE public.payment_orders
    DROP CONSTRAINT IF EXISTS payment_orders_amount_whole_usd;
ALTER TABLE public.payment_orders
    ADD CONSTRAINT payment_orders_amount_whole_usd CHECK (amount >= 1);

COMMENT ON COLUMN public.credit_packages.price IS 'Whole USD dollars (integer major-unit). Toss amount.value uses this number.';
COMMENT ON COLUMN public.payment_orders.amount IS 'Whole USD dollars (integer major-unit). Confirm amount equals this number.';
