"use client";

import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import {
  Bike,
  GraduationCap,
  House,
  Plane,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { GoalVisual } from "@/lib/finance/model";
import { useFinanceLocale } from "./locale";

type GoalVisualOption = {
  label: string;
  image: string;
  icon: LucideIcon;
};

export const goalVisuals: Record<GoalVisual, GoalVisualOption> = {
  emergency: {
    label: "Quỹ dự phòng",
    icon: ShieldCheck,
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
  },
  bike: {
    label: "Xe cộ",
    icon: Bike,
    image:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80",
  },
  phone: {
    label: "Thiết bị",
    icon: Smartphone,
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  },
  move: {
    label: "Nhà ở",
    icon: House,
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
  },
  study: {
    label: "Học tập",
    icon: GraduationCap,
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
  },
  travel: {
    label: "Du lịch",
    icon: Plane,
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80",
  },
};

export function GoalCover({
  visual,
  alt,
  image,
}: {
  visual?: GoalVisual;
  alt: string;
  image?: string;
}) {
  const option = goalVisuals[visual ?? "study"];
  const Icon = option.icon;
  return (
    <div className="finance-goal-cover">
      <Image src={image || option.image} alt={alt} fill sizes="(max-width: 640px) 90vw, 40vw" unoptimized={Boolean(image)} />
      <span className="finance-goal-cover-icon" aria-hidden="true">
        <Icon />
      </span>
    </div>
  );
}

export function GoalVisualPicker({
  value,
  onChange,
}: {
  value: GoalVisual;
  onChange: (value: GoalVisual) => void;
}) {
  const { text } = useFinanceLocale();
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        const next = Array.isArray(values) ? values[0] : values;
        if (next && next in goalVisuals) onChange(next as GoalVisual);
      }}
      aria-label={text("Biểu tượng mục tiêu")}
      className="finance-goal-visual-picker"
    >
      {Object.entries(goalVisuals).map(([key, option]) => {
        const Icon = option.icon;
        return (
          <ToggleGroupItem key={key} value={key} aria-label={text(option.label)}>
            <span className="finance-goal-visual-option">
              <Image src={option.image} alt="" fill sizes="120px" />
              <Icon />
            </span>
            <span>{text(option.label)}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
