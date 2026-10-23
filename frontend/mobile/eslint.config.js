const expoConfig = require('eslint-config-expo/flat')

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist', 'dist-export', 'node_modules', '.expo', 'android', 'ios'],
  },
]
