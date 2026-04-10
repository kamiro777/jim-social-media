import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Instagram from './pages/Instagram'
import YouTube from './pages/YouTube'
import Podcast from './pages/Podcast'
import Todos from './pages/Todos'
import Meeting from './pages/Meeting'
import './App.css'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/instagram', label: 'Instagram', icon: '◉' },
  { to: '/youtube', label: 'YouTube', icon: '▶' },
  { to: '/podcast', label: 'Podcast', icon: '◎' },
  { to: '/todos', label: 'To-Dos', icon: '◻' },
  { to: '/meeting', label: 'Meeting', icon: '◆' },
]

const MONTHS = ['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']
const MONTH_LABELS = { '2026-04':'April 26','2026-05':'Mai 26','2026-06':'Juni 26','2026-07':'Juli 26','2026-08':'Aug 26','2026-09':'Sep 26' }

function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="bottom-nav-icon">{icon}</span>
          <span className="bottom-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function Sidebar({ month, setMonth }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">JIM</span>
        <span className="brand-sub">Social Media</span>
      </div>
      <div className="month-selector">
        <label>MONAT</label>
        <select value={month} onChange={e => setMonth(e.target.value)}>
          {MONTHS.map(m => <option key={m} value={m}>{MONTH_LABELS[m]}</option>)}
        </select>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="routine-card">
          <div className="routine-title">WOCHEN-ROUTINE</div>
          <div className="routine-item"><span className="day">Mo</span><span>Sonntagsimpuls → @jim_icg</span></div>
          <div className="routine-item"><span className="day">Mi</span><span>Community → @Ketawa</span></div>
          <div className="routine-item"><span className="day">Fr</span><span>Menschen/Podcast → @jim_icg</span></div>
          <div className="routine-item"><span className="day">So</span><span>Livestream → YouTube</span></div>
        </div>
      </div>
    </aside>
  )
}

function AppShell() {
  const [month, setMonth] = useState('2026-05')
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const titles = { '/': 'Dashboard', '/instagram': 'Instagram', '/youtube': 'YouTube', '/podcast': 'Podcast', '/todos': 'Team To-Dos', '/meeting': 'Meeting' }

  return (
    <div className="app-shell">
      <Sidebar month={month} setMonth={setMonth} />

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-brand">
              <span className="brand-mark">JIM</span>
              <button className="drawer-close" onClick={() => setMenuOpen(false)}>×</button>
            </div>
            <div className="month-selector" style={{margin:'0 16px 12px'}}>
              <label>MONAT</label>
              <select value={month} onChange={e => { setMonth(e.target.value); setMenuOpen(false) }}>
                {MONTHS.map(m => <option key={m} value={m}>{MONTH_LABELS[m]}</option>)}
              </select>
            </div>
            <div className="routine-card" style={{margin:'0 16px'}}>
              <div className="routine-title">WOCHEN-ROUTINE</div>
              <div className="routine-item"><span className="day">Mo</span><span>Sonntagsimpuls → @jim_icg</span></div>
              <div className="routine-item"><span className="day">Mi</span><span>Community → @Ketawa</span></div>
              <div className="routine-item"><span className="day">Fr</span><span>Menschen/Podcast → @jim_icg</span></div>
              <div className="routine-item"><span className="day">So</span><span>Livestream → YouTube</span></div>
            </div>
          </div>
        </div>
      )}

      <main className="main-content">
        <header className="page-header">
          <button className="menu-btn" onClick={() => setMenuOpen(true)}>☰</button>
          <h1>{titles[location.pathname] || 'JIM'}</h1>
          <div className="header-meta">
            <span className="month-badge">{MONTH_LABELS[month]?.toUpperCase()}</span>
          </div>
        </header>
        <div className="page-body">
          <Routes>
            <Route path="/" element={<Dashboard month={month} />} />
            <Route path="/instagram" element={<Instagram month={month} />} />
            <Route path="/youtube" element={<YouTube month={month} />} />
            <Route path="/podcast" element={<Podcast />} />
            <Route path="/todos" element={<Todos month={month} />} />
            <Route path="/meeting" element={<Meeting month={month} />} />
          </Routes>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
