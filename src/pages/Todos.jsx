import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TEAM = ['Karlo','Bryan','Arella','Kati','Yola','Joshua Jantz','Josua Ua','Alle']
const CHANNELS = [
  {id:'jim_icg',name:'@jim_icg'},{id:'ketawa',name:'@JIM Ketawa'},
  {id:'youtube',name:'YouTube'},{id:'podcast',name:'Podcast'},{id:'worship',name:'JIM Worship'},{id:'alle',name:'Alle'}
]
const PRIORITIES = ['Dringend','Diese Woche','Diesen Monat','Backlog']
const PRIORITY_COLORS = { 'Dringend':'var(--red)', 'Diese Woche':'var(--amber)', 'Diesen Monat':'var(--blue)', 'Backlog':'var(--text-dim)' }
const empty = { task:'', channel_id:'', responsible:'Karlo', due_date:'', priority:'Diese Woche', done:false }

export default function Todos({ month }) {
  const [todos, setTodos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [editId, setEditId] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    const q = supabase.from('todos').select('*').order('done').order('priority')
    const { data } = filter === 'all' ? await q : await q.eq('priority', filter)
    setTodos(data || [])
  }
  useEffect(() => { load() }, [month, filter])

  const save = async () => {
    if (!form.task) return
    const payload = { ...form, month }
    if (editId) await supabase.from('todos').update(payload).eq('id', editId)
    else await supabase.from('todos').insert(payload)
    setShowModal(false); setEditId(null); setForm({...empty}); load()
  }

  const del = async (id) => { if(!confirm('Löschen?')) return; await supabase.from('todos').delete().eq('id',id); load() }
  const toggleDone = async (todo) => { await supabase.from('todos').update({done:!todo.done}).eq('id',todo.id); load() }
  const openEdit = (t) => { setForm({...t}); setEditId(t.id); setShowModal(true) }

  const groups = PRIORITIES.map(p => ({ p, items: todos.filter(t=>t.priority===p&&!t.done) }))
  const done = todos.filter(t=>t.done)

  return (
    <div className="stack">
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <div style={{display:'flex',gap:4}}>
          {['all',...PRIORITIES].map(p => (
            <button key={p} onClick={()=>setFilter(p)} className={`btn btn-sm ${filter===p?'btn-primary':'btn-ghost'}`}>
              {p==='all'?'Alle':p}
            </button>
          ))}
        </div>
        <div style={{flex:1}}/>
        <button className="btn btn-primary btn-sm" onClick={()=>{setForm({...empty});setEditId(null);setShowModal(true)}}>
          + To-Do hinzufügen
        </button>
      </div>

      {groups.map(({ p, items }) => items.length > 0 && (
        <div key={p}>
          <div className="section-title" style={{color:PRIORITY_COLORS[p]}}>{p}</div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <table className="data-table">
              <thead><tr><th>Aufgabe</th><th>Kanal</th><th>Zuständig</th><th>Fällig</th><th>✓</th><th></th></tr></thead>
              <tbody>
                {items.map(t => (
                  <tr key={t.id}>
                    <td style={{fontWeight:500}}>{t.task}</td>
                    <td>{t.channel_id && <span className={`channel-tag channel-${t.channel_id}`}>{CHANNELS.find(c=>c.id===t.channel_id)?.name||t.channel_id}</span>}</td>
                    <td style={{fontSize:11,color:'var(--text-muted)'}}>{t.responsible}</td>
                    <td style={{fontSize:11,color:t.due_date?'var(--amber)':'var(--text-dim)'}}>{t.due_date||'—'}</td>
                    <td>
                      <div className="check" onClick={()=>toggleDone(t)}>
                        <div className={`check-box ${t.done?'checked':''}`}/>
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(t)}>✎</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>del(t.id)}>×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <div>
          <div className="section-title" style={{color:'var(--green)'}}>Erledigt ✓</div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <table className="data-table">
              <tbody>
                {done.map(t => (
                  <tr key={t.id} style={{opacity:.4}}>
                    <td style={{textDecoration:'line-through'}}>{t.task}</td>
                    <td>{t.responsible}</td>
                    <td>
                      <div className="check" onClick={()=>toggleDone(t)}>
                        <div className="check-box checked"/>
                      </div>
                    </td>
                    <td><button className="btn btn-danger btn-sm" onClick={()=>del(t.id)}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {todos.length === 0 && <div className="empty-state"><div className="empty-icon">◻</div>Keine To-Dos — alles erledigt!</div>}

      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">{editId?'To-Do bearbeiten':'Neues To-Do'}</div>
            <div className="stack" style={{gap:12}}>
              <div className="form-group">
                <label className="form-label">Aufgabe *</label>
                <input className="form-input" value={form.task} onChange={e=>setForm(f=>({...f,task:e.target.value}))} placeholder="z.B. Sonntagsimpuls-Reel schneiden" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Priorität</label>
                  <select className="form-select" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                    {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kanal</label>
                  <select className="form-select" value={form.channel_id} onChange={e=>setForm(f=>({...f,channel_id:e.target.value}))}>
                    <option value="">—</option>
                    {CHANNELS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
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
                  <label className="form-label">Fällig am</label>
                  <input className="form-input" type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} />
                </div>
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
