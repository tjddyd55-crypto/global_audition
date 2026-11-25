export type SignupCountry = { code: string; name: string; englishName: string }

export function matchingSignupCountries(countries: SignupCountry[], text: string): SignupCountry[] {
  const query = text.trim().normalize('NFKC').toLocaleLowerCase()
  if (!query) return []
  return countries.filter((country) => [country.code, country.name, country.englishName]
    .some((value) => value.normalize('NFKC').toLocaleLowerCase().includes(query)))
    .sort((a, b) => Number(b.code.toLowerCase() === query) - Number(a.code.toLowerCase() === query))
}
