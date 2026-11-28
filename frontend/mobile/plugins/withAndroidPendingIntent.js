const fs = require('node:fs')
const path = require('node:path')
const { withDangerousMod } = require('expo/config-plugins')

const original = [
  '  override fun onNewIntent(intent: Intent?): Boolean {',
  '    if (!loadAppReady.isCompleted) {',
  '      return false',
  '    }',
].join('\n')

const patched = [
  '  override fun onNewIntent(intent: Intent?): Boolean {',
  '    if (loadAppReady.isCompleted) return dispatchPendingNewIntent(intent)',
  '    activity.lifecycleScope.launch {',
  '      loadAppReady.await()',
  '      dispatchPendingNewIntent(intent)',
  '    }',
  '    return true',
  '  }',
  '',
  '  private fun dispatchPendingNewIntent(intent: Intent?): Boolean {',
].join('\n')

module.exports = function withAndroidPendingIntent(config) {
  return withDangerousMod(config, ['android', async config => {
    // Expo can receive a notification tap before expo-updates has started React.
    const projectRoot = config.modRequest.projectRoot
    const expoRoot = path.dirname(require.resolve('expo/package.json', { paths: [projectRoot] }))
    const wrapper = path.join(expoRoot, 'android/src/main/java/expo/modules/ReactActivityDelegateWrapper.kt')
    const source = fs.readFileSync(wrapper, 'utf8').replace(/\r\n/g, '\n')
    if (source.includes(patched)) return config
    if (!source.includes(original)) {
      throw new Error('Expo onNewIntent changed. Recheck whether the Android pending-intent patch is still needed.')
    }
    fs.writeFileSync(wrapper, source.replace(original, patched), 'utf8')
    return config
  }])
}

