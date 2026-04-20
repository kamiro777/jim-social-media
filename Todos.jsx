import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TEAM = ['Alle','Karlo','Bryan','Arella','Kati','Yola','Joshua Jantz','Josua Ua']
const CHANNELS = [
  {id:'jim_icg',name:'@jim_icg'},{id:'ketawa',name:'@JIM Ketawa'},
  {id:'youtube',name:'YouTube'},{id:'podcast',name:'Podcast'},
  {id:'worship',name:'JIM Worship'},{id:'alle',name:'Alle'}
]
const empty = { task:'', channel_id:'', responsible:'Karlo', due_date:'', done:false }

function isOverdue(due_date) {
  if (!due_date) return false
  return new Date(due_date) < new Date(new Date().toDateString())
}

export default function Todos({ month }) {
  const [todos, setTodos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [editId, setEditId] = useState(null)
  const [filterResponsible, setFilterResponsible] = useState('all')

  const load = async () => {
    const { data } = await supabase.from('todos').select('*').order('done').order('due_date', { ascending: true, nullsFirst: false })
    setTodos(data || [])
  }
  useEffect(() => { load() }, [month])

  const save = async () => {
    if (!form.task) return
    const payload = { ...form, month }
    if (editId) await supabase.from('todos').update(payload).eq('id', editId)
    else await supabase.from('todos').insert(payload)
    setShowModal(false); setEditId(null); setForm({...empty}); load()
  }
  const del = async (id) => { if (!confirm('Löschen?')) return; await supabase.from('todos').delete().eq('id', id); load() }
  const toggleDone = async (todo) => { await supabase.from('todos').update({ done: !todo.done }).eq('id', todo.id); load() }
  const openEdit = (t) => { setForm({...t}); setEditId(t.id); setShowModal(true) }

  const filtered = todos.filter(t =>
    filterResponsible === 'all' || t.responsible === filterResponsible
  )

  const overdue = filtered.filter(t => !t.done && isOverdue(t.due_date))
  const upcoming = filtered.filter(t => !t.done && !isOverdue(t.due_date))
  const done = filtered.filter(t => t.done)

  const TodoItem = ({ t }) => {
    const overdueMark = isOverdue(t.due_date) && !t.done
    return (
      <div style={{
        background: t.done ? 'transparent' : 'var(--bg3)',
        border: `1px solid ${overdueMark ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 8,
        padding: '12px 14px',
        opacity: t.done ? 0.4 : 1
      }}>
        <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
          <div className="check" onClick={() => toggleDone(t)} style={{marginTop:2}}>
            <div className={`check-box ${t.done ? 'checked' : ''}`}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:500,textDecoration:t.done?'line-through':'none',marginBottom:4}}>{t.task}</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',fontSize:10,color:'var(--text-muted)',alignItems:'center'}}>
              {t.channel_id && <span className={`channel-tag channel-${t.channel_id}`}>{CHANNELS.find(c=>c.id===t.channel_id)?.name||t.channel_id}</span>}
              {t.responsible && <span>→ {t.responsible}</span>}
              {t.due_date && (
                <span style={{
                  color: overdueMark ? 'var(--red)' : 'var(--text-muted)',
                  fontWeight: overdueMark ? 600 : 400,
                  display:'flex',alignItems:'center',gap:3
                }}>
                  📅 {t.due_date}
                  {overdueMark && <span style={{background:'var(--red)',color:'#fff',borderRadius:4,padding:'1px 5px',fontSize:9,fontWeight:700,marginLeft:2}}>ÜBERFÄLLIG</span>}
                </span>
              )}
            </div>
          </div>
          <div style={{display:'flex',gap:4,flexShrink:0}}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(t)}>✎</button>
            <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(t.id)}>×</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      {/* Filter Verantwortlich */}
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
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
        <div style={{flex:1}}/>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm({...empty}); setEditId(null); setShowModal(true) }}>
          + To-Do
        </button>
      </div>

      {/* Überfällig */}
      {overdue.length > 0 && (
        <div>
          <div className="section-title" style={{color:'var(--red)'}}>⚠️ Überfällig ({overdue.length})</div>
          <div className="stack" style={{gap:8}}>
            {overdue.map(t => <TodoItem key={t.id} t={t} />)}
          </div>
        </div>
      )}

      {/* Noch offen */}
      {upcoming.length > 0 && (
        <div>
          <div className="section-title" style={{color:'var(--text-muted)'}}>📅 Anstehend</div>
          <div className="stack" style={{gap:8}}>
            {upcoming.map(t => <TodoItem key={t.id} t={t} />)}
          </div>
        </div>
      )}

      {/* Erledigt */}
      {done.length > 0 && (
        <div>
          <div className="section-title" style={{color:'var(--green)'}}>Erledigt ✓</div>
          <div className="stack" style={{gap:8}}>
            {done.map(t => <TodoItem key={t.id} t={t} />)}
          </div>
        </div>
      )}

      {todos.length === 0 && <div className="empty-state"><div className="empty-icon">◻</div>Keine To-Dos — alles erledigt!</div>}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-drag"/>
            <div className="modal-title">{editId ? 'To-Do bearbeiten' : 'Neues To-Do'}</div>
            <div className="stack" style={{gap:12}}>
              <div className="form-group">
                <label className="form-label">Aufgabe *</label>
                <input className="form-input" value={form.task} onChange={e => setForm(f => ({...f, task: e.target.value}))} placeholder="z.B. Sonntagsimpuls-Reel schneiden" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kanal</label>
                  <select className="form-select" value={form.channel_id} onChange={e => setForm(f => ({...f, channel_id: e.target.value}))}>
                    <option value="">—</option>
                    {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Verantwortlich</label>
                  <select className="form-select" value={form.responsible} onChange={e => setForm(f => ({...f, responsible: e.target.value}))}>
                    {TEAM.filter(t => t !== 'Alle').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fällig am</label>
                <input className="form-input" type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} />
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
