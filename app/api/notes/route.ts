import { withOwner } from "@/lib/auth/api";
import { notesRequest } from "@/lib/notes/server";
export const GET = withOwner(notesRequest);
export const POST = withOwner(notesRequest);
export const PUT = withOwner(notesRequest);
export const DELETE = withOwner(notesRequest);
