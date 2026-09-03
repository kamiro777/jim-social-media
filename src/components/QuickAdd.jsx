import { useState } from 'react'
import { supabase, CHANNELS, WEEKDAYS, TEAM, deriveMonth } from '../lib/supabase'

// Schlanke Schnelleingabe für PMs: nur Was / Plattform / Verantwortlich / Wann.
// Landet je nach Plattform in der passenden Tabelle, damit die Detailseiten
// (Instagram/YouTube/Podcast/To-Dos) unverändert bleiben.
const PLATFORM_OPTIONS = [
  ...CHANNELS,
  { id: 'team', name: 'Team / Sonstiges', platform: 'Team' },
]

const empty = { title: '', platform: 'jim_icg', responsible: TEAM[0], date: '' }

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function weekdayFor(dateStr) {
  if (!dateStr) return null
  const jsDay = new Date(dateStr).getDay() // 0 = Sonntag
  return WEEKDAYS[(jsDay + 6) % 7]
}

export default function QuickAdd() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [saving, setSaving] = useState(false)

  const reset = () => { setOpen(false); setForm({ ...empty }) }

  const save = async () => {
    if (!form.title || saving) return
    setSaving(true)

    const month = deriveMonth(form.date, currentMonthKey())
    let error
    if (form.platform === 'team') {
      ({ error } = await supabase.from('todos').insert({
        task: form.title, responsible: form.responsible, due_date: form.date || null,
        month, priority: 'Diese Woche',
      }))
    } else if (form.platform === 'podcast') {
      ({ error } = await supabase.from('podcast_episodes').insert({
        guest: form.title, publish_date: form.date || null, status: 'Offen',
        notes: `Verantwortlich: ${form.responsible}`,
      }))
    } else {
      ({ error } = await supabase.from('posts').insert({
        channel_id: form.platform, topic: form.title, post_date: form.date || null,
        weekday: weekdayFor(form.date), responsible: form.responsible, status: 'Offen',
        format: 'Post', month,
      }))
    }

    setSaving(false)
    if (error) { alert('Fehler beim Speichern: ' + error.message); return }
    window.dispatchEvent(new Event('jim:refresh'))
    reset()
  }

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>+ Aufgabe</button>

      {open && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && reset()}>
          <div className="modal">
            <div className="modal-drag" />
            <div className="modal-title">Neue Aufgabe</div>
            <div className="stack" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Was *</label>
                <input
                  className="form-input" value={form.title} autoFocus
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="z.B. Reel zum Sonntagsimpuls"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Plattform</label>
                  <select className="form-select" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                    {PLATFORM_OPTIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Verantwortlich</label>
                  <select className="form-select" value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}>
                    {TEAM.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Wann</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={reset}>Abbrechen</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Speichert…' : 'Hinzufügen'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
