import { useState, useEffect } from 'react'
import { supabase, FORMATS, STATUSES, WEEKDAYS } from '../lib/supabase'

const TEAM = ['Karlo','Bryan','Arella','Kati','Yola','Joshua Jantz','Josua Ua']
const IG_CHANNELS = [
  { id: 'jim_icg', name: '@jim_icg' },
  { id: 'ketawa', name: '@JIM Ketawa' },
  { id: 'worship', name: 'JIM Worship' },
]

const emptyPost = { month:'', channel_id:'jim_icg', post_date:'', weekday:'Montag', format:'Reel', topic:'', responsible:'Team', shoot_date:'', shooting_done:false, editing_done:false, caption_done:false, thumbnail_done:false, status:'Offen', notes:'' }

export default function Instagram({ month }) {
  const [posts, setPosts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...emptyPost, month })
  const [editId, setEditId] = useState(null)
  const [filterCh, setFilterCh] = useState('all')

  const load = async () => {
    const { data } = await supabase.from('posts').select('*')
      .eq('month', month).in('channel_id', ['jim_icg','ketawa','worship'])
      .order('post_date')
    setPosts(data || [])
  }

  useEffect(() => { load() }, [month])

  const save = async () => {
    if (!form.topic) return
    const payload = { ...form, month }
    if (editId) {
      await supabase.from('posts').update(payload).eq('id', editId)
    } else {
      await supabase.from('posts').insert(payload)
    }
    setShowModal(false); setEditId(null); setForm({ ...emptyPost, month }); load()
  }

  const del = async (id) => {
    if (!confirm('Post löschen?')) return
    await supabase.from('posts').delete().eq('id', id); load()
  }

  const toggleCheck = async (post, field) => {
    await supabase.from('posts').update({ [field]: !post[field] }).eq('id', post.id); load()
  }

  const setStatus = async (id, status) => {
    await supabase.from('posts').update({ status }).eq('id', id); load()
  }

  const openEdit = (post) => {
    setForm({ ...post }); setEditId(post.id); setShowModal(true)
  }

  const filtered = filterCh === 'all' ? posts : posts.filter(p => p.channel_id === filterCh)

  const Check = ({ post, field, label }) => (
    <div className="check tooltip" data-tip={label} onClick={() => toggleCheck(post, field)}>
      <div className={`check-box ${post[field] ? 'checked' : ''}`}/>
    </div>
  )

  return (
    <div className="stack">
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:4}}>
          {['all',...IG_CHANNELS.map(c=>c.id)].map(ch => (
            <button key={ch} onClick={()=>setFilterCh(ch)}
              className={`btn btn-sm ${filterCh===ch?'btn-primary':'btn-ghost'}`}>
              {ch === 'all' ? 'Alle' : IG_CHANNELS.find(c=>c.id===ch)?.name || ch}
            </button>
          ))}
        </div>
        <div style={{flex:1}}/>
        <button className="btn btn-primary btn-sm" onClick={()=>{setForm({...emptyPost,month});setEditId(null);setShowModal(true)}}>
          + Post hinzufügen
        </button>
      </div>

      {/* Stats row */}
      <div className="grid-3">
        {IG_CHANNELS.map(ch => {
          const chPosts = posts.filter(p=>p.channel_id===ch.id)
          const done = chPosts.filter(p=>p.status==='Gepostet').length
          return (
            <div key={ch.id} className="stat-card" style={{padding:'14px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <span className={`channel-tag channel-${ch.id}`}>{ch.name}</span>
                <span style={{fontSize:11,color:'var(--text-muted)'}}>{done}/{chPosts.length}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width:`${chPosts.length?Math.round(done/chPosts.length*100):0}%`,background:'var(--green)'}}/>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table className="data-table">
          <thead><tr>
            <th>Datum</th><th>Tag</th><th>Kanal</th><th>Format</th><th>Thema / Idee</th>
            <th>Shooting</th><th>🎬</th><th>✂️</th><th>📝</th><th>🖼</th>
            <th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={12} style={{textAlign:'center',padding:32,color:'var(--text-dim)'}}>
                Noch keine Posts — füge deinen ersten hinzu!
              </td></tr>
            )}
            {filtered.map(post => (
              <tr key={post.id}>
                <td style={{color:'var(--text-muted)',fontSize:11}}>{post.post_date || '—'}</td>
                <td style={{fontSize:11,color:'var(--text-dim)'}}>{post.weekday || '—'}</td>
                <td><span className={`channel-tag channel-${post.channel_id}`}>{IG_CHANNELS.find(c=>c.id===post.channel_id)?.name || post.channel_id}</span></td>
                <td style={{fontSize:11}}>{post.format}</td>
                <td style={{maxWidth:220}}>
                  <div style={{fontWeight:500,fontSize:12}}>{post.topic}</div>
                  {post.responsible && <div style={{fontSize:10,color:'var(--text-dim)'}}>{post.responsible}</div>}
                  {post.shoot_date && <div style={{fontSize:10,color:'var(--purple)'}}>📸 {post.shoot_date}</div>}
                </td>
                <td><Check post={post} field="shooting_done" label="Shooting"/></td>
                <td><Check post={post} field="editing_done" label="Editing"/></td>
                <td><Check post={post} field="caption_done" label="Caption"/></td>
                <td><Check post={post} field="thumbnail_done" label="Thumbnail"/></td>
                <td>
                  <select value={post.status} onChange={e=>setStatus(post.id,e.target.value)}
                    style={{background:'transparent',border:'none',color:'var(--text-muted)',fontSize:11,cursor:'pointer',fontFamily:'var(--font-mono)'}}>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <div style={{display:'flex',gap:4}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(post)}>✎</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>del(post.id)}>×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">{editId ? 'Post bearbeiten' : 'Neuer Instagram-Post'}</div>
            <div className="stack" style={{gap:12}}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kanal</label>
                  <select className="form-select" value={form.channel_id} onChange={e=>setForm(f=>({...f,channel_id:e.target.value}))}>
                    {IG_CHANNELS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Format</label>
                  <select className="form-select" value={form.format} onChange={e=>setForm(f=>({...f,format:e.target.value}))}>
                    {FORMATS.map(f=><option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Thema / Idee *</label>
                <input className="form-input" value={form.topic} onChange={e=>setForm(f=>({...f,topic:e.target.value}))} placeholder="z.B. Sonntagsimpuls – Clip vom 04.05." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Post-Datum</label>
                  <input className="form-input" type="date" value={form.post_date} onChange={e=>setForm(f=>({...f,post_date:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Wochentag</label>
                  <select className="form-select" value={form.weekday} onChange={e=>setForm(f=>({...f,weekday:e.target.value}))}>
                    {WEEKDAYS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Shooting-Datum</label>
                  <input className="form-input" type="date" value={form.shoot_date} onChange={e=>setForm(f=>({...f,shoot_date:e.target.value}))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Verantwortlich</label>
                  <select className="form-select" value={form.responsible} onChange={e=>setForm(f=>({...f,responsible:e.target.value}))}>
                    {TEAM.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notizen</label>
                <textarea className="form-textarea" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optionale Notizen..." />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={save}>{editId ? 'Speichern' : 'Hinzufügen'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
