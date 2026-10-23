import fs from 'fs'
import path from 'path'

describe('native credit checkout policy', () => {
  it('does not launch an external payment gateway', () => {
    const source = fs.readFileSync(path.join(__dirname, '../../../app/credits/checkout.tsx'), 'utf8')
    expect(source).not.toContain('buildTossCheckoutHtml')
    expect(source).not.toContain('TOSS_PAYMENTS')
    expect(source).not.toContain('paypal')
    expect(source).toContain('iapNotice')
  })
})