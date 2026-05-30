export type Report = {
  id: string
  created_at: string
  plate: string
  state: string | null
  rating: number
  tags: string[]
  note: string | null
  photo_urls: string[]
  user_id: string
  profiles?: { username: string | null; avatar_url: string | null }
}

export type PlateStats = {
  plate: string
  state: string | null
  report_count: number
  avg_rating: number
  karma: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  incident_count: number
  top_tags: { tag: string; count: number }[]
}

export type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  report_count: number
  created_at: string
}

export const TAGS = [
  { label: 'Cut me off',      emoji: '✂️',  positive: false },
  { label: 'Tailgating',      emoji: '🚀',  positive: false },
  { label: 'On phone',        emoji: '📱',  positive: false },
  { label: 'Ran red light',   emoji: '🛑',  positive: false },
  { label: 'Bad parking',     emoji: '🅿️',  positive: false },
  { label: 'No turn signal',  emoji: '🙄',  positive: false },
  { label: 'Weaving lanes',   emoji: '🐍',  positive: false },
  { label: 'Road rage',       emoji: '😤',  positive: false },
  { label: 'Super slow',      emoji: '🐢',  positive: false },
  { label: 'Loud music',      emoji: '🔊',  positive: false },
  { label: 'Let me merge',    emoji: '✅',  positive: true  },
  { label: 'Great driver',    emoji: '👍',  positive: true  },
  { label: 'Helped me',       emoji: '⚡',  positive: true  },
]

export function calcKarma(avgRating: number, count: number): number {
  const base = ((avgRating - 1) / 4) * 100
  const confidence = Math.min(count, 10)
  const adj = base > 50 ? confidence : -confidence
  return Math.round(Math.max(0, Math.min(100, base + adj)))
}

export function gradeFromKarma(k: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (k >= 80) return 'A'
  if (k >= 65) return 'B'
  if (k >= 50) return 'C'
  if (k >= 35) return 'D'
  return 'F'
}

export function karmaColor(k: number) {
  if (k >= 65) return { text: '#4ade80', bg: 'rgba(74,222,128,0.12)' }
  if (k >= 50) return { text: '#fbbf24', bg: 'rgba(251,191,36,0.12)' }
  if (k >= 35) return { text: '#fb923c', bg: 'rgba(251,146,60,0.12)' }
  return { text: '#f87171', bg: 'rgba(248,113,113,0.12)' }
}

export const MIN_REVIEWS_FOR_LEADERBOARD = 3
