import { withOwner } from "@/lib/auth/api";
import { NextResponse } from 'next/server'
import { gallery } from '../userdata'

async function handleGET() {
  try {
    return NextResponse.json({ status: 200, msg: 'Success', data: gallery })
  } catch (error: unknown) {
    return NextResponse.json({
      status: 200,
      msg: 'Internal server error',
      error,
    })
  }
}

export const GET = withOwner(handleGET);
