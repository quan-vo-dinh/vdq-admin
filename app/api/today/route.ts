import { withOwner } from "@/lib/auth/api";
import { todayRequest } from "@/lib/today/server";
export const GET = withOwner(todayRequest);
export const POST = withOwner(todayRequest);
export const PATCH = withOwner(todayRequest);
export const DELETE = withOwner(todayRequest);
