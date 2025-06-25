import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { vuestic } from '@vuestic/compiler/vite'

// ✅ 중복 프록시 설정 경로 배열
const proxyPaths = [
  'product',
  'common-codes',
  'equipments',
  'equipment-inspection',
  'material',
  'bom',
  'process',
  'processG',
  'processDetail',
  'inspections',
  'api',
  'lines',
  'packages',
  'account',
  'order',
  'orders',
  'defects',
  'materialLot',
  'materialLotList',
  'orderCheck',
  'mrps',
  'puOrder',
  'purchase',
  'workOrder',
  'prodPlan',
  'purchaseCheck',
  'delivery',
  'deliveryCheck',
  'receiveQty',
  'qualityTest',
  'uploads',
  'prodResult',
  'qualitys',
  'productInbound',
  'processCheck',
  'equipment',
  'prodResultDetail',
  'eqStatus',
  'prodResultStop',
  'eqStop',
  'prodEnd',
  'productOutbound',
  'workResultStatus',
  'processInit',
  'materialOutbound',
  'endEq',
  'qualityInsertList'
]

// ✅ 공통 proxy 설정 생성 함수
const createProxy = (paths: string[]) =>
  Object.fromEntries(
    paths.map((path) => [
      `/${path}`,
      {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p: string) => p.replace(new RegExp(`^/${path}`), `/${path}`)
      }
    ])
  )

export default defineConfig({
  build: {
    sourcemap: true
  },
  server: {
    proxy: createProxy(proxyPaths)
  },
  resolve: {
    alias: {
      '@': resolve(dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
  plugins: [
    vuestic({
      devtools: true,
      cssLayers: true
    }),
    vue(),
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(import.meta.url)), './src/i18n/locales/**')
    })
  ]
})
  