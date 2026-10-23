import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'

type Props = {
  onRetry: () => void
}

export function OfflineScreen({ onRetry }: Props) {
  const { t } = useTranslation()
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('native.offlineTitle')}</Text>
      <Text style={styles.desc}>{t('native.offlineBody')}</Text>
      <TouchableOpacity
        onPress={onRetry}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={t('native.offlineRetry')}
      >
        <Text style={styles.buttonText}>{t('native.offlineRetry')}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  desc: {
    marginTop: 8,
    fontSize: 14,
    color: '#525252',
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0a0a0a',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
})
