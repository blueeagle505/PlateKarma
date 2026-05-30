'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/')
  }

  const links = [
    { href: '/',            label: 'Look Up' },
    { href: '/log',         label: 'Log Driver' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ]

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(12,11,9,0.92)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid var(--border)', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
      <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.02em', color: 'var(--amber)', textDecoration: 'none' }}>
        Plate<span style={{ color: 'var(--text2)' }}>Karma</span>
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {links.map(l => (
          <a key={l.href} href={l.href}
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 14, color: pathname === l.href ? 'var(--amber)' : 'var(--text2)', background: pathname === l.href ? 'var(--amber-bg)' : 'none', textDecoration: 'none', transition: 'all 0.12s' }}>
            {l.label}
          </a>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--amber-bg)', border: '0.5px solid var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                : <User size={14} color="var(--amber)" />}
            </div>
            <button onClick={signOut} className="btn-ghost" style={{ padding: '5px 10px', fontSize: 13 }}>
              <LogOut size={13} />Sign out
            </button>
          </>
        ) : (
          <a href="/auth" className="btn-primary" style={{ padding: '7px 16px', fontSize: 14, textDecoration: 'none' }}>Sign in</a>
        )}
      </div>
    </nav>
  )
}
