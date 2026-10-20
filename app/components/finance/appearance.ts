import {
  Utensils,
  House,
  CarFront,
  ShoppingBag,
  GraduationCap,
  Clapperboard,
  Shapes,
  BriefcaseBusiness,
  Laptop,
  ArrowLeftRight,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import type { TransactionKind } from "@/lib/finance/model";

export type FinanceTone =
  "income" | "expense" | "balance" | "goal" | "warning" | "danger" | "neutral";
export const transactionTone: Record<TransactionKind, FinanceTone> = {
  income: "income",
  expense: "expense",
  transfer: "balance",
  refund: "income",
};
const categoryIcons: Record<string, LucideIcon> = {
  food: Utensils,
  home: House,
  transport: CarFront,
  shopping: ShoppingBag,
  learning: GraduationCap,
  fun: Clapperboard,
  other: Shapes,
  salary: BriefcaseBusiness,
  freelance: Laptop,
  transfer: ArrowLeftRight,
};
export function categoryIcon(category: string) {
  return categoryIcons[category] ?? Shapes;
}
export function transactionIcon(kind: TransactionKind, category: string) {
  return kind === "refund"
    ? RotateCcw
    : kind === "transfer"
      ? ArrowLeftRight
      : categoryIcon(category);
}
