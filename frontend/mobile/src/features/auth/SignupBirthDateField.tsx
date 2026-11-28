import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Keyboard, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, radius } from '../../theme/tokens'
import { Button } from '../../ui/Button'

type Props = { value: string; onChange: (date: string) => void }

function localDateString(date: Date) {
  const formatPart = (part: number) => String(part).padStart(2, '0')
  return [date.getFullYear(), formatPart(date.getMonth() + 1), formatPart(date.getDate())].join('-')
}

export function SignupBirthDateField({ value, onChange }: Props) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Date | null>(null)
  const today = new Date()
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())

  const openCalendar = () => {
    Keyboard.dismiss()
    const initial = value ? new Date(value + 'T12:00:00') : new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        display: 'calendar',
        minimumDate: minDate,
        maximumDate: today,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(localDateString(date))
        },
      })
    } else {
      setDraft(initial)
    }
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{t('register.birthday')} *</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t('register.pickBirthDate')}
        accessibilityValue={{ text: value }} testID="signup-birth-date" style={styles.button} onPress={openCalendar}>
        <Text style={[styles.value, !value && styles.placeholder]}>{value || t('register.pickBirthDate')}</Text>
      </Pressable>
      {draft && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade" onRequestClose={() => setDraft(null)}>
          <View style={styles.backdrop}>
            <View style={styles.dialog} accessibilityViewIsModal>
              <DateTimePicker mode="date" display="inline" value={draft}
                minimumDate={minDate} maximumDate={today}
                onChange={(_, date) => { if (date) setDraft(date) }} />
              <View style={styles.actions}>
                <Button variant="secondary" label={t('common.cancel')} onPress={() => setDraft(null)} />
                <Button label={t('common.confirm')} onPress={() => {
                  onChange(localDateString(draft))
                  setDraft(null)
                }} />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  button: {
    minHeight: 48, justifyContent: 'center', paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.button, backgroundColor: colors.surface,
  },
  value: { color: colors.text, fontSize: 15 },
  placeholder: { color: colors.muted },
  backdrop: { flex: 1, justifyContent: 'center', backgroundColor: '#0008', padding: 16 },
  dialog: { backgroundColor: colors.surface, borderRadius: radius.button, padding: 14, alignSelf: 'center', maxWidth: '100%' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
})
