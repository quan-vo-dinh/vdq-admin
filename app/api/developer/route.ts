import { withOwner } from "@/lib/auth/api";
import { developerDemo } from "@/lib/developer/demo";
function handleGET() {
  return Response.json(developerDemo(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export const GET = withOwner(handleGET);
