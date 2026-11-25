import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../../api/endpoints'
import { TextField } from '../../ui/TextField'
import { Button } from '../../ui/Button'
import { colors, radius } from '../../theme/tokens'
import { scriptLineHeight } from '../../i18n/typography'
import { COUNTRY_CODES } from '../../../../web/src/shared/utils/countries'
import { matchingSignupCountries } from '../../../../web/src/shared/auth/signupCountries'

export function SignupCountrySelect({ label, value, onChange }: { label: string; value: string; onChange: (code: string) => void }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [other, setOther] = useState(false)
  const [query, setQuery] = useState('')
  const locale = i18n.language.split('-')[0]
  const countries = useQuery({ queryKey: ['signup-countries', locale], queryFn: () => authApi.signupCountries(locale), enabled: other || Boolean(value && !COUNTRY_CODES.includes(value as typeof COUNTRY_CODES[number])), staleTime: Infinity })
  const options = countries.data ?? []
  const matches = matchingSignupCountries(options, query)
  const tall = { lineHeight: scriptLineHeight(locale, 15, 24) }
  const selected = options.find((country) => country.code === value)
  const custom = other || (value && !COUNTRY_CODES.includes(value as typeof COUNTRY_CODES[number]))

  return <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} style={styles.select} testID="signup-country-select">
      <Text style={[styles.value, tall]}>{custom ? t('register.otherCountry') : value ? t(`countries.${value}`) : t('register.selectCountry')}</Text><Text>▾</Text>
    </Pressable>
    {custom ? <View style={styles.wrap}>
      <TextField label={t('register.otherCountryName')} value={query} placeholder={t('register.countrySearchPlaceholder')} onChangeText={(text) => {
        setQuery(text)
        const exact = options.find((country) => [country.code, country.name, country.englishName].some((name) => name.toLocaleLowerCase() === text.trim().toLocaleLowerCase()))
        onChange(exact?.code ?? '')
      }} />
      {countries.isLoading ? <Text style={styles.label}>{t('common.loading')}</Text> : countries.isError ? <Button variant="secondary" label={t('common.retry')} onPress={() => void countries.refetch()} /> : null}
      {!selected && matches.slice(0, 8).map((country) => <Pressable key={country.code} accessibilityRole="button" onPress={() => { setQuery(country.name); onChange(country.code) }} style={styles.option}>
        <Text style={[styles.value, tall]}>{country.name} ({country.code})</Text>
      </Pressable>)}
      <Text style={[styles.label, { lineHeight: scriptLineHeight(locale, 13, 20) }]}>{selected ? `${selected.name} (${selected.code})` : query && !countries.isLoading && !countries.isError && matches.length === 0 ? t('register.countryNotFound') : t('register.countryChooseResult')}</Text>
    </View> : null}
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={[styles.title, tall]}>{label}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            {COUNTRY_CODES.map((code) => <Pressable key={code} accessibilityRole="button" accessibilityState={{ selected: value === code && !custom }} style={styles.option} onPress={() => { setOther(false); setQuery(''); onChange(code); setOpen(false) }}>
              <Text style={[styles.value, tall]}>{t(`countries.${code}`)}</Text>
            </Pressable>)}
            <Pressable accessibilityRole="button" style={styles.option} onPress={() => { setOther(true); onChange(''); setOpen(false) }}><Text style={[styles.value, tall]}>{t('register.otherCountry')}</Text></Pressable>
          </ScrollView>
          <Button label={t('common.close')} variant="secondary" onPress={() => setOpen(false)} />
        </View>
      </SafeAreaView>
    </Modal>
  </View>
}

const styles = StyleSheet.create({
  wrap: { gap: 6 }, label: { color: colors.muted, fontSize: 13 },
  select: { minHeight: 44, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.input, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface },
  value: { flex: 1, fontSize: 15, color: colors.text },
  overlay: { flex: 1, backgroundColor: '#11182766', justifyContent: 'center', padding: 20 },
  dialog: { maxHeight: '85%', backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 12 },
  title: { fontWeight: '700', fontSize: 16, color: colors.text },
  option: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
})
