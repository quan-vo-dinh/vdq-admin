import { withOwner } from "@/lib/auth/api";
import { portfolioRequest } from "@/lib/portfolio/server";
export const POST = withOwner((request) =>
  portfolioRequest(request, "publish"),
);
