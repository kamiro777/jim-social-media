import { useState, useEffect } from 'react'
import { supabase, CHANNELS, STATUS_COLORS } from '../lib/supabase'

export default function Dashboard({ month }) {
  const [posts, setPosts] = useState([])
  const [todos, setTodos] = useState([])
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [p, t, e] = await Promise.all([
        supabase.from('posts').select('*').eq('month', month),
        supabase.from('todos').select('*').eq('month', month).eq('done', false),
        supabase.from('podcast_episodes').select('*').order('episode_number')
      ])
      setPosts(p.data || [])
      setTodos(t.data || [])
      setEpisodes(e.data || [])
      setLoading(false)
    }
    load()
  }, [month])

  const igPosts = posts.filter(p => ['jim_icg','ketawa'].includes(p.channel_id))
  const ytPosts = posts.filter(p => p.channel_id === 'youtube')
  const postedCount = posts.filter(p => p.status === 'Gepostet').length
  const totalCount = posts.length
  const pct = totalCount ? Math.round((postedCount / totalCount) * 100) : 0

  const channelStats = CHANNELS.map(ch => {
    const chPosts = posts.filter(p => p.channel_id === ch.id)
    const done = chPosts.filter(p => p.status === 'Gepostet').length
    return { ...ch, total: chPosts.length, done }
  })

  const urgentTodos = todos.filter(t => t.priority === 'Dringend').slice(0, 5)
  const weekTodos = todos.filter(t => t.priority === 'Diese Woche').slice(0, 5)

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
          <div className="stat-sub">{urgentTodos.length} dringend</div>
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
        {/* Dringende To-Dos */}
        <div className="card">
          <div className="card-title">🔴 Dringend</div>
          {urgentTodos.length === 0 && <div style={{color:'var(--text-dim)',fontSize:12}}>Keine dringenden Aufgaben ✓</div>}
          {urgentTodos.map(t => (
            <div key={t.id} style={{padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
              <div style={{marginBottom:3}}>{t.task}</div>
              <div style={{fontSize:10,color:'var(--text-dim)',display:'flex',gap:8}}>
                {t.channel_id && <span className={`channel-tag channel-${t.channel_id}`}>{t.channel_id}</span>}
                {t.responsible && <span>→ {t.responsible}</span>}
                {t.due_date && <span style={{color:'var(--red)'}}>{t.due_date}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Diese Woche */}
        <div className="card">
          <div className="card-title">🟡 Diese Woche</div>
          {weekTodos.length === 0 && <div style={{color:'var(--text-dim)',fontSize:12}}>Nichts offen ✓</div>}
          {weekTodos.map(t => (
            <div key={t.id} style={{padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
              <div style={{marginBottom:3}}>{t.task}</div>
              <div style={{fontSize:10,color:'var(--text-dim)',display:'flex',gap:8}}>
                {t.channel_id && <span className={`channel-tag channel-${t.channel_id}`}>{t.channel_id}</span>}
                {t.responsible && <span>→ {t.responsible}</span>}
              </div>
            </div>
          ))}
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
