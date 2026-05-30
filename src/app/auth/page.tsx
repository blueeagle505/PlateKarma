'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    setLoading(true)
    const sb = createClient()
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1, marginBottom: 8 }}>JOIN THE</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, color: 'var(--amber)', lineHeight: 1, marginBottom: '1.5rem' }}>COMMUNITY</div>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: '2rem', lineHeight: 1.6 }}>
          Sign in to submit reports, track your contributions, and help keep roads accountable.
        </p>

        <div className="card" style={{ textAlign: 'left', marginBottom: '1rem' }}>
          <button onClick={signInWithGoogle} disabled={loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 20px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border-md)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', opacity: loading ? 0.7 : 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>
        </div>

        {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}

        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: '1rem' }}>
          By signing in you agree to only report factual observations. Abuse will result in account removal.
        </p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return <Suspense><AuthForm /></Suspense>
}
