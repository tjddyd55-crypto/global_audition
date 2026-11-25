import { matchingSignupCountries } from '../signupCountries'
const countries = [{ code: 'NP', name: '네팔', englishName: 'Nepal' }, { code: 'KR', name: '대한민국', englishName: 'South Korea' }]
it('finds an Other country by localized name, English name or normalized code', () => {
  for (const query of ['네팔', 'Nepal', 'np', 'ＮＰ']) expect(matchingSignupCountries(countries, query)).toEqual([countries[0]])
  expect(matchingSignupCountries(countries, '')).toEqual([])
  expect(matchingSignupCountries(countries, 'made-up-country')).toEqual([])
})
