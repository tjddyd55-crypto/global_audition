const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const messageRoot = path.resolve(projectRoot, '../web/messages')

const config = getDefaultConfig(projectRoot)
config.watchFolders = [...(config.watchFolders ?? []), messageRoot]
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  '@messages': messageRoot,
}

module.exports = config
