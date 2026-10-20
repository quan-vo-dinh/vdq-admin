import { NextResponse } from "next/server";
import { financeDemo } from "@/lib/finance/demo";

// Read-only demonstration dataset. UI changes stay in the current client session.
export async function GET() {
  return NextResponse.json(financeDemo(), {
    headers: { "Cache-Control": "no-store" },
  });
}
