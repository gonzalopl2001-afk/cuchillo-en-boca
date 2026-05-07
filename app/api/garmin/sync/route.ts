// app/api/garmin/sync/route.ts
// Llama a Garmin Connect API y guarda datos en Supabase

import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

const GARMIN_API = 'https://connect.garmin.com'

// ─── Helper: obtener token de sesión de Garmin ────────────────────────────────
async function getGarminToken(): Promise<string> {
  const email = process.env.GARMIN_EMAIL!
  const password = process.env.GARMIN_PASSWORD!

  // Paso 1: obtener ticket SSO de Garmin
  const ssoRes = await fetch('https://sso.garmin.com/sso/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'Origin': 'https://sso.garmin.com',
    },
    body: new URLSearchParams({
      username: email,
      password: password,
      embed: 'false',
      _eventId: 'submit',
    }),
    redirect: 'manual',
  })

  // Extraer ticket del redirect
  const location = ssoRes.headers.get('location') || ''
  const ticketMatch = location.match(/ticket=([^&]+)/)
  if (!ticketMatch) throw new Error('No se pudo autenticar con Garmin. Comprueba email/password en .env.local')
  const ticket = ticketMatch[1]

  // Paso 2: canjear ticket por token de Connect
  const connectRes = await fetch(`${GARMIN_API}/modern/?ticket=${ticket}`, {
    redirect: 'manual',
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })

  const cookies = connectRes.headers.get('set-cookie') || ''
  const tokenMatch = cookies.match(/GARMIN-SSO-GUID=([^;]+)/)
  if (!tokenMatch) throw new Error('No se pudo obtener token de Garmin Connect')

  return tokenMatch[1]
}

// ─── Helper: fetch autenticado a Garmin Connect ───────────────────────────────
async function garminFetch(path: string, token: string) {
  const res = await fetch(`${GARMIN_API}/proxy/${path}`, {
    headers: {
      'Cookie': `GARMIN-SSO-GUID=${token}`,
      'NK': 'NT',
      'User-Agent': 'Mozilla/5.0',
    },
  })
  if (!res.ok) throw new Error(`Garmin API error: ${res.status} en ${path}`)
  return res.json()
}

// ─── GET /api/garmin/sync ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const token = await getGarminToken()
    const today = new Date().toISOString().slice(0, 10)

    // Obtener datos de hoy en paralelo
    const [sleepData, wellnessData, activitiesData] = await Promise.all([
      garminFetch(`wellness-service/wellness/dailySleepData/user?date=${today}`, token).catch(() => null),
      garminFetch(`wellness-service/wellness/dailySummaryChart/user?date=${today}`, token).catch(() => null),
      garminFetch(`activitylist-service/activities/search/activities?limit=5&start=0`, token).catch(() => null),
    ])

    // Parsear sueño
    const sleep = sleepData?.dailySleepDTO
    const sleepHours = sleep
      ? Math.round(((sleep.sleepTimeSeconds || 0) / 3600) * 10) / 10
      : null
    const hrv = sleep?.averageSpO2Value || null

    // Parsear Body Battery (último valor del día)
    const bodyBatteryArr = wellnessData?.wellnessDataDTOList || []
    const lastBattery = bodyBatteryArr
      .filter((d: { bodyBattery: number | null }) => d.bodyBattery !== null)
      .pop()
    const bodyBattery = lastBattery?.bodyBattery || null

    // Calcular score de recuperación (0-100)
    const recoveryScore = calcRecovery(sleepHours, hrv, bodyBattery)

    // Guardar en Supabase (user_id fijo por ahora; con auth se usa el real)
    const userId = 'gonzalo' // reemplazar con auth real cuando lo añadas
    const { error } = await supabase.from('garmin_syncs').upsert({
      user_id: userId,
      synced_at: new Date().toISOString(),
      sleep_hours: sleepHours,
      hrv,
      body_battery: bodyBattery,
      recovery_score: recoveryScore,
      raw: { sleep: sleepData, wellness: wellnessData },
    })

    if (error) console.error('Supabase error:', error)

    // Procesar actividades recientes y guardarlas como sesiones
    const activities = activitiesData?.activityList || []
    for (const act of activities.slice(0, 3)) {
      const sportMap: Record<string, string> = {
        running: 'running', cycling: 'cycling',
        strength_training: 'gym', tennis: 'tenis',
        padel: 'padel', swimming: 'natacion',
      }
      const sport = sportMap[act.activityType?.typeKey] || 'running'
      await supabase.from('sessions').upsert({
        user_id: userId,
        sport,
        date: act.startTimeLocal?.slice(0, 10),
        duration_min: Math.round((act.duration || 0) / 60),
        garmin_activity_id: String(act.activityId),
        garmin_data: {
          name: act.activityName,
          distance_m: act.distance,
          avg_hr: act.averageHR,
          max_hr: act.maxHR,
          calories: act.calories,
          vo2max: act.vO2MaxValue,
          avg_pace: act.averageSpeed,
        },
      }, { onConflict: 'garmin_activity_id' })
    }

    return NextResponse.json({
      ok: true,
      recovery: {
        score: recoveryScore,
        sleep_hours: sleepHours,
        hrv,
        body_battery: bodyBattery,
      },
      activities_synced: activities.length,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Garmin sync error:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

// ─── Cálculo de score de recuperación ────────────────────────────────────────
function calcRecovery(
  sleepH: number | null,
  hrv: number | null,
  battery: number | null
): number {
  let score = 0
  let weight = 0

  if (sleepH !== null) {
    // 8h = 100 puntos, escala lineal con mínimo 4h
    score += Math.min(100, Math.max(0, ((sleepH - 4) / 4) * 100)) * 0.4
    weight += 0.4
  }
  if (hrv !== null) {
    // HRV 80+ = 100, escala de 30 a 80
    score += Math.min(100, Math.max(0, ((hrv - 30) / 50) * 100)) * 0.35
    weight += 0.35
  }
  if (battery !== null) {
    score += battery * 0.25
    weight += 0.25
  }

  if (weight === 0) return 70 // default sin datos
  return Math.round(score / weight)
}
