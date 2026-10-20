import { withOwner } from "@/lib/auth/api";
import { Chance } from 'chance'
import { NextResponse } from 'next/server'
import { users } from '../userdata'

const chance = new Chance()

async function handleGET() {
  try {
    return NextResponse.json({ status: 200, msg: 'Success', data: users })
  } catch (error: unknown) {
    return NextResponse.json({
      status: 200,
      msg: 'Internal server error',
      error,
    })
  }
}

export const GET = withOwner(handleGET);
