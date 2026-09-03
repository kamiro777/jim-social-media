import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, CHANNELS } from '../lib/supabase'

const IG_CHANNELS = ['jim_icg', 'ketawa', 'worship']

// Ermittelt Zielroute + Aufgaben-Id, um vom Dashboard direkt zum
// bearbeitbaren Eintrag im jeweiligen Untermenü zu springen.
function targetFor(item) {
  if (item.type === 'todo') return { path: '/todos', openId: item.rawId }
  if (item.type === 'episode') return { path: '/podcast', openId: item.rawId }
  if (item.channel_id === 'youtube') return { path: '/youtube', openId: item.rawId }
  if (IG_CHANNELS.includes(item.channel_id)) return { path: '/instagram', openId: item.rawId }
  return null
}

const RANGE_OPTIONS = [
  { key: 'day', label: 'Heute' },
  { key: 'week', label: 'Diese Woche' },
  { key: 'month', label: 'Dieser Monat' },
]

function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function endOfDay(d) { const x = new Date(d); x.setHours(23,59,59,999); return x }

function getWeekRange(offset = 0) {
  const now = new Date()
  const day = now.getDay() // 0 = Sonntag
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  return { start: startOfDay(monday), end: endOfDay(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)) }
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < startOfDay(new Date())
}

// Prüft, ob ein Datum im gewählten Zeitraum liegt. "month" filtert auf den
// in der Sidebar gewählten Monat, "day"/"week" beziehen sich immer auf heute.
function inRange(dateStr, rangeKey, month) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (rangeKey === 'day') {
    return d >= startOfDay(new Date()) && d <= endOfDay(new Date())
  }
  if (rangeKey === 'week') {
    const { start, end } = getWeekRange(0)
    return d >= start && d <= end
  }
  // month
  const [y, m] = month.split('-').map(Number)
  return d.getFullYear() === y && d.getMonth() + 1 === m
}

const CHANNEL_BY_ID = Object.fromEntries(CHANNELS.map(c => [c.id, c]))

function ChannelTag({ channelId }) {
  const ch = CHANNEL_BY_ID[channelId]
  return <span className={`channel-tag channel-${channelId || 'team'}`}>{ch ? ch.name : 'Team'}</span>
}

function ListRow({ item, onOpen }) {
  const clickable = !!targetFor(item)
  return (
    <div
      onClick={clickable ? () => onOpen(item) : undefined}
      style={{
        padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 12,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 3, fontWeight: 500 }}>{item.title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <ChannelTag channelId={item.channel_id} />
            {item.responsible && <span>→ {item.responsible}</span>}
            {item.meta && <span>{item.meta}</span>}
          </div>
        </div>
        <div style={{ fontSize: 10, color: item.overdue ? 'var(--red)' : 'var(--text-muted)', whiteSpace: 'nowrap', textAlign: 'right', fontWeight: item.overdue ? 600 : 400 }}>
          <div>{item.date}</div>
          <div style={{ color: item.overdue ? 'var(--red)' : 'var(--text-dim)' }}>{item.overdue ? 'ÜBERFÄLLIG' : item.status}</div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ month }) {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [todos, setTodos] = useState([])
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('week')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [p, t, e] = await Promise.all([
        supabase.from('posts').select('*').neq('status', 'Gepostet'),
        supabase.from('todos').select('*').eq('done', false),
        supabase.from('podcast_episodes').select('*').neq('status', 'Gepostet'),
      ])
      setPosts(p.data || [])
      setTodos(t.data || [])
      setEpisodes(e.data || [])
      setLoading(false)
    }
    load()
    window.addEventListener('jim:refresh', load)
    return () => window.removeEventListener('jim:refresh', load)
  }, [])

  // Alle Kanäle zu einer einheitlichen Liste zusammenführen
  const items = [
    ...posts.map(p => ({
      id: `post-${p.id}`, rawId: p.id, type: 'post', date: p.post_date, title: p.topic,
      channel_id: p.channel_id, responsible: p.responsible, status: p.status,
      meta: p.format || null,
    })),
    ...todos.map(t => ({
      id: `todo-${t.id}`, rawId: t.id, type: 'todo', date: t.due_date, title: t.task,
      channel_id: t.channel_id, responsible: t.responsible, status: 'Offen',
      meta: null,
    })),
    ...episodes.map(e => ({
      id: `ep-${e.id}`, rawId: e.id, type: 'episode', date: e.publish_date || e.record_date, title: `Ep ${e.episode_number || '—'} · ${e.guest}`,
      channel_id: 'podcast', responsible: e.responsible, status: e.status,
      meta: e.publish_date ? null : 'Aufnahme',
    })),
  ].map(item => ({ ...item, overdue: isOverdue(item.date) }))

  const undated = items.filter(i => !i.date)
  const overdue = items.filter(i => i.overdue).sort((a, b) => a.date.localeCompare(b.date))
  const filtered = items
    .filter(i => !i.overdue && inRange(i.date, range, month))
    .sort((a, b) => a.date.localeCompare(b.date))

  const openItem = (item) => {
    const target = targetFor(item)
    if (target) navigate(target.path, { state: { openId: target.openId } })
  }

  if (loading) return <div className="empty-state"><div className="empty-icon">◈</div>Laden...</div>

  return (
    <div className="stack">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div className="card-title" style={{ margin: 0 }}>Was steht an — alle Kanäle</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setRange(opt.key)}
                className={`btn btn-sm ${range === opt.key ? 'btn-primary' : 'btn-ghost'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {overdue.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>⚠️ Überfällig ({overdue.length})</div>
            {overdue.map(item => <ListRow key={item.id} item={item} onOpen={openItem} />)}
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '14px 0 4px' }}>
              {RANGE_OPTIONS.find(o => o.key === range)?.label}
            </div>
          </>
        )}

        {filtered.length === 0 && (
          <div style={{ color: 'var(--text-dim)', fontSize: 12, padding: '4px 0' }}>Nichts Anstehendes in diesem Zeitraum ✓</div>
        )}
        {filtered.map(item => <ListRow key={item.id} item={item} onOpen={openItem} />)}

        {undated.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '14px 0 4px' }}>Ohne Termin</div>
            {undated.map(item => <ListRow key={item.id} item={item} onOpen={openItem} />)}
          </>
        )}
      </div>
    </div>
  )
}
