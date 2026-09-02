import { useState, useEffect, Fragment } from 'react'
import { supabase, FORMATS, STATUSES, WEEKDAYS } from '../lib/supabase'

const TEAM = ['Alle','Karlo','Bryan','Arella','Kati','Yola','Joshua Jantz','Josua Ua']
const IG_CHANNELS = [
  { id: 'jim_icg', name: '@jim_icg' },
  { id: 'ketawa', name: '@JIM Ketawa' },
  { id: 'worship', name: 'JIM Worship' },
]
const empty = { month:'', channel_id:'jim_icg', post_date:'', weekday:'Montag', format:'Reel', topic:'', responsible:'Team', shoot_date:'', shooting_done:false, editing_done:false, caption_done:false, thumbnail_done:false, status:'Offen', notes:'' }

export default function Instagram({ month }) {
  const [posts, setPosts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...empty, month })
  const [editId, setEditId] = useState(null)
  const [filterCh, setFilterCh] = useState('all')
  const [filterResponsible, setFilterResponsible] = useState('all')
  const [expandedRows, setExpandedRows] = useState({})

  const load = async () => {
    const { data } = await supabase.from('posts').select('*')
      .eq('month', month).in('channel_id', ['jim_icg','ketawa','worship']).order('post_date')
    setPosts(data || [])
  }
  useEffect(() => { load() }, [month])

  const save = async () => {
    if (!form.topic) return
    const payload = { ...form, month }
    const { error } = editId
      ? await supabase.from('posts').update(payload).eq('id', editId)
      : await supabase.from('posts').insert(payload)
    if (error) { alert('Fehler beim Speichern: ' + error.message); return }
    setShowModal(false); setEditId(null); setForm({ ...empty, month }); load()
  }
  const del = async (id) => {
    if (!confirm('Post löschen?')) return
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) { alert('Fehler beim Löschen: ' + error.message); return }
    load()
  }
  const toggleCheck = async (post, field) => {
    const { error } = await supabase.from('posts').update({ [field]: !post[field] }).eq('id', post.id)
    if (error) { alert('Fehler beim Speichern: ' + error.message); return }
    load()
  }
  const setStatus = async (id, status) => {
    const { error } = await supabase.from('posts').update({ status }).eq('id', id)
    if (error) { alert('Fehler beim Speichern: ' + error.message); return }
    load()
  }
  const openEdit = (post) => { setForm({ ...post }); setEditId(post.id); setShowModal(true) }
  const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))

  const filtered = posts
    .filter(p => filterCh === 'all' || p.channel_id === filterCh)
    .filter(p => filterResponsible === 'all' || p.responsible === filterResponsible)

  const isPosted = (post) => post.status === 'Gepostet'

  return (
    <div className="stack">
      {/* Filter + Add */}
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {['all', ...IG_CHANNELS.map(c => c.id)].map(ch => (
            <button key={ch} onClick={() => setFilterCh(ch)} className={`btn btn-sm ${filterCh === ch ? 'btn-primary' : 'btn-ghost'}`}>
              {ch === 'all' ? 'Alle Kanäle' : IG_CHANNELS.find(c => c.id === ch)?.name || ch}
            </button>
          ))}
        </div>
        <div style={{flex:1}}/>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm({ ...empty, month }); setEditId(null); setShowModal(true) }}>
          + Post
        </button>
      </div>

      {/* Filter Verantwortlich */}
      <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:11,color:'var(--text-dim)',marginRight:4}}>Verantwortlich:</span>
        {TEAM.map(name => (
          <button
            key={name}
            onClick={() => setFilterResponsible(name === 'Alle' ? 'all' : name)}
            className={`btn btn-sm ${(name === 'Alle' ? filterResponsible === 'all' : filterResponsible === name) ? 'btn-primary' : 'btn-ghost'}`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid-3">
        {IG_CHANNELS.map(ch => {
          const chp = posts.filter(p => p.channel_id === ch.id)
          const done = chp.filter(p => p.status === 'Gepostet').length
          return (
            <div key={ch.id} className="stat-card" style={{padding:'12px 14px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <span className={`channel-tag channel-${ch.id}`}>{ch.name}</span>
                <span style={{fontSize:11,color:'var(--text-muted)'}}>{done}/{chp.length}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width:`${chp.length ? Math.round(done/chp.length*100) : 0}%`, background:'var(--green)'}}/>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabelle */}
      {filtered.length === 0 && <div className="empty-state"><div className="empty-icon">◉</div>Keine Posts gefunden.</div>}

      {filtered.length > 0 && (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Kanal</th>
                <th>Format</th>
                <th>Thema</th>
                <th>Verantwortlich</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(post => {
                const posted = isPosted(post)
                const expanded = expandedRows[post.id]
                return (
                  <Fragment key={post.id}>
                    <tr
                      style={{
                        opacity: posted ? 0.45 : 1,
                        transition: 'opacity 0.2s',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleRow(post.id)}
                    >
                      <td style={{fontSize:11,color:'var(--text-muted)',whiteSpace:'nowrap'}}>
                        {post.post_date || '—'}
                        {post.weekday && <span style={{color:'var(--text-dim)',marginLeft:4}}>· {post.weekday}</span>}
                      </td>
                      <td>
                        <span className={`channel-tag channel-${post.channel_id}`}>
                          {IG_CHANNELS.find(c => c.id === post.channel_id)?.name || post.channel_id}
                        </span>
                      </td>
                      <td style={{fontSize:11,color:'var(--text-muted)'}}>{post.format}</td>
                      <td style={{fontWeight: posted ? 400 : 500, textDecoration: posted ? 'line-through' : 'none', color: posted ? 'var(--text-dim)' : 'inherit'}}>
                        {post.topic}
                      </td>
                      <td style={{fontSize:11,color:'var(--text-muted)'}}>{post.responsible || '—'}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          value={post.status}
                          onChange={e => setStatus(post.id, e.target.value)}
                          style={{background:'transparent',border:'none',color:'var(--text-muted)',fontSize:11,cursor:'pointer',fontFamily:'var(--font-mono)'}}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{display:'flex',gap:4}}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(post)}>✎</button>
                          <button className="btn btn-danger btn-sm" onClick={() => del(post.id)}>×</button>
                        </div>
                      </td>
                    </tr>

                    {/* Aufgeklappte Unteraufgaben */}
                    {expanded && (
                      <tr style={{background:'var(--bg2)',opacity: posted ? 0.45 : 1}}>
                        <td colSpan={7} style={{padding:'10px 16px'}}>
                          <div style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
                            {[['shooting_done','🎬 Shoot'],['editing_done','✂️ Edit'],['caption_done','📝 Caption'],['thumbnail_done','🖼 Thumb']].map(([field, label]) => (
                              <div
                                key={field}
                                className="check"
                                onClick={(e) => { e.stopPropagation(); toggleCheck(post, field) }}
                                style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}
                              >
                                <div className={`check-box ${post[field] ? 'checked' : ''}`}/>
                                <span style={{fontSize:11,color: post[field] ? 'var(--green)' : 'var(--text-muted)'}}>{label}</span>
                              </div>
                            ))}
                            {post.shoot_date && (
                              <span style={{fontSize:10,color:'var(--purple)',marginLeft:'auto'}}>📸 Shooting: {post.shoot_date}</span>
                            )}
                            {post.notes && (
                              <span style={{fontSize:10,color:'var(--text-dim)'}}>{post.notes}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-drag"/>
            <div className="modal-title">{editId ? 'Post bearbeiten' : 'Neuer Instagram-Post'}</div>
            <div className="stack" style={{gap:12}}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kanal</label>
                  <select className="form-select" value={form.channel_id} onChange={e => setForm(f => ({...f, channel_id: e.target.value}))}>
                    {IG_CHANNELS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Format</label>
                  <select className="form-select" value={form.format} onChange={e => setForm(f => ({...f, format: e.target.value}))}>
                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Thema / Idee *</label>
                <input className="form-input" value={form.topic} onChange={e => setForm(f => ({...f, topic: e.target.value}))} placeholder="z.B. Sonntagsimpuls – Clip vom 04.05." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Post-Datum</label>
                  <input className="form-input" type="date" value={form.post_date} onChange={e => setForm(f => ({...f, post_date: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Wochentag</label>
                  <select className="form-select" value={form.weekday} onChange={e => setForm(f => ({...f, weekday: e.target.value}))}>
                    {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Shooting-Datum</label>
                  <input className="form-input" type="date" value={form.shoot_date} onChange={e => setForm(f => ({...f, shoot_date: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Verantwortlich</label>
                  <select className="form-select" value={form.responsible} onChange={e => setForm(f => ({...f, responsible: e.target.value}))}>
                    {TEAM.filter(t => t !== 'Alle').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notizen</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Optionale Notizen..." />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={save}>{editId ? 'Speichern' : 'Hinzufügen'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
