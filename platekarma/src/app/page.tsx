'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

function timeAgo(ts: string) {
  const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

function RecentReports() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const sb = createClient()
      sb.from('reports').select('id, plate, state, rating, tags, created_at').order('created_at', { ascending: false }).limit(6)
        .then(({ data }) => { setReports(data || []); setLoading(false) })
    })
  }, [])

  if (loading) return <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading…</div>
  if (!reports.length) return <div style={{ color: 'var(--text3)', fontSize: 13 }}>No reports yet. Be the first!</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {reports.map(r => (
        <a key={r.id} href={`/plate/${r.plate}`} style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <span className="plate-display">{r.plate}</span>
            {r.state && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{r.state}</span>}
            <span style={{ color: 'var(--amber)', fontSize: 13 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
              {(r.tags || []).slice(0, 3).map((t: string) => (
                <span key={t} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'var(--surface2)', color: 'var(--text2)' }}>{t}</span>
              ))}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{timeAgo(r.created_at)}</span>
          </div>
        </a>
      ))}
    </div>
  )
}

export default function HomePage() {
  const [plate, setPlate] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (clean) router.push(`/plate/${clean}`)
  }

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '4rem 0 3rem' }}>
        <div style={{ display: 'inline-block', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--amber)', background: 'var(--amber-bg)', border: '0.5px solid var(--amber-dim)', borderRadius: 999, padding: '4px 14px', marginBottom: '1.5rem' }}>
          THE ROAD'S REPUTATION SYSTEM
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(60px, 13vw, 100px)', lineHeight: 0.9, letterSpacing: '0.01em', marginBottom: '1rem' }}>
          EVERY PLATE<br /><span style={{ color: 'var(--amber)' }}>HAS A KARMA.</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text2)', maxWidth: 420, margin: '0 auto 2.5rem' }}>
          Look up any license plate to see its real community driving record — built by drivers like you.
        </p>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto' }}>
          <input className="plate-input" type="text" value={plate} onChange={e => setPlate(e.target.value)} placeholder="ABC-1234" maxLength={10} autoComplete="off" spellCheck={false} style={{ flex: 1, background: 'var(--bg3)', border: '0.5px solid var(--border-md)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none', padding: '10px 14px' }} />
          <button className="btn-primary" type="submit"><Search size={16} />Search</button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '3rem' }}>
        {[
          { step: '01', title: 'See a bad (or great) driver', desc: 'Note their plate while on the road.' },
          { step: '02', title: 'Log a report', desc: 'Rate them, tag the behavior, add a photo. 30 seconds.' },
          { step: '03', title: 'Build their karma', desc: 'Plates with 3+ reviews appear on the leaderboard.' },
        ].map(item => (
          <div className="card" key={item.step}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--border-hi)', lineHeight: 1, marginBottom: 8 }}>{item.step}</div>
            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: '2rem' }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Recent community reports</div>
        <RecentReports />
      </div>
    </div>
  )
}
