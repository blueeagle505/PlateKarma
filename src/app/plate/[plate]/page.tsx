'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcKarma, gradeFromKarma, karmaColor, TAGS, MIN_REVIEWS_FOR_LEADERBOARD } from '@/lib/types'
import { Share2, Plus, ExternalLink } from 'lucide-react'
import Image from 'next/image'

function timeAgo(ts: string) {
  const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function PlatePage() {
  const { plate } = useParams<{ plate: string }>()
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [aiProfile, setAiProfile] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '')

  useEffect(() => {
    const sb = createClient()
    sb.from('reports')
      .select('*, profiles(username, avatar_url)')
      .ilike('plate', cleanPlate)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports(data || [])
        setLoading(false)
      })
  }, [cleanPlate])

  useEffect(() => {
    if (!reports.length || aiProfile !== null) return
    setAiLoading(true)
    const tagCount: Record<string, number> = {}
    reports.forEach(r => (r.tags || []).forEach((t: string) => tagCount[t] = (tagCount[t] || 0) + 1))
    const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t).join(', ')
    const avg = reports.reduce((a, b) => a + b.rating, 0) / reports.length
    const karma = calcKarma(avg, reports.length)

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: `You are PlateKarma's AI analyst. Write a witty, specific 2-sentence driver profile based on community data. Punchy and funny, not cruel.\n\nPlate: ${cleanPlate}\nKarma: ${karma}/100\nAvg rating: ${avg.toFixed(1)}/5\nTop behaviors: ${topTags || 'none'}\nReport count: ${reports.length}\n\nOnly the 2-sentence bio.` }]
      })
    }).then(r => r.json()).then(d => {
      setAiProfile(d.content?.find((b: any) => b.type === 'text')?.text || null)
      setAiLoading(false)
    }).catch(() => setAiLoading(false))
  }, [reports])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text2)' }}>
      <div className="pulsing">Looking up {cleanPlate}…</div>
    </div>
  )

  if (!reports.length) return (
    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 72, color: 'var(--text3)', marginBottom: '1rem' }}>🍀</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 8 }}>NO REPORTS FOR</div>
      <div className="plate-display" style={{ fontSize: 24, display: 'inline-block', marginBottom: '1.5rem' }}>{cleanPlate}</div>
      <p style={{ color: 'var(--text2)', marginBottom: '1.5rem' }}>This plate has a spotless record — for now.</p>
      <button className="btn-primary" onClick={() => router.push(`/log?plate=${cleanPlate}`)}>
        <Plus size={16} /> Be the first to report
      </button>
    </div>
  )

  const avg = reports.reduce((a, b) => a + b.rating, 0) / reports.length
  const karma = calcKarma(avg, reports.length)
  const grade = gradeFromKarma(karma)
  const { text: karmaText, bg: karmaBg } = karmaColor(karma)
  const incidents = reports.filter(r => r.rating <= 2).length

  const tagCount: Record<string, number> = {}
  reports.forEach(r => (r.tags || []).forEach((t: string) => tagCount[t] = (tagCount[t] || 0) + 1))
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const stateGroups = [...new Set(reports.map(r => r.state).filter(Boolean))]

  function copyReport() {
    navigator.clipboard.writeText(`PlateKarma: ${cleanPlate} — Karma ${karma}/100 (Grade ${grade})\nBased on ${reports.length} community report${reports.length !== 1 ? 's' : ''}.\nhttps://platekarma.app/plate/${cleanPlate}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fade-up" style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 500, letterSpacing: '0.12em', color: 'var(--text)', lineHeight: 1, marginBottom: 6 }}>{cleanPlate}</div>
            {stateGroups.length > 0 && <div style={{ fontSize: 12, color: 'var(--text3)', letterSpacing: '0.08em' }}>{stateGroups.join(' · ')}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 8, background: karmaBg, fontFamily: 'var(--font-display)', fontSize: 28, color: karmaText, marginBottom: 4 }}>{grade}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: karmaText, lineHeight: 1 }}>{karma}</div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)' }}>Karma score</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: '1rem' }}>
          {[
            { n: reports.length, l: 'Reports' },
            { n: avg.toFixed(1) + '★', l: 'Avg rating' },
            { n: incidents, l: 'Incidents' },
          ].map(s => (
            <div key={s.l} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text)' }}>{s.n}</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text3)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tags */}
        {topTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1rem' }}>
            {topTags.map(([t, c]) => {
              const tagDef = TAGS.find(td => td.label === t)
              return (
                <span key={t} className={`tag ${tagDef?.positive ? 'good-tag' : c >= 2 ? 'bad-tag' : ''}`}>
                  {tagDef?.emoji} {t}{c > 1 ? ` ×${c}` : ''}
                </span>
              )
            })}
          </div>
        )}

        {/* AI Bio */}
        {(aiLoading || aiProfile) && (
          <div style={{ borderLeft: '2px solid var(--amber-dim)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', padding: '10px 14px', background: 'var(--amber-bg)', marginBottom: '1rem', fontSize: 14, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.6 }}>
            <div style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontStyle: 'normal', marginBottom: 5 }}>🤖 AI Driver Profile</div>
            {aiLoading ? <span className="pulsing">Generating profile…</span> : aiProfile}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={copyReport}>
            <Share2 size={13} />{copied ? 'Copied!' : 'Share report'}
          </button>
          <button className="btn-ghost" onClick={() => router.push(`/log?plate=${cleanPlate}`)}>
            <Plus size={13} />Add report
          </button>
        </div>
      </div>

      {/* Leaderboard eligibility notice */}
      {reports.length < MIN_REVIEWS_FOR_LEADERBOARD && (
        <div style={{ background: 'var(--amber-bg)', border: '0.5px solid var(--amber-dim)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--amber)', marginBottom: 12 }}>
          {MIN_REVIEWS_FOR_LEADERBOARD - reports.length} more report{MIN_REVIEWS_FOR_LEADERBOARD - reports.length !== 1 ? 's' : ''} needed before this plate appears on the leaderboard.
        </div>
      )}

      {/* Timeline */}
      <div className="section-label" style={{ marginBottom: 10 }}>Incident timeline</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {reports.map(r => (
          <div key={r.id} className="card fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--amber)', fontSize: 13 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>{timeAgo(r.created_at)}</span>
              {r.profiles?.username && (
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>by {r.profiles.username}</span>
              )}
            </div>
            {(r.tags || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {r.tags.map((t: string) => <span key={t} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'var(--surface2)', color: 'var(--text2)' }}>{t}</span>)}
              </div>
            )}
            {r.note && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{r.note}</div>}
            {(r.photo_urls || []).length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {r.photo_urls.map((url: string) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt="Report photo" style={{ width: 100, height: 75, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border)' }} />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
