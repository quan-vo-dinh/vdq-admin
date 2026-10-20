"use client";
import { LearningProvider } from "@/app/context/learning-context";
import { LearningWorkspace } from "./learning-workspace";
export default function LearningApp() {
  return (
    <LearningProvider>
      <LearningWorkspace />
    </LearningProvider>
  );
}
