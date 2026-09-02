import { useState, useEffect } from 'react'
import { supabase, deriveMonth } from '../lib/supabase'

const TEAM = ['Karlo','Bryan','Arella','Kati','Yola','Joshua Jantz','Josua Ua']
const ROUTINE = [
  {day:'Montag',action:'Sonntagsimpuls-Reel schneiden & posten',channel:'@jim_icg',color:'var(--red)'},
  {day:'Mittwoch',action:'Community Reel oder Carousel',channel:'@JIM Ketawa',color:'var(--blue)'},
  {day:'Freitag',action:'Menschen im Fokus / Podcast-Teaser (alternierend)',channel:'@jim_icg',color:'var(--red)'},
  {day:'Sonntag',action:'Gottesdienst Livestream → danach VOD optimieren',channel:'YouTube',color:'var(--green)'},
]

export default function Meeting({ month }) {
  const [meeting, setMeeting] = useState(null)
  const [form, setForm] = useState({ meeting_date:'', month, attendees:'', shooting_ideas: TEAM.map(n=>({name:n,idea1:'',channel1:'',idea2:''})), decisions:[{task:'',responsible:'',deadline:'',status:''}] })
  const [saved, setSaved] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('meetings').select('*').eq('month', month).order('created_at', {ascending:false}).limit(1)
    if (data?.[0]) {
      const m = data[0]
      setMeeting(m)
      setForm({
        ...m,
        shooting_ideas: m.shooting_ideas?.length ? m.shooting_ideas : TEAM.map(n=>({name:n,idea1:'',channel1:'',idea2:''})),
        decisions: m.decisions?.length ? m.decisions : [{task:'',responsible:'',deadline:'',status:''}]
      })
    }
  }
  useEffect(() => { load() }, [month])

  const save = async () => {
    if (!form.meeting_date) { alert('Bitte ein Datum auswählen.'); return }
    const payload = { ...form, month: deriveMonth(form.meeting_date, month) }
    const { error } = meeting?.id
      ? await supabase.from('meetings').update(payload).eq('id', meeting.id)
      : await supabase.from('meetings').insert(payload)
    if (error) { alert('Fehler beim Speichern: ' + error.message); return }
    setSaved(true); setTimeout(()=>setSaved(false), 2000); load()
  }

  const updateIdea = (i, field, val) => {
    const ideas = [...form.shooting_ideas]
    ideas[i] = {...ideas[i], [field]: val}
    setForm(f=>({...f, shooting_ideas: ideas}))
  }

  const updateDecision = (i, field, val) => {
    const decs = [...form.decisions]
    decs[i] = {...decs[i], [field]: val}
    setForm(f=>({...f, decisions: decs}))
  }

  const addDecision = () => setForm(f=>({...f, decisions:[...f.decisions,{task:'',responsible:'',deadline:'',status:''}]}))
  const removeDecision = (i) => setForm(f=>({...f, decisions:f.decisions.filter((_,idx)=>idx!==i)}))

  return (
    <div className="stack">
      {/* Meeting Info */}
      <div className="card">
        <div className="card-title">Meeting-Informationen</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Datum</label>
            <input className="form-input" type="date" value={form.meeting_date} onChange={e=>setForm(f=>({...f,meeting_date:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Ort</label>
            <input className="form-input" value="Grusonstraße 21, München" readOnly style={{opacity:.5}} />
          </div>
          <div className="form-group">
            <label className="form-label">Anwesend</label>
            <input className="form-input" value={form.attendees} onChange={e=>setForm(f=>({...f,attendees:e.target.value}))} placeholder="z.B. Karlo, Person 2, Person 3..." />
          </div>
        </div>
      </div>

      {/* Shooting Ideas */}
      <div className="card">
        <div className="card-title">📸 Shooting-Ideen — vor dem Meeting ausfüllen</div>
        <table className="data-table">
          <thead><tr>
            <th>Name</th><th>Idee #1 (Prio hoch)</th><th>Kanal</th><th>Idee #2 (optional)</th>
          </tr></thead>
          <tbody>
            {form.shooting_ideas.map((idea, i) => (
              <tr key={i}>
                <td style={{fontWeight:600,color:i===0?'var(--red)':'var(--text)',minWidth:90}}>{idea.name}</td>
                <td>
                  <input className="form-input" style={{fontSize:11,padding:'5px 8px'}} value={idea.idea1} onChange={e=>updateIdea(i,'idea1',e.target.value)} placeholder="Idee beschreiben..." />
                </td>
                <td style={{minWidth:110}}>
                  <select className="form-select" style={{fontSize:11,padding:'5px 8px'}} value={idea.channel1} onChange={e=>updateIdea(i,'channel1',e.target.value)}>
                    <option value="">—</option>
                    <option>@jim_icg</option><option>@JIM Ketawa</option><option>YouTube</option><option>Podcast</option>
                  </select>
                </td>
                <td>
                  <input className="form-input" style={{fontSize:11,padding:'5px 8px'}} value={idea.idea2} onChange={e=>updateIdea(i,'idea2',e.target.value)} placeholder="Optionale zweite Idee..." />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Decisions */}
      <div className="card">
        <div className="card-title">✅ Beschlüsse & nächste Schritte</div>
        <table className="data-table">
          <thead><tr><th>Aufgabe</th><th>Verantwortlich</th><th>Deadline</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {form.decisions.map((d, i) => (
              <tr key={i}>
                <td><input className="form-input" style={{fontSize:11,padding:'5px 8px'}} value={d.task} onChange={e=>updateDecision(i,'task',e.target.value)} placeholder="Aufgabe..." /></td>
                <td style={{minWidth:110}}>
                  <select className="form-select" style={{fontSize:11,padding:'5px 8px'}} value={d.responsible} onChange={e=>updateDecision(i,'responsible',e.target.value)}>
                    <option value="">—</option>
                    {TEAM.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td style={{minWidth:130}}>
                  <input className="form-input" type="date" style={{fontSize:11,padding:'5px 8px'}} value={d.deadline} onChange={e=>updateDecision(i,'deadline',e.target.value)} />
                </td>
                <td style={{minWidth:100}}>
                  <select className="form-select" style={{fontSize:11,padding:'5px 8px'}} value={d.status} onChange={e=>updateDecision(i,'status',e.target.value)}>
                    <option value="">—</option>
                    <option>Offen</option><option>In Arbeit</option><option>Erledigt</option>
                  </select>
                </td>
                <td><button className="btn btn-danger btn-sm" onClick={()=>removeDecision(i)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-ghost btn-sm" style={{marginTop:10}} onClick={addDecision}>+ Zeile hinzufügen</button>
      </div>

      {/* Routine Reminder */}
      <div className="card">
        <div className="card-title">📅 Wochen-Routine (Erinnerung)</div>
        <table className="data-table">
          <tbody>
            {ROUTINE.map(r => (
              <tr key={r.day}>
                <td style={{fontWeight:700,color:r.color,width:90}}>{r.day}</td>
                <td>{r.action}</td>
                <td><span className={`channel-tag channel-${r.channel.replace('@','').replace(' ','').toLowerCase()}`}>{r.channel}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',gap:8,alignItems:'center'}}>
        {saved && <span style={{fontSize:11,color:'var(--green)'}}>✓ Gespeichert</span>}
        <button className="btn btn-primary" onClick={save}>Meeting speichern</button>
      </div>
    </div>
  )
}
