import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://rpbheglnhnpytxiunyij.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_NwBTuzxgBKee6tOg0WttNA_wIdFeZD8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const CHANNELS = [
  { id: 'jim_icg', name: '@jim_icg', platform: 'Instagram', color: '#E94560', emoji: '🔴' },
  { id: 'ketawa', name: '@JIM Ketawa', platform: 'Instagram', color: '#0F3460', emoji: '🔵' },
  { id: 'youtube', name: 'YouTube', platform: 'YouTube', color: '#2E8B57', emoji: '🟢' },
  { id: 'podcast', name: 'Podcast', platform: 'Podcast', color: '#533483', emoji: '🟣' },
  { id: 'worship', name: 'JIM Worship', platform: 'Instagram', color: '#B8860B', emoji: '🟡' },
]

export const TEAM = ['Karlo', 'Bryan', 'Arella', 'Kati', 'Yola', 'Joshua Jantz', 'Josua Ua']

export const FORMATS = ['Reel', 'Post', 'Carousel', 'Story', 'Audiogram', 'Livestream', 'Video']
export const STATUSES = ['Offen', 'In Arbeit', 'Bereit', 'Gepostet']
export const STATUS_COLORS = {
  'Offen': '#E94560',
  'In Arbeit': '#F59E0B',
  'Bereit': '#3B82F6',
  'Gepostet': '#10B981',
}
export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

// Leitet den Monats-Filterwert ("YYYY-MM") aus einem echten Datum ab, statt ihn
// getrennt zu pflegen — verhindert, dass month und post_date/due_date auseinanderlaufen.
// Ohne Datum (z.B. eine Idee ohne Termin) bleibt der aktuell gewählte Sidebar-Monat als Fallback.
export function deriveMonth(dateStr, fallbackMonth) {
  return dateStr ? dateStr.slice(0, 7) : fallbackMonth
}
