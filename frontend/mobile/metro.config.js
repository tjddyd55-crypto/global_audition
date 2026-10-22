const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const messageRoot = path.resolve(projectRoot, '../web/messages')
const sharedI18nRoot = path.resolve(projectRoot, '../web/src/shared/i18n')
const sharedAuditionRoot = path.resolve(projectRoot, '../web/src/shared/audition')

const config = getDefaultConfig(projectRoot)
config.watchFolders = [...(config.watchFolders ?? []), messageRoot, sharedI18nRoot, sharedAuditionRoot]
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  '@messages': messageRoot,
}

module.exports = config
