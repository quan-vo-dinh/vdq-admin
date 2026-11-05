import "server-only";
import { AccessError } from "@/lib/auth/policy";
import { codexManagement } from "../codex/server";
export async function deviceRequest(request: Request) {
  if (request.method !== "GET")
    throw new AccessError(409, "use_codex_connections");
  return codexManagement(request);
}
