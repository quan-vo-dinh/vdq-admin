import { withOwner } from "@/lib/auth/api";
import { connectionRequest } from "@/lib/developer/live/service";
import { GitHubError } from "@/lib/developer/live/github";
const handle = withOwner(async (request) => {
  try {
    return await connectionRequest(request);
  } catch (error) {
    if (error instanceof GitHubError)
      return Response.json(
        { code: error.code },
        { status: 502, headers: { "Retry-After": String(error.retryAfter) } },
      );
    throw error;
  }
});
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
