import { withOwner } from "@/lib/auth/api";
import { portfolioRequest } from "@/lib/portfolio/server";
export const GET = withOwner((request) => portfolioRequest(request, "history"));
