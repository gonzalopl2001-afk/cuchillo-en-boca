// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

const USER_ID = 'gonzalo'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sport = searchParams.get('sport')
  const limit = parseInt(searchParams.get('limit') || '20')

  let query = supabase
    .from('sessions')
    .select('*, gym_sets(*), matches(*, persons(*))')
    .eq('user_id', USER_ID)
    .order('date', { ascending: false })
    .limit(limit)

  if (sport) query = query.eq('sport', sport)

  const { data, error } = await query
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({ ...body, user_id: USER_ID })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data: session })
}
