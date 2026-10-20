import type { Metadata } from "next";
import LearningApp from "@/app/components/apps/learning";
export const metadata: Metadata = {
  title: "Daily Learning | Học mỗi ngày",
  description:
    "Không gian điểm danh học tập, duy trì chuỗi ngày và theo dõi hành trình học mỗi ngày.",
};
export default function LearningPage() {
  return <LearningApp />;
}
