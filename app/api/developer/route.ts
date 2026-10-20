import { developerDemo } from "@/lib/developer/demo";
export function GET() {
  return Response.json(developerDemo(), {
    headers: { "Cache-Control": "no-store" },
  });
}
