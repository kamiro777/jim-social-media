import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STATUSES = ['Offen','In Arbeit','Bereit','Gepostet']
const empty = { episode_number:'', guest:'', record_date:'', publish_date:'', ig_teaser:false, yt_upload:false, editing_done:false, cover_done:false, status:'Offen', notes:'' }

export default function Podcast() {
  const [eps, setEps] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [editId, setEditId] = useState(null)

  const load = async () => {
    const { data } = await supabase.from('podcast_episodes').select('*').order('episode_number')
    setEps(data || [])
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.guest) return
    if (editId) await supabase.from('podcast_episodes').update(form).eq('id', editId)
    else await supabase.from('podcast_episodes').insert(form)
    setShowModal(false); setEditId(null); setForm({...empty}); load()
  }

  const del = async (id) => { if(!confirm('Episode löschen?')) return; await supabase.from('podcast_episodes').delete().eq('id',id); load() }
  const toggleCheck = async (ep, field) => { await supabase.from('podcast_episodes').update({[field]:!ep[field]}).eq('id',ep.id); load() }
  const setStatus = async (id, status) => { await supabase.from('podcast_episodes').update({status}).eq('id',id); load() }
  const openEdit = (ep) => { setForm({...ep}); setEditId(ep.id); setShowModal(true) }

  const Check = ({ ep, field, label }) => (
    <div className="check tooltip" data-tip={label} onClick={() => toggleCheck(ep, field)}>
      <div className={`check-box ${ep[field] ? 'checked' : ''}`}/>
    </div>
  )

  const published = eps.filter(e=>e.status==='Gepostet').length

  return (
    <div className="stack">
      <div className="grid-3">
        <div className="stat-card purple">
          <div className="stat-label">EPISODEN GEPLANT</div>
          <div className="stat-value">{eps.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">VERÖFFENTLICHT</div>
          <div className="stat-value">{published}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">IN PRODUKTION</div>
          <div className="stat-value">{eps.filter(e=>e.status!=='Gepostet').length}</div>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <button className="btn btn-primary btn-sm" onClick={()=>{setForm({...empty});setEditId(null);setShowModal(true)}}>
          + Episode hinzufügen
        </button>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table className="data-table">
          <thead><tr>
            <th>#</th><th>Gast / Thema</th><th>Aufnahme</th><th>Veröffentlichung</th>
            <th>IG Teaser</th><th>YT Upload</th><th>Schnitt</th><th>Cover</th>
            <th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {eps.length === 0 && (
              <tr><td colSpan={10} style={{textAlign:'center',padding:32,color:'var(--text-dim)'}}>Noch keine Episoden</td></tr>
            )}
            {eps.map(ep => (
              <tr key={ep.id} style={ep.status==='Gepostet'?{opacity:.5}:{}}>
                <td style={{color:'var(--purple)',fontWeight:600}}>{ep.episode_number||'—'}</td>
                <td style={{fontWeight:500}}>{ep.guest}{ep.notes&&<div style={{fontSize:10,color:'var(--text-dim)'}}>{ep.notes}</div>}</td>
                <td style={{fontSize:11,color:'var(--text-muted)'}}>{ep.record_date||'—'}</td>
                <td style={{fontSize:11,color:'var(--text-muted)'}}>{ep.publish_date||'—'}</td>
                <td><Check ep={ep} field="ig_teaser" label="IG Teaser"/></td>
                <td><Check ep={ep} field="yt_upload" label="YT Upload"/></td>
                <td><Check ep={ep} field="editing_done" label="Schnitt"/></td>
                <td><Check ep={ep} field="cover_done" label="Cover"/></td>
                <td>
                  <select value={ep.status} onChange={e=>setStatus(ep.id,e.target.value)}
                    style={{background:'transparent',border:'none',color:'var(--text-muted)',fontSize:11,cursor:'pointer',fontFamily:'var(--font-mono)'}}>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <div style={{display:'flex',gap:4}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(ep)}>✎</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>del(ep.id)}>×</button>
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
            <div className="modal-title">{editId ? 'Episode bearbeiten' : 'Neue Podcast-Episode'}</div>
            <div className="stack" style={{gap:12}}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Episode #</label>
                  <input className="form-input" type="number" value={form.episode_number} onChange={e=>setForm(f=>({...f,episode_number:e.target.value}))} />
                </div>
                <div className="form-group" style={{flex:2}}>
                  <label className="form-label">Gast / Thema *</label>
                  <input className="form-input" value={form.guest} onChange={e=>setForm(f=>({...f,guest:e.target.value}))} placeholder="z.B. Susi Kranich" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Aufnahmedatum</label>
                  <input className="form-input" type="date" value={form.record_date} onChange={e=>setForm(f=>({...f,record_date:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Veröffentlichung</label>
                  <input className="form-input" type="date" value={form.publish_date} onChange={e=>setForm(f=>({...f,publish_date:e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                  {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notizen</label>
                <textarea className="form-textarea" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={save}>{editId?'Speichern':'Hinzufügen'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
