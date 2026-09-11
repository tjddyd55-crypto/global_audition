export function buildTossCheckoutHtml(input: {
  clientKey: string
  orderId: string
  orderName: string
  amount: number
  currency: string
  successUrl: string
  failUrl: string
}): string {
  const payload = JSON.stringify({
    clientKey: input.clientKey,
    orderId: input.orderId,
    orderName: input.orderName,
    amount: input.amount,
    currency: input.currency || 'USD',
    successUrl: input.successUrl,
    failUrl: input.failUrl,
  })
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Toss Checkout</title>
  <script src="https://js.tosspayments.com/v2/standard"></script>
</head>
<body>
  <p id="status">결제창을 여는 중…</p>
  <script>
    const cfg = ${payload};
    (async function () {
      try {
        const tossPayments = TossPayments(cfg.clientKey);
        const payment = tossPayments.payment({ customerKey: cfg.orderId });
        await payment.requestPayment({
          method: 'CARD',
          amount: { currency: cfg.currency, value: cfg.amount },
          orderId: cfg.orderId,
          orderName: cfg.orderName,
          successUrl: cfg.successUrl,
          failUrl: cfg.failUrl,
        });
      } catch (e) {
        document.getElementById('status').textContent = e && e.message ? e.message : '결제창 오류';
      }
    })();
  </script>
</body>
</html>`
}
