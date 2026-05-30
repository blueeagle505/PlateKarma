'use client'
import { useEffect, useState } from 'react'

let _setToast: ((msg: string) => void) | null = null
export function toast(msg: string) { _setToast?.(msg) }

export function Toaster() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    _setToast = (m: string) => {
      setMsg(m)
      setVisible(true)
      setTimeout(() => setVisible(false), 2500)
    }
    return () => { _setToast = null }
  }, [])

  if (!visible) return null

  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--text)', color: 'var(--bg)', fontSize: 14, fontWeight: 500, padding: '10px 20px', borderRadius: 999, zIndex: 9999, whiteSpace: 'nowrap', animation: 'fadeUp 0.2s ease' }}>
      {msg}
    </div>
  )
}
