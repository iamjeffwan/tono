import { mergeConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import baseConfig from '../../vite.config'

export default mergeConfig(baseConfig, {
  root: fileURLToPath(new URL('../../', import.meta.url)),
  cacheDir: fileURLToPath(new URL('../../../../output/home-prototype/vite-cache', import.meta.url)),
})
