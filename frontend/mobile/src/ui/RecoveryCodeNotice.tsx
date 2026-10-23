import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useTranslation } from 'react-i18next'
import { colors, radius } from '../theme/tokens'
import { Button } from './Button'

const LAST_CODE_KEY = 'ga.lastRecoveryCodeCopy'

type Props = {
  recoveryCode: string
  onAcknowledged: () => void
}

export function RecoveryCodeNotice({ recoveryCode, onAcknowledged }: Props) {
  const { t } = useTranslation()
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{t('auth.recoverySaveTitle')}</Text>
      <Text style={styles.body}>{t('auth.recoverySaveBody')}</Text>
      <Text selectable style={styles.code}>
        {recoveryCode}
      </Text>
      <Button
        label={copied ? t('auth.savedOnDevice') : t('auth.saveOnDevice')}
        variant="secondary"
        onPress={async () => {
          await SecureStore.setItemAsync(LAST_CODE_KEY, recoveryCode)
          setCopied(true)
        }}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: saved }}
        onPress={() => setSaved((v) => !v)}
        style={styles.checkRow}
      >
        <View style={[styles.boxMark, saved && styles.boxOn]} />
        <Text style={styles.checkText}>{t('auth.recoveryAck')}</Text>
      </Pressable>
      <Button label={t('auth.continueAfterSave')} disabled={!saved} onPress={onAcknowledged} />
    </View>
  )
}

const styles = StyleSheet.create({
  box: { gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  body: { fontSize: 14, lineHeight: 22, color: colors.muted },
  code: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.purple,
    backgroundColor: colors.heroStart,
    borderRadius: radius.card,
    padding: 16,
  },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  boxMark: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginTop: 2,
  },
  boxOn: { backgroundColor: colors.purple, borderColor: colors.purple },
  checkText: { flex: 1, color: colors.text, lineHeight: 20, fontSize: 14 },
})
