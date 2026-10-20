import { withOwner } from "@/lib/auth/api";
import { calendarRequest } from "@/lib/calendar/server";
export const GET = withOwner(calendarRequest);
export const POST = withOwner(calendarRequest);
export const PUT = withOwner(calendarRequest);
export const DELETE = withOwner(calendarRequest);
export const PATCH = withOwner(calendarRequest);
