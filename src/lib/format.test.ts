import { describe, expect, it } from 'vitest'
import { convertQty, formatMoney, formatQty } from './format'

describe('formatMoney', () => {
  it('formats whole rupee amounts without decimals', () => {
    expect(formatMoney(12500)).toMatch(/12,500$/)
    expect(formatMoney(12500)).not.toContain('.00')
  })

  it('keeps paisa when present', () => {
    expect(formatMoney('99.5')).toMatch(/99\.50$/)
  })

  it('treats null as zero', () => {
    expect(formatMoney(null)).toMatch(/0$/)
  })
})

describe('formatQty', () => {
  it('appends the unit and trims trailing zeros', () => {
    expect(formatQty('12.500', 'L')).toBe('12.5 L')
  })
})

describe('convertQty', () => {
  it('converts trays to pieces exactly', () => {
    expect(convertQty('2.5', 30).toString()).toBe('75')
  })

  it('avoids binary floating point error', () => {
    expect(convertQty('0.1', 3).toString()).toBe('0.3')
  })
})
