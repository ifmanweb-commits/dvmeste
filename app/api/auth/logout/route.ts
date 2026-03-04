import { NextResponse } from 'next/server'
import { removeSession } from '@/lib/auth/session'

export const runtime = 'nodejs'

export async function POST() {
  try {
    await removeSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}