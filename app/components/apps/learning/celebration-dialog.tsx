"use client";

import { Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { useLearningLocale } from "./locale";
import type { Celebration } from "./types";
export function CelebrationDialog({
  celebration,
  onClose,
}: {
  celebration: Celebration | null;
  onClose: () => void;
}) {
  const { t } = useLearningLocale();
  return (
    <Dialog
      open={!!celebration}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="sm"
        className="learning-celebration"
        closeLabel={t("Đóng", "Close")}
      >
        <DialogHeader>
          <div className="learning-trophy">
            <Trophy aria-hidden="true" />
          </div>
          <DialogTitle>
            {celebration?.milestone
              ? t(
                  `Chạm mốc ${celebration.days} ngày rồi!`,
                  `${celebration.days} days. You did that!`,
                )
              : t("Thêm một ngày giữ lời!", "Another promise kept!")}
          </DialogTitle>
          <DialogDescription>
            {celebration?.title} · {celebration?.days}{" "}
            {t("ngày liên tiếp", "day streak")}.{" "}
            {t(
              "Một bước nhỏ hôm nay, một phiên bản tốt hơn ngày mai.",
              "One small step today. A better you tomorrow.",
            )}
          </DialogDescription>
        </DialogHeader>
        {celebration?.milestone && (
          <div className="learning-confetti" aria-hidden="true">
            {Array.from({ length: 36 }, (_, i) => (
              <span
                key={i}
                style={{
                  left: `${(i * 37) % 100}%`,
                  animationDelay: `${(i % 7) * 0.08}s`,
                  transform: `rotate(${i * 43}deg)`,
                  background: `var(--chart-${(i % 5) + 1})`,
                }}
              />
            ))}
          </div>
        )}
        <DialogFooter>
          <Button onClick={() => onClose()}>
            <Sparkles data-icon="inline-start" />
            {t("Mai lại tiếp nhé", "See you tomorrow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
