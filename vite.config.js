import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

/** 로컬 dev·preview 전용 — 다른 포트 사용 금지 */
const LOCAL_DEV_PORT = 1234

const REACT_VENDOR_CHUNK = 'vendor-react'

/** Vite 8(rolldown)이 react를 jsx-runtime 청크와 메인에 이중 번들하면 useContext null 크래시 */
function isReactVendorModule(id) {
  return (
    /node_modules[/\\]react[/\\]/.test(id)
    || /node_modules[/\\]react-dom[/\\]/.test(id)
    || /node_modules[/\\]scheduler[/\\]/.test(id)
    || /node_modules[/\\]react[/\\]jsx-runtime/.test(id)
    || /node_modules[/\\]react[/\\]jsx-dev-runtime/.test(id)
  )
}

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

function mergeViteEnv(modeEnv, baseEnv, dotEnv, dotEnvLocal) {
  const pick = (key) => pickNonempty(modeEnv[key], baseEnv[key], dotEnvLocal[key], dotEnv[key])
  return {
    ...modeEnv,
    VITE_SUPABASE_URL: pick('VITE_SUPABASE_URL'),
    VITE_SUPABASE_ANON_KEY: pick('VITE_SUPABASE_ANON_KEY'),
    VITE_KAKAO_API_KEY: pick('VITE_KAKAO_API_KEY'),
    VITE_PUBLIC_APP_URL: pick('VITE_PUBLIC_APP_URL') || 'https://bchata.vercel.app',
  }
}

const ADMIN_DB_ALLOWED_TABLES = new Set(['instructor_classes', 'instructors', 'festivals', 'bootcamps'])

/** dev: .vite/deps 캐시 무효화·504 시 브라우저가 낡은 청크를 붙잡지 않게 (dev:hmr 전용) */
function devDepsFreshPlugin() {
  return {
    name: 'dev-deps-fresh',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.includes('/node_modules/.vite/deps/')) {
          res.setHeader('Cache-Control', 'no-store, must-revalidate')
        }
        next()
      })
    },
  }
}

/** 로컬 dev·preview에서 /api/admin-db (Vercel serverless 대체) */
function adminDbDevPlugin(getServerEnv) {
  const attach = (middlewares) => {
    middlewares.use('/api/admin-db', (req, res, next) => {
      if (req.method !== 'POST') return next()
      const chunks = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', async () => {
        const send = (status, body) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        try {
          const env = getServerEnv()
          const expectedSecret = env.ADMIN_API_SECRET
          const raw = Buffer.concat(chunks).toString('utf8')
          const body = raw ? JSON.parse(raw) : {}
          const providedSecret = req.headers['x-admin-secret'] || body.adminSecret || ''
          if (!expectedSecret || providedSecret !== expectedSecret) {
            send(401, { error: 'Unauthorized' })
            return
          }
          const url = pickNonempty(env.SUPABASE_URL, env.VITE_SUPABASE_URL)
          const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
          if (!url || !serviceKey) {
            send(500, { error: 'Server missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL' })
            return
          }
          const { table, action, id, payload } = body
          if (!ADMIN_DB_ALLOWED_TABLES.has(table)) {
            send(400, { error: 'Invalid table' })
            return
          }
          if (!id) {
            send(400, { error: 'Missing id' })
            return
          }
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(url, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
          if (action === 'update') {
            const { data, error } = await supabase
              .from(table)
              .update(payload || {})
              .eq('id', id)
              .select()
              .maybeSingle()
            if (error) {
              send(400, { error: error.message })
              return
            }
            if (!data) {
              send(400, { error: 'No row updated' })
              return
            }
            send(200, { data })
            return
          }
          if (action === 'delete') {
            const { data, error } = await supabase.from(table).delete().eq('id', id).select('id')
            if (error) {
              send(400, { error: error.message })
              return
            }
            if (!data?.length) {
              send(400, { error: 'No row deleted' })
              return
            }
            send(200, { data })
            return
          }
          send(400, { error: 'Invalid action' })
        } catch (err) {
          send(500, { error: err?.message || 'Server error' })
        }
      })
    })
  }
  return {
    name: 'admin-db-dev',
    configureServer(server) {
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      attach(server.middlewares)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const cwd = process.cwd()
  const dotEnv = parseEnvFile(path.join(cwd, '.env'))
  const dotEnvLocal = parseEnvFile(path.join(cwd, '.env.local'))
  const env = mergeViteEnv(loadEnv(mode, cwd, ''), loadEnv('', cwd, ''), dotEnv, dotEnvLocal)
  const pickServer = (key) => pickNonempty(
    process.env[key],
    loadEnv(mode, cwd, '')[key],
    dotEnvLocal[key],
    dotEnv[key],
  )
  const localAdminSecret = pickServer('ADMIN_API_SECRET') || '^^dlwlsdn1052181818'

  return {
    plugins: [
      react(),
      devDepsFreshPlugin(),
      adminDbDevPlugin(() => ({
        ADMIN_API_SECRET: localAdminSecret,
        SUPABASE_SERVICE_ROLE_KEY: pickServer('SUPABASE_SERVICE_ROLE_KEY'),
        SUPABASE_URL: pickServer('SUPABASE_URL'),
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
      })),
    ],
    build: {
      target: 'es2020',
      cssTarget: 'chrome80',
      modulePreload: { polyfill: true },
      rolldownOptions: {
        output: {
          manualChunks(id) {
            if (isReactVendorModule(id)) return REACT_VENDOR_CHUNK
          },
        },
      },
    },
    optimizeDeps: {
      entries: ['src/main.jsx'],
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
        'framer-motion',
        'lucide-react',
        'react-i18next',
        'i18next',
      ],
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-i18next'],
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
      port: LOCAL_DEV_PORT,
      strictPort: true,
      warmup: {
        clientFiles: ['./src/main.jsx', './src/App.jsx'],
      },
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
      port: LOCAL_DEV_PORT,
      strictPort: true,
    },
  }
})
