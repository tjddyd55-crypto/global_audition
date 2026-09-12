import { ALL_CATEGORY_SENTINEL, isAllCategoryName } from '../allCategorySentinel'

describe('allCategorySentinel', () => {
  it('treats the backend all-category token as a sentinel, not UI copy', () => {
    expect(ALL_CATEGORY_SENTINEL).toBe('전체')
    expect(isAllCategoryName(ALL_CATEGORY_SENTINEL)).toBe(true)
    expect(isAllCategoryName('All', 'All')).toBe(true)
    expect(isAllCategoryName('Vocal', 'All')).toBe(false)
  })
})
