"use client";
import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  todayKey,
  streaks,
  milestones,
  withCheckIn,
} from "@/lib/learning/model";
import { createLearningDemo } from "@/lib/learning/demo";
import type { LearningHabit, HabitValues } from "@/lib/learning/types";
function subscribe(callback: () => void) {
  const timer = setInterval(callback, 15_000);
  return () => clearInterval(timer);
}
// UI prototype only: changes live in this provider and reset on a full reload.
function useLearningState() {
  const today = useSyncExternalStore(subscribe, todayKey, todayKey);
  const [state, setState] = useState(() => createLearningDemo(today));
  function change(
    id: string,
    transform: (habit: LearningHabit) => LearningHabit,
  ) {
    setState((previous) => ({
      ...previous,
      habits: previous.habits.map((h) => (h.id === id ? transform(h) : h)),
    }));
  }
  function createHabit(values: HabitValues) {
    const habit: LearningHabit = {
      id: crypto.randomUUID(),
      title: values.title,
      intention: values.intention,
      minutes: values.minutes,
      created: today,
      archived: false,
      entries: [],
    };
    setState((previous) => ({
      ...previous,
      habits: [...previous.habits, habit],
    }));
  }
  function editHabit(id: string, values: HabitValues) {
    change(id, (h) => ({
      ...h,
      title: values.title,
      intention: values.intention,
      minutes: values.minutes,
    }));
  }
  function setArchived(id: string, archived: boolean) {
    change(id, (h) => ({ ...h, archived }));
  }
  function undoCheckIn(id: string) {
    change(id, (h) => ({
      ...h,
      entries: h.entries.filter((e) => e.date !== today),
    }));
  }
  function checkIn(id: string, minutes: number, note: string) {
    const habit = state.habits.find((h) => h.id === id);
    if (!habit) return null;
    const existed = habit.entries.some((e) => e.date === today);
    const next = withCheckIn(habit, today, minutes, note);
    change(id, (h) => withCheckIn(h, today, minutes, note));
    const days = streaks(next.entries, today).current;
    return existed
      ? null
      : {
          title: habit.title,
          days,
          milestone: milestones.includes(days) || days % 365 === 0,
        };
  }
  return {
    data: { ...state, today },
    createHabit,
    editHabit,
    setArchived,
    undoCheckIn,
    checkIn,
  };
}
const LearningContext = createContext<ReturnType<
  typeof useLearningState
> | null>(null);
export function LearningProvider({ children }: { children: ReactNode }) {
  const state = useLearningState();
  return (
    <LearningContext.Provider value={state}>
      {children}
    </LearningContext.Provider>
  );
}
export function useLearning() {
  const context = useContext(LearningContext);
  if (!context)
    throw new Error("useLearning must be used inside LearningProvider");
  return context;
}
