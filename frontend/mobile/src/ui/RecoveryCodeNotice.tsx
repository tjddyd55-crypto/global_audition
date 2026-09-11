import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { colors, radius } from '../theme/tokens'
import { Button } from './Button'

const LAST_CODE_KEY = 'ga.lastRecoveryCodeCopy'

type Props = {
  recoveryCode: string
  onAcknowledged: () => void
}

export function RecoveryCodeNotice({ recoveryCode, onAcknowledged }: Props) {
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  return (
    <View style={styles.box}>
      <Text style={styles.title}>복구 보안 코드를 저장하세요</Text>
      <Text style={styles.body}>
        이 코드는 지금 한 번만 보여 줍니다. 비밀번호를 잊었을 때 계정 확인과 재설정에 사용합니다. 서버는 해시만 보관하며 이전
        비밀번호는 절대 돌려주지 않습니다.
      </Text>
      <Text selectable style={styles.code}>
        {recoveryCode}
      </Text>
      <Button
        label={copied ? '기기에 임시 저장됨' : '기기에 임시 저장'}
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
        <Text style={styles.checkText}>안전한 곳에 코드를 저장했고, 다시 볼 수 없음을 이해했습니다.</Text>
      </Pressable>
      <Button label="확인 후 계속" disabled={!saved} onPress={onAcknowledged} />
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
