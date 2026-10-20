import { withOwner } from "@/lib/auth/api";
import { NextResponse } from "next/server";
import { financeDemo } from "@/lib/finance/demo";

// Read-only demonstration dataset. UI changes stay in the current client session.
async function handleGET() {
  return NextResponse.json(financeDemo(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export const GET = withOwner(handleGET);
