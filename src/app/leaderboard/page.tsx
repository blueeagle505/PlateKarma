'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcKarma, gradeFromKarma, karmaColor, MIN_REVIEWS_FOR_LEADERBOARD } from '@/lib/types'

type Mode = 'worst' | 'best' | 'most'

type PlateRow = {
  plate: string
  state: string | null
  report_count: number
  avg_rating: number
  karma: number
  grade: string
  karmaText: string
}

export default function LeaderboardPage() {
  const [mode, setMode] = useState<Mode>('worst')
  const [rows, setRows] = useState<PlateRow[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setLoading(true)
    const sb = createClient()
    sb.from('reports').select('plate, state, rating').then(({ data }) => {
      if (!data) { setLoading(false); return }

      // Aggregate by plate (ignoring state for grouping simplicity)
      const agg: Record<string, { ratings: number[]; state: string | null }> = {}
      data.forEach(r => {
        if (!agg[r.plate]) agg[r.plate] = { ratings: [], state: r.state }
        agg[r.plate].ratings.push(r.rating)
      })

      const rows: PlateRow[] = Object.entries(agg)
        .filter(([, v]) => v.ratings.length >= MIN_REVIEWS_FOR_LEADERBOARD)
        .map(([plate, v]) => {
          const avg = v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length
          const karma = calcKarma(avg, v.ratings.length)
          const { text } = karmaColor(karma)
          return { plate, state: v.state, report_count: v.ratings.length, avg_rating: avg, karma, grade: gradeFromKarma(karma), karmaText: text }
        })

      setRows(rows)
      setLoading(false)
    })
  }, [])

  const sorted = [...rows].sort((a, b) => {
    if (mode === 'worst') return a.karma - b.karma
    if (mode === 'best') return b.karma - a.karma
    return b.report_count - a.report_count
  }).slice(0, 25)

  const tabs: { id: Mode; label: string; emoji: string }[] = [
    { id: 'worst', label: 'Hall of Shame', emoji: '💀' },
    { id: 'best',  label: 'Hall of Fame',  emoji: '🏆' },
    { id: 'most',  label: 'Most Reported', emoji: '📊' },
  ]

  return (
    <div style={{ paddingTop: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, lineHeight: 1, marginBottom: 6 }}>LEADERBOARD</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>
          Only plates with {MIN_REVIEWS_FOR_LEADERBOARD}+ community reports appear here. No single-report callouts.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setMode(t.id)}
            style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: '0.5px solid', borderColor: mode === t.id ? 'var(--amber-dim)' : 'var(--border-md)', background: mode === t.id ? 'var(--amber-bg)' : 'none', color: mode === t.id ? 'var(--amber)' : 'var(--text2)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer', transition: 'all 0.12s' }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', padding: '3rem 0', textAlign: 'center' }} className="pulsing">Loading real community data…</div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text2)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--text3)', marginBottom: 12 }}>EMPTY</div>
          <p>No plates have {MIN_REVIEWS_FOR_LEADERBOARD}+ reports yet.</p>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>Keep reporting — the leaderboard fills up fast.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((row, i) => {
            const medal = i === 0 ? (mode === 'worst' ? '💀' : '🏆') : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`
            return (
              <div key={row.plate} className="card fade-up" onClick={() => router.push(`/plate/${row.plate}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color 0.12s' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text3)', minWidth: 32 }}>{medal}</div>
                <div>
                  <div className="plate-display">{row.plate}</div>
                  {row.state && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{row.state}</div>}
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{row.report_count} reports · {row.avg_rating.toFixed(1)}★</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: row.karmaText }}>{row.karma}<span style={{ fontSize: 13, color: 'var(--text3)' }}>/100</span></div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
