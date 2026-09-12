export function buildTossCheckoutHtml(input: {
  clientKey: string
  orderId: string
  orderName: string
  amount: number
  currency: string
  successUrl: string
  failUrl: string
  method?: string
  foreignEasyPayProvider?: string
  variantKey?: string
}): string {
  const payload = JSON.stringify({
    clientKey: input.clientKey,
    orderId: input.orderId,
    orderName: input.orderName,
    amount: input.amount,
    currency: input.currency || 'USD',
    successUrl: input.successUrl,
    failUrl: input.failUrl,
    method: input.method || 'FOREIGN_EASY_PAY',
    foreignEasyPayProvider: input.foreignEasyPayProvider || 'PAYPAL',
    variantKey: input.variantKey || '',
  })
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Toss Checkout</title>
  <script src="https://js.tosspayments.com/v2/standard"></script>
</head>
<body>
  <p id="status">Opening checkout…</p>
  <script>
    const cfg = ${payload};
    (async function () {
      try {
        const tossPayments = TossPayments(cfg.clientKey);
        const payment = tossPayments.payment({ customerKey: cfg.orderId });
        const req = {
          method: cfg.method,
          amount: { currency: cfg.currency, value: cfg.amount },
          orderId: cfg.orderId,
          orderName: cfg.orderName,
          successUrl: cfg.successUrl,
          failUrl: cfg.failUrl,
          foreignEasyPay: { provider: cfg.foreignEasyPayProvider },
        };
        if (cfg.variantKey) req.variantKey = cfg.variantKey;
        await payment.requestPayment(req);
      } catch (e) {
        document.getElementById('status').textContent = e && e.message ? e.message : 'Checkout error';
      }
    })();
  </script>
</body>
</html>`
}
