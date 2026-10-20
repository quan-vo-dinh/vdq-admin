"use client";

import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function AlertGradient({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <Alert className="finance-budget-alert" role="status">
      <span className="finance-budget-alert-icon" aria-hidden="true">
        <CircleAlert />
      </span>
      <div className="finance-budget-alert-copy">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </div>
      {action}
    </Alert>
  );
}
