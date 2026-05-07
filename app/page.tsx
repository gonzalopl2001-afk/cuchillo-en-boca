'use client'
import { useEffect, useState } from 'react'

interface GarminData {
  recovery_score: number | null
  sleep_hours: number | null
  hrv: number | null
  body_battery: number | null
  synced_at: string | null
}

export default function Home() {
  const [garmin, setGarmin] = useState<GarminData | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [sport, setSport] = useState<'gym' | 'padel' | 'tenis' | 'running'>('gym')

  useEffect(() => { fetchGarmin() }, [])

  async function fetchGarmin() {
    const res = await fetch('/api/garmin/latest')
    const json = await res.json()
    if (json.ok && json.data) setGarmin(json.data)
  }

  async function syncGarmin() {
    setSyncing(true)
    const res = await fetch('/api/garmin/sync')
    const json = await res.json()
    if (json.ok) fetchGarmin()
    else alert('Error: ' + json.error)
    setSyncing(false)
  }

  const score = garmin?.recovery_score ?? null
  const scoreColor = score === null ? '#888' : score >= 75 ? '#639922' : score >= 55 ? '#BA7517' : '#E24B4A'
  const scoreLabel = score === null ? 'Sin datos' : score >= 75 ? '¡A tope! Sube cargas' : score >= 55 ? 'Moderado · Mantén carga' : 'Recuperación baja · Descansa'

  const sports = [
    { id: 'gym', icon: '🏋️', label: 'Gym' },
    { id: 'padel', icon: '🎾', label: 'Pádel' },
    { id: 'tenis', icon: '🎾', label: 'Tenis' },
    { id: 'running', icon: '🏃', label: 'Running' },
  ] as const

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>Cuchillo en Boca</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <button
          onClick={syncGarmin}
          disabled={syncing}
          style={{
            background: syncing ? '#222' : '#1a1a1a',
            border: '1px solid #333',
            color: syncing ? '#666' : '#f0ebe0',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            cursor: syncing ? 'not-allowed' : 'pointer',
          }}
        >
          {syncing ? 'Sincronizando…' : '⌚ Sync Garmin'}
        </button>
      </div>

      {/* Recovery banner */}
      <div style={{
        background: '#161616',
        border: `1px solid ${scoreColor}44`,
        borderRadius: 16,
        padding: '20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          border: `4px solid ${scoreColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor }}>
            {score ?? '—'}
          </span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: scoreColor }}>{scoreLabel}</div>
          {garmin && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {garmin.sleep_hours != null && `${garmin.sleep_hours}h sueño`}
              {garmin.hrv != null && ` · HRV ${garmin.hrv}`}
              {garmin.body_battery != null && ` · Batería ${garmin.body_battery}%`}
            </div>
          )}
          {!garmin && (
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
              Pulsa "Sync Garmin" para importar tus datos
            </div>
          )}
        </div>
      </div>

      {/* Sport selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
        {sports.map(s => (
          <button key={s.id} onClick={() => setSport(s.id)}
            style={{
              background: sport === s.id ? '#222' : '#111',
              border: sport === s.id ? '2px solid #E24B4A' : '1px solid #222',
              borderRadius: 12, padding: '12px 4px',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4,
            }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <span style={{ fontSize: 11, color: sport === s.id ? '#f0ebe0' : '#666', fontWeight: 500 }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <QuickCard title="Registrar sesión" sub="Añade ejercicios, pesos y series" icon="📝" href="/session/new" />
        <QuickCard title="Rivales" sub="Ver head-to-head y compañeros" icon="👥" href="/people" />
        <QuickCard title="Progreso" sub="Gráficas y evolución" icon="📈" href="/progress" />
        <QuickCard title="Objetivo" sub="Hoja de ruta activa" icon="🎯" href="/goals" />
      </div>

    </main>
  )
}

function QuickCard({ title, sub, icon, href }: { title: string, sub: string, icon: string, href: string }) {
  return (
    <a href={href} style={{
      display: 'block', background: '#111', border: '1px solid #222',
      borderRadius: 14, padding: '14px', textDecoration: 'none',
      transition: 'border-color .15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#444')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}
    >
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#f0ebe0' }}>{title}</div>
      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{sub}</div>
    </a>
  )
}
