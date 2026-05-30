'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TAGS } from '@/lib/types'
import { Upload, X } from 'lucide-react'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']
const STAR_DESCS = ['', 'Road menace', 'Poor driver', 'Average', 'Good driver', 'Excellent driver']

function LogForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefill = searchParams.get('plate') || ''

  const [user, setUser] = useState<any>(null)
  const [plate, setPlate] = useState(prefill)
  const [state, setState] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const onDrop = useCallback((files: File[]) => {
    const valid = files.filter(f => f.type.startsWith('image/')).slice(0, 3)
    setPhotos(prev => [...prev, ...valid].slice(0, 3))
    valid.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setPhotoPreviews(prev => [...prev, e.target?.result as string].slice(0, 3))
      reader.readAsDataURL(f)
    })
  }, [])

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  function toggleTag(label: string) {
    setTags(prev => prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!cleanPlate) { setError('Enter a license plate'); return }
    if (!rating) { setError('Pick a star rating'); return }
    if (!user) { router.push('/auth?next=/log'); return }

    setSubmitting(true)
    setError('')

    const sb = createClient()
    const photoUrls: string[] = []

    for (const photo of photos) {
      const ext = photo.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await sb.storage.from('report-photos').upload(path, photo)
      if (!upErr) {
        const { data } = sb.storage.from('report-photos').getPublicUrl(path)
        photoUrls.push(data.publicUrl)
      }
    }

    const { error: insertErr } = await sb.from('reports').insert({
      plate: cleanPlate,
      state: state || null,
      rating,
      tags,
      note: note.trim() || null,
      photo_urls: photoUrls,
      user_id: user.id,
    })

    if (insertErr) { setError(insertErr.message); setSubmitting(false); return }

    router.push(`/plate/${cleanPlate}`)
  }

  return (
    <div style={{ paddingTop: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, lineHeight: 1, marginBottom: 6 }}>LOG A DRIVER</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Your report is shared with everyone and contributes to that plate's permanent karma score.</p>
      </div>

      {!user && (
        <div style={{ background: 'var(--amber-bg)', border: '0.5px solid var(--amber-dim)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '1rem', fontSize: 14, color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Sign in to submit reports</span>
          <button className="btn-primary" style={{ fontSize: 14, padding: '6px 14px' }} onClick={() => router.push('/auth?next=/log')}>Sign in</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 12 }}>
          {/* Plate + State */}
          <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div className="section-label">License plate</div>
              <input className="plate-input" type="text" value={plate} onChange={e => setPlate(e.target.value)} placeholder="ABC-1234" maxLength={10} autoComplete="off" spellCheck={false}
                style={{ background: 'var(--bg3)', border: '0.5px solid var(--border-md)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none', padding: '10px 14px', width: '100%' }} />
            </div>
            <div style={{ width: 100 }}>
              <div className="section-label">State</div>
              <select value={state} onChange={e => setState(e.target.value)}
                style={{ height: 45, background: 'var(--bg3)', border: '0.5px solid var(--border-md)', borderRadius: 'var(--radius-sm)', color: state ? 'var(--text)' : 'var(--text3)', padding: '0 10px', width: '100%', fontFamily: 'var(--font-body)', fontSize: 14 }}>
                <option value="">—</option>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Rating */}
          <div style={{ marginBottom: '1rem' }}>
            <div className="section-label">Rating</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} type="button" className={`star-btn ${(hoverRating || rating) >= v ? 'lit' : ''}`}
                  onMouseEnter={() => setHoverRating(v)} onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(v)}>★</button>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', minHeight: 18 }}>{STAR_DESCS[hoverRating || rating] || 'Tap to rate'}</div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '1rem' }}>
            <div className="section-label">What happened?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {TAGS.map(t => (
                <button key={t.label} type="button" className={`tag ${tags.includes(t.label) ? 'selected' : ''}`} onClick={() => toggleTag(t.label)}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: '1rem' }}>
            <div className="section-label">Note <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="What happened? Location, time, anything notable…"
              style={{ background: 'var(--bg3)', border: '0.5px solid var(--border-md)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 14, padding: '9px 12px', width: '100%', resize: 'vertical', outline: 'none' }} />
          </div>

          {/* Photo upload */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="section-label">Photos <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(up to 3)</span></div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px dashed var(--border-md)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', cursor: 'pointer', color: 'var(--text2)', fontSize: 14, transition: 'all 0.12s' }}>
              <Upload size={16} />Upload photos
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => onDrop(Array.from(e.target.files || []))} />
            </label>
            {photoPreviews.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {photoPreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} alt="" style={{ width: 90, height: 68, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border)' }} />
                    <button type="button" onClick={() => removePhoto(i)} style={{ position: 'absolute', top: -6, right: -6, background: 'var(--red)', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{error}</div>}

          <button className="btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function LogPage() {
  return (
    <Suspense>
      <LogForm />
    </Suspense>
  )
}
