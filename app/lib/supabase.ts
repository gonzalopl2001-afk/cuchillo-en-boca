import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Tipos de la base de datos ───────────────────────────────────────────────

export type Sport = 'gym' | 'padel' | 'tenis' | 'running'

export interface Session {
  id: string
  user_id: string
  sport: Sport
  date: string
  duration_min: number | null
  notes: string | null
  garmin_activity_id: string | null
  garmin_data: Record<string, unknown> | null
  created_at: string
}

export interface GymSet {
  id: string
  session_id: string
  exercise: string
  weight_kg: number
  sets: number
  reps: number
  rpe: number | null
  is_pr: boolean
  created_at: string
}

export interface Person {
  id: string
  user_id: string
  name: string
  sports: Sport[]
  note: string | null
  created_at: string
}

export interface Match {
  id: string
  session_id: string
  person_id: string | null
  mode: 'solo' | 'compania' | 'rival'
  result: 'win' | 'loss' | 'draw' | null
  score: string | null
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  target_date: string
  level: string
  target_value: string | null
  total_weeks: number
  phases: unknown
  created_at: string
}

export interface GarminSync {
  id: string
  user_id: string
  synced_at: string
  sleep_hours: number | null
  hrv: number | null
  body_battery: number | null
  recovery_score: number | null
  raw: Record<string, unknown> | null
}
