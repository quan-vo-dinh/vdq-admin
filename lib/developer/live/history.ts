import "server-only";
import { serverSupabase } from "@/lib/supabase/server";
import { dbError } from "@/lib/backend/mutations";
import { documents, putDocument } from "./store";
import { decrypt } from "./crypto";
import { GitHubError } from "./github";
import { advanceHistory } from "./history-engine";
import type { HistoryJob, GitHubTotals } from "./history-model";
import type { LiveConnection } from "./types";

// Called under the connection lease shared with Inbox synchronization. Write
// absolute facts before advancing the cursor; retrying a failed save is safe.
export async function historyStep(connection: LiveConnection) {
  const stored = (await documents<HistoryJob>("history")).find(
    (r) => r.id === connection.id,
  )?.value;
  if (stored?.retryAt && stored.retryAt > Date.now())
    return Response.json({
      done: false,
      retryAfter: Math.ceil((stored.retryAt - Date.now()) / 1000),
    });
  try {
    const { job, facts } = await advanceHistory(
      decrypt(connection.credential),
      connection.id,
      stored,
    );
    if (facts.length) {
      const unique = [...new Map(facts.map((f) => [f.event_key, f])).values()];
      const db = await serverSupabase();
      const { error } = await db
        .from("github_history_events")
        .upsert(unique, { onConflict: "owner_id,source_id,event_key" });
      dbError(error);
    }
    await putDocument("history", connection.id, job);
    return Response.json({
      done: !!job.completedAt,
      remaining: job.queue.length,
      complete: job.completed,
    });
  } catch (error) {
    if (error instanceof GitHubError) {
      if (stored)
        await putDocument("history", connection.id, {
          ...stored,
          error: error.code,
          retryAt: Date.now() + error.retryAfter * 1000,
        });
      return Response.json({
        done: false,
        retryAfter: error.retryAfter,
        code: error.code,
      });
    }
    throw error;
  }
}
export async function historyTotals(
  connections: LiveConnection[],
  today: string,
): Promise<GitHubTotals[]> {
  const db = await serverSupabase();
  const [result, jobs] = await Promise.all([
    db.rpc("github_history_totals", { p_today: today }),
    documents<HistoryJob>("history"),
  ]);
  dbError(result.error);
  return connections.flatMap((c) =>
    (["all", "year", "month"] as const).map((period) => {
      const row = result.data?.find(
          (r) => r.source_id === c.id && r.period === period,
        ),
        job = jobs.find((j) => j.id === c.id)?.value;
      return {
        sourceId: c.id,
        period,
        contributions: Number(row?.contributions ?? 0),
        prs: Number(row?.prs ?? 0),
        additions: Number(row?.additions ?? 0),
        deletions: Number(row?.deletions ?? 0),
        complete: job?.completed ?? {
          contributions: false,
          prs: false,
          lines: false,
        },
        observedAt: job?.completedAt ?? job?.previousCompletedAt ?? null,
        error: job?.error ?? null,
      };
    }),
  );
}
