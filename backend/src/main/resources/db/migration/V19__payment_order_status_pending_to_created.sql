SET search_path TO public;

-- Java enum: PENDING → CREATED (주문 생성 직후). READY는 PG/목 결제 요청 준비 완료.
UPDATE public.payment_orders
SET status = 'CREATED'
WHERE status = 'PENDING';
