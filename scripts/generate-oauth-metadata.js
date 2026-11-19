const fs = require('node:fs')
const path = require('node:path')
const {createOAuthMetadata} = require('../src/state/session/oauth-config.ts')

/**
 * Writes both metadata documents. Native metadata comes from its own origin:
 * atproto requires the private-use redirect scheme to be the client_id
 * hostname in reverse-domain order, so one host is tied to one scheme.
 */
function generateOAuthMetadata(outputDir, options = {}) {
  fs.mkdirSync(outputDir, {recursive: true})
  for (const native of [false, true]) {
    const metadata = createOAuthMetadata({
      baseUrl: native
        ? process.env.EXPO_PUBLIC_OAUTH_NATIVE_BASE_URL ||
          'https://app.puppykitty.racing'
        : process.env.EXPO_PUBLIC_OAUTH_BASE_URL || 'https://witchsky.app',
      clientName: process.env.EXPO_PUBLIC_OAUTH_CLIENT_NAME || 'Purrsky',
      ...options,
      native,
    })
    fs.writeFileSync(
      path.join(
        outputDir,
        native
          ? 'oauth-client-metadata-native.json'
          : 'oauth-client-metadata.json',
      ),
      JSON.stringify(metadata, null, 2) + '\n',
    )
  }
}
module.exports = {generateOAuthMetadata}
if (require.main === module) {
  require('dotenv').config({quiet: true})
  generateOAuthMetadata(path.resolve(__dirname, '../bskyweb/static'))
}
