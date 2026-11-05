export class GitHubError extends Error {
  constructor(
    public code: string,
    public retryAfter = 60,
  ) {
    super(code);
  }
}
export async function github<T>(
  token: string,
  path: string,
  method = "GET",
): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://"))
    throw new GitHubError("invalid_upstream_path");
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const retry = Number(response.headers.get("retry-after"));
    throw new GitHubError(
      response.status === 401
        ? "credential_expired"
        : response.status === 429 ||
            response.headers.get("x-ratelimit-remaining") === "0"
          ? "rate_limited"
          : response.status === 403
            ? "permission_required"
            : response.status === 404
              ? "repository_unavailable"
              : "upstream_unavailable",
      Math.max(60, Number.isFinite(retry) ? retry : 60),
    );
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}
export type GitHubUser = { id: number; login: string };
export type Repository = {
  id: number;
  full_name: string;
  default_branch: string;
};
export async function verifyToken(token: string) {
  return github<GitHubUser>(token, "/user");
}
