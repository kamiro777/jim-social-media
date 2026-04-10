import { useState, useEffect } from 'react'
import { supabase, STATUSES } from '../lib/supabase'

const TEAM = ['Karlo','Person 2','Person 3','Person 4','Person 5','Person 6','Person 7']
const YT_FORMATS = ['Livestream/VOD','Podcast-Episode','Worship Session','Shorts']
const empty = { month:'', channel_id:'youtube', post_date:'', weekday:'Sonntag', format:'Livestream/VOD', topic:'', responsible:'Team', shoot_date:'', shooting_done:false, editing_done:false, caption_done:false, thumbnail_done:false, status:'Offen', notes:'' }

export default function YouTube({ month }) {
  const [posts, setPosts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...empty, month })
  const [editId, setEditId] = useState(null)

  const load = async () => {
    const { data } = await supabase.from('posts').select('*').eq('month', month).eq('channel_id','youtube').order('post_date')
    setPosts(data || [])
  }
  useEffect(() => { load() }, [month])

  const save = async () => {
    if (!form.topic) return
    const payload = { ...form, month }
    if (editId) await supabase.from('posts').update(payload).eq('id', editId)
    else await supabase.from('posts').insert(payload)
    setShowModal(false); setEditId(null); setForm({...empty,month}); load()
  }

  const del = async (id) => { if (!confirm('Löschen?')) return; await supabase.from('posts').delete().eq('id',id); load() }
  const toggleCheck = async (post, field) => { await supabase.from('posts').update({[field]:!post[field]}).eq('id',post.id); load() }
  const setStatus = async (id, status) => { await supabase.from('posts').update({status}).eq('id',id); load() }
  const openEdit = (post) => { setForm({...post}); setEditId(post.id); setShowModal(true) }

  const fmtColors = { 'Livestream/VOD':'var(--green)', 'Podcast-Episode':'var(--purple)', 'Worship Session':'var(--gold)', 'Shorts':'var(--blue)' }

  const Check = ({ post, field, label }) => (
    <div className="check tooltip" data-tip={label} onClick={() => toggleCheck(post, field)}>
      <div className={`check-box ${post[field] ? 'checked' : ''}`}/>
    </div>
  )

  const byFormat = YT_FORMATS.map(fmt => ({ fmt, posts: posts.filter(p=>p.format===fmt) })).filter(g=>g.posts.length>0)

  return (
    <div className="stack">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',gap:8}}>
          {YT_FORMATS.map(f => {
            const count = posts.filter(p=>p.format===f).length
            return count > 0 ? (
              <div key={f} style={{fontSize:11,padding:'4px 10px',borderRadius:4,background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text-muted)'}}>
                {f} <span style={{color:fmtColors[f],fontWeight:600}}>{count}</span>
              </div>
            ) : null
          })}
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>{setForm({...empty,month});setEditId(null);setShowModal(true)}}>
          + Video hinzufügen
        </button>
      </div>

      {posts.length === 0 && <div className="empty-state"><div className="empty-icon">▶</div>Noch keine Videos geplant</div>}

      {byFormat.map(({ fmt, posts: fPosts }) => (
        <div key={fmt}>
          <div className="section-title" style={{color:fmtColors[fmt]}}>{fmt}</div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <table className="data-table">
              <thead><tr>
                <th>Datum</th><th>Tag</th><th>Titel / Thema</th><th>Zuständig</th>
                <th>Thumbnail</th><th>Schnitt</th><th>Beschreibung</th><th>Status</th><th></th>
              </tr></thead>
              <tbody>
                {fPosts.map(post => (
                  <tr key={post.id}>
                    <td style={{color:'var(--text-muted)',fontSize:11}}>{post.post_date||'—'}</td>
                    <td style={{fontSize:11,color:'var(--text-dim)'}}>{post.weekday||'—'}</td>
                    <td style={{maxWidth:240}}>
                      <div style={{fontWeight:500}}>{post.topic}</div>
                      {post.notes && <div style={{fontSize:10,color:'var(--text-dim)'}}>{post.notes}</div>}
                    </td>
                    <td style={{fontSize:11,color:'var(--text-muted)'}}>{post.responsible}</td>
                    <td><Check post={post} field="thumbnail_done" label="Thumbnail"/></td>
                    <td><Check post={post} field="editing_done" label="Schnitt"/></td>
                    <td><Check post={post} field="caption_done" label="Beschreibung"/></td>
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
        </div>
      ))}

      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">{editId ? 'Video bearbeiten' : 'Neues YouTube-Video'}</div>
            <div className="stack" style={{gap:12}}>
              <div className="form-group">
                <label className="form-label">Titel / Thema *</label>
                <input className="form-input" value={form.topic} onChange={e=>setForm(f=>({...f,topic:e.target.value}))} placeholder="z.B. Gottesdienst 04.05.2026" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Format</label>
                  <select className="form-select" value={form.format} onChange={e=>setForm(f=>({...f,format:e.target.value}))}>
                    {YT_FORMATS.map(f=><option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Datum</label>
                  <input className="form-input" type="date" value={form.post_date} onChange={e=>setForm(f=>({...f,post_date:e.target.value}))} />
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
                <textarea className="form-textarea" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
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
