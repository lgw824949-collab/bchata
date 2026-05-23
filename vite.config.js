import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

/** .env.local 에 빈 값이 있어도 .env 의 실제 값을 쓰기 위함 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 1) continue
    const key = trimmed.slice(0, idx).trim()
    let val = trimmed.slice(idx + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"'))
      || (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function pickNonempty(...values) {
  for (const v of values) {
    const s = String(v ?? '').trim()
    if (s) return s
  }
  return ''
}

function mergeViteEnv(modeEnv, baseEnv, dotEnv) {
  const pick = (key) => pickNonempty(modeEnv[key], baseEnv[key], dotEnv[key])
  return {
    ...modeEnv,
    VITE_SUPABASE_URL: pick('VITE_SUPABASE_URL'),
    VITE_SUPABASE_ANON_KEY: pick('VITE_SUPABASE_ANON_KEY'),
    VITE_KAKAO_API_KEY: pick('VITE_KAKAO_API_KEY'),
    VITE_PUBLIC_APP_URL: pick('VITE_PUBLIC_APP_URL') || 'https://bchata.vercel.app',
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const cwd = process.cwd()
  const dotEnv = parseEnvFile(path.join(cwd, '.env'))
  const env = mergeViteEnv(loadEnv(mode, cwd, ''), loadEnv('', cwd, ''), dotEnv)

  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-i18next'],
    },
    envPrefix: 'VITE_',
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_KAKAO_API_KEY': JSON.stringify(env.VITE_KAKAO_API_KEY),
      'import.meta.env.VITE_PUBLIC_APP_URL': JSON.stringify(env.VITE_PUBLIC_APP_URL),
    },
    server: {
      host: true,
      port: 1234,
      strictPort: true,
      proxy: {
        '/kma-api': {
          target: 'http://apis.data.go.kr',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/kma-api/, ''),
        },
      },
    },
    preview: {
      host: true,
      port: 1234,
      strictPort: true,
    },
  }
})
