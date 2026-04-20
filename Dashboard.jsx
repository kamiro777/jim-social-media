import { useState, useEffect } from 'react'
import { supabase, CHANNELS, STATUS_COLORS } from '../lib/supabase'

const IG_CHANNELS = ['jim_icg','ketawa','worship']

function getWeekRange(offset = 0) {
  const now = new Date()
  const day = now.getDay() // 0 = Sonntag
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  monday.setHours(0,0,0,0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23,59,59,999)
  return { start: monday, end: sunday }
}

function getTwoWeekRange() {
  const { start } = getWeekRange(1)
  const end = new Date(start)
  end.setDate(start.getDate() + 13)
  end.setHours(23,59,59,999)
  return { start, end }
}

function isOverdue(due_date) {
  if (!due_date) return false
  return new Date(due_date) < new Date(new Date().toDateString())
}

function isThisOrNextWeek(due_date) {
  if (!due_date) return false
  const d = new Date(due_date)
  const { start: thisStart } = getWeekRange(0)
  const { end: nextEnd } = getWeekRange(1)
  return d >= thisStart && d <= nextEnd
}

const RANGE_OPTIONS = [
  { label: 'Diese Woche', key: 'this' },
  { label: 'Nächste Woche', key: 'next' },
  { label: 'Nächste 2 Wochen', key: 'two' },
]

