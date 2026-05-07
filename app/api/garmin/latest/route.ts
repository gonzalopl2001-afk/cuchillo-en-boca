// app/api/garmin/latest/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET() {
  const userId = 'gonzalo'

  const { data, error } = await supabase
    .from('garmin_syncs')
    .select('*')
    .eq('user_id', userId)
    .order('synced_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return NextResponse.json({ ok: false, data: null })
  return NextResponse.json({ ok: true, data })
}
