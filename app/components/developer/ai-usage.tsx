"use client";
import { NumberTicker } from "@/components/ui/number-ticker";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useDeveloper } from "@/app/context/developer-context";
import { selectSessions } from "@/lib/developer/model";
import { modelName } from "@/lib/developer/models";
import { ModelUsage } from "./model-usage";
import { Choice, useDeveloperLocale } from "./shared";
export function AIUsage() {
  const { data, days } = useDeveloper();
  const { text } = useDeveloperLocale();
  const [provider, setProvider] = useState("all");
  const [source, setSource] = useState("all");
  const [model, setModel] = useState("all");
  const accounts = data.sources.filter(
    (s) =>
      s.provider !== "GitHub" &&
      (provider === "all" || s.provider === provider),
  );
  const models = [
    ...new Set(
      selectSessions(data, days, source, provider).map((s) => s.model),
    ),
  ];
  const rows = selectSessions(data, days, source, provider, model);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Choice
          label="Provider"
          value={provider}
          onChange={(v) => {
            setProvider(v);
            setSource("all");
            setModel("all");
          }}
          items={[
            { value: "all", label: text("Mọi provider", "All providers") },
            ...["Codex", "Claude Code"].map((value) => ({
              value,
              label: value,
            })),
          ]}
        />
        <Choice
          label={text("Tài khoản", "Account")}
          value={source}
          onChange={(v) => {
            setSource(v);
            setModel("all");
          }}
          items={[
            { value: "all", label: text("Mọi tài khoản", "All accounts") },
            ...accounts.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        <Choice
          label="Model"
          value={model}
          onChange={setModel}
          items={[
            { value: "all", label: text("Mọi model", "All models") },
            ...[
              ...new Set([...models, ...(model !== "all" ? [model] : [])]),
            ].map((value) => ({ value, label: modelName(value) })),
          ]}
        />
        <Badge variant="outline">
          <NumberTicker value={rows.length} /> {text("phiên", "sessions")} · {days}{" "}
          {text("ngày", "days")}
        </Badge>
      </div>
      <ModelUsage rows={rows} />
    </div>
  );
}
