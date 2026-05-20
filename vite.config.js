import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function withSupabaseFallback(env, baseEnv) {
  const url = (env.VITE_SUPABASE_URL || baseEnv.VITE_SUPABASE_URL || '').trim()
  const key = (env.VITE_SUPABASE_ANON_KEY || baseEnv.VITE_SUPABASE_ANON_KEY || '').trim()
  return { ...env, VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = withSupabaseFallback(loadEnv(mode, process.cwd(), ''), loadEnv('', process.cwd(), ''))

  return {
  plugins: [react()],
  envPrefix: 'VITE_',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
  },
  server: {
    port: 1234,
    proxy: {
      '/kma-api': {
        target: 'http://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kma-api/, '')
      }
    }
  },
  }
})
