import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import './index.css'
import './styles/home-dark-gate.css'
import i18n from './i18n'
import App from './App.jsx'

const rootEl = document.getElementById('root')

function showBootError(message) {
  if (!rootEl) return
  rootEl.innerHTML =
    '<div style="padding:24px;font-family:system-ui,sans-serif;max-width:360px;margin:0 auto">' +
    '<p style="font-weight:700;margin:0 0 8px">앱을 불러오지 못했습니다</p>' +
    '<p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5">' +
    String(message).replace(/</g, '&lt;') +
    '</p>' +
    '<button type="button" onclick="location.reload()" style="padding:12px 20px;border:0;border-radius:8px;background:#FF1744;color:#fff;font-weight:700">다시 시도</button>' +
    '</div>'
}

if (!rootEl) {
  console.error('[boot] #root missing')
} else {
  try {
    createRoot(rootEl).render(
      <StrictMode>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </StrictMode>,
    )
    try {
      sessionStorage.removeItem('bchata:boot-recover')
      sessionStorage.removeItem('bchata:vite-deps-reload')
    } catch { /* ignore */ }
  } catch (err) {
    console.error('[boot] render failed:', err)
    showBootError(err?.message || '알 수 없는 오류')
  }
}

function tryAutoRecoverBootError(message) {
  const msg = String(message || '')
  if (!msg.includes('Outdated Optimize Dep') && !msg.includes('useContext')) return false
  try {
    const key = 'bchata:boot-recover'
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
    location.reload()
    return true
  } catch {
    return false
  }
}

window.addEventListener('error', (e) => {
  if (tryAutoRecoverBootError(e.message)) return
  if (rootEl && !rootEl.childElementCount) {
    showBootError(e.message || '스크립트 오류')
  }
})
window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.message || String(e.reason || '로딩 실패')
  if (tryAutoRecoverBootError(msg)) return
  if (rootEl && !rootEl.childElementCount) {
    showBootError(msg)
  }
})