export default function Dashboard({ month }) {
  const [posts, setPosts] = useState([])
  const [todos, setTodos] = useState([])
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [igRange, setIgRange] = useState('this')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [p, t, e] = await Promise.all([
        supabase.from('posts').select('*').eq('month', month),
        supabase.from('todos').select('*').eq('done', false).order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('podcast_episodes').select('*').order('episode_number')
      ])
      setPosts(p.data || [])
      setTodos(t.data || [])
      setEpisodes(e.data || [])
      setLoading(false)
    }
    load()
  }, [month])

  const igPosts = posts.filter(p => IG_CHANNELS.includes(p.channel_id))
  const ytPosts = posts.filter(p => p.channel_id === 'youtube')
  const postedCount = posts.filter(p => p.status === 'Gepostet').length
  const totalCount = posts.length
  const pct = totalCount ? Math.round((postedCount / totalCount) * 100) : 0

  const channelStats = CHANNELS.map(ch => {
    const chPosts = posts.filter(p => p.channel_id === ch.id)
    const done = chPosts.filter(p => p.status === 'Gepostet').length
    return { ...ch, total: chPosts.length, done }
  })

  // Instagram-Kachel: Posts nach gewähltem Zeitraum filtern
  const getIgFiltered = () => {
    return igPosts.filter(p => {
      if (!p.post_date) return false
      const d = new Date(p.post_date)
      if (igRange === 'this') {
        const { start, end } = getWeekRange(0)
        return d >= start && d <= end
      } else if (igRange === 'next') {
        const { start, end } = getWeekRange(1)
        return d >= start && d <= end
      } else {
        const { start } = getWeekRange(1)
        const end = new Date(start)
        end.setDate(start.getDate() + 13)
        return d >= start && d <= end
      }
    })
  }
  const igFiltered = getIgFiltered()

  // To-Dos: überfällig + diese/nächste Woche
  const overdueTodos = todos.filter(t => isOverdue(t.due_date))
  const upcomingTodos = todos.filter(t => !isOverdue(t.due_date) && isThisOrNextWeek(t.due_date))

  const upcomingEpisodes = episodes.filter(e => e.status !== 'Gepostet').slice(0, 3)

  if (loading) return <div className="empty-state"><div className="empty-icon">◈</div>Laden...</div>

  return (
    <div className="stack">
      {/* KPIs */}
      <div className="grid-4">
        <div className="stat-card red">
          <div className="stat-label">INSTAGRAM POSTS</div>
          <div className="stat-value">{igPosts.length}</div>
          <div className="stat-sub">{igPosts.filter(p=>p.status==='Gepostet').length} gepostet</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">YOUTUBE UPLOADS</div>
          <div className="stat-value">{ytPosts.length}</div>
          <div className="stat-sub">{ytPosts.filter(p=>p.status==='Gepostet').length} veröffentlicht</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">PODCAST EPISODEN</div>
          <div className="stat-value">{episodes.length}</div>
          <div className="stat-sub">{episodes.filter(e=>e.status==='Gepostet').length} veröffentlicht</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">OFFENE TO-DOS</div>
          <div className="stat-value">{todos.length}</div>
          <div className="stat-sub">{overdueTodos.length > 0 ? <span style={{color:'var(--red)',fontWeight:600}}>{overdueTodos.length} überfällig</span> : 'alles im Plan ✓'}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="card-title">Monats-Fortschritt — {month}</div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-muted)',marginBottom:8}}>
          <span>{postedCount} von {totalCount} Posts erledigt</span>
          <span style={{color:'var(--green)',fontWeight:600}}>{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{width:`${pct}%`,background:`var(--green)`}}/>
        </div>
        <div style={{display:'flex',gap:12,marginTop:16,flexWrap:'wrap'}}>
          {channelStats.map(ch => (
            <div key={ch.id} style={{display:'flex',alignItems:'center',gap:6,fontSize:11}}>
              <span className={`channel-tag channel-${ch.id}`}>{ch.name}</span>
              <span style={{color:'var(--text-muted)'}}>{ch.done}/{ch.total}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* Instagram-Kachel mit Zeitraum-Filter */}
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
            <div className="card-title" style={{margin:0}}>📸 Instagram Anstehend</div>
            <div style={{display:'flex',gap:4}}>
              {RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setIgRange(opt.key)}
                  className={`btn btn-sm ${igRange === opt.key ? 'btn-primary' : 'btn-ghost'}`}
                  style={{fontSize:10}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {igFiltered.length === 0 && (
            <div style={{color:'var(--text-dim)',fontSize:12}}>Keine Posts in diesem Zeitraum ✓</div>
          )}
          {igFiltered.map(p => (
            <div key={p.id} style={{padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                <div>
                  <div style={{marginBottom:3,fontWeight:500}}>{p.topic}</div>
                  <div style={{fontSize:10,color:'var(--text-dim)',display:'flex',gap:8,flexWrap:'wrap'}}>
                    <span className={`channel-tag channel-${p.channel_id}`}>{p.channel_id}</span>
                    {p.responsible && <span>→ {p.responsible}</span>}
                    {p.format && <span style={{color:'var(--text-dim)'}}>{p.format}</span>}
                  </div>
                </div>
                <div style={{fontSize:10,color:'var(--text-muted)',whiteSpace:'nowrap',textAlign:'right'}}>
                  <div>{p.post_date || '—'}</div>
                  <div style={{color:'var(--text-dim)'}}>{p.status}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* To-Do Übersicht */}
        <div className="card">
          <div className="card-title">📋 To-Do Übersicht</div>

          {overdueTodos.length > 0 && (
            <>
              <div style={{fontSize:11,fontWeight:600,color:'var(--red)',marginBottom:6,marginTop:4}}>⚠️ Überfällig</div>
              {overdueTodos.slice(0, 5).map(t => (
                <div key={t.id} style={{padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
                  <div style={{marginBottom:3}}>{t.task}</div>
                  <div style={{fontSize:10,color:'var(--text-dim)',display:'flex',gap:8,flexWrap:'wrap'}}>
                    {t.channel_id && <span className={`channel-tag channel-${t.channel_id}`}>{t.channel_id}</span>}
                    {t.responsible && <span>→ {t.responsible}</span>}
                    {t.due_date && <span style={{color:'var(--red)',fontWeight:600}}>📅 {t.due_date}</span>}
                  </div>
                </div>
              ))}
            </>
          )}

          {upcomingTodos.length > 0 && (
            <>
              <div style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',marginBottom:6,marginTop:overdueTodos.length > 0 ? 12 : 4}}>Diese & nächste Woche</div>
              {upcomingTodos.slice(0, 5).map(t => (
                <div key={t.id} style={{padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
                  <div style={{marginBottom:3}}>{t.task}</div>
                  <div style={{fontSize:10,color:'var(--text-dim)',display:'flex',gap:8,flexWrap:'wrap'}}>
                    {t.channel_id && <span className={`channel-tag channel-${t.channel_id}`}>{t.channel_id}</span>}
                    {t.responsible && <span>→ {t.responsible}</span>}
                    {t.due_date && <span style={{color:'var(--amber)'}}>📅 {t.due_date}</span>}
                  </div>
                </div>
              ))}
            </>
          )}

          {overdueTodos.length === 0 && upcomingTodos.length === 0 && (
            <div style={{color:'var(--text-dim)',fontSize:12}}>Keine offenen To-Dos diese Woche ✓</div>
          )}
        </div>
      </div>

      {/* Nächste Podcast-Episoden */}
      <div className="card">
        <div className="card-title">🎙 Nächste Podcast-Episoden</div>
        {upcomingEpisodes.length === 0 && <div className="empty-state"><div className="empty-icon">🎙</div>Keine Episoden geplant</div>}
        <table className="data-table">
          {upcomingEpisodes.length > 0 && (
            <thead><tr>
              <th>Ep #</th><th>Gast</th><th>Aufnahme</th><th>Veröffentlichung</th><th>Status</th>
            </tr></thead>
          )}
          <tbody>
            {upcomingEpisodes.map(ep => (
              <tr key={ep.id}>
                <td style={{color:'var(--text-dim)'}}>{ep.episode_number}</td>
                <td style={{fontWeight:600}}>{ep.guest}</td>
                <td style={{color:'var(--text-muted)'}}>{ep.record_date || '—'}</td>
                <td style={{color:'var(--text-muted)'}}>{ep.publish_date || '—'}</td>
                <td><span className={`badge ${ep.status?.toLowerCase().replace(' ','')}`}>{ep.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
