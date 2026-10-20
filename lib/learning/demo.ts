import { shiftDay } from "./model";
import type { LearningData } from "./types";
export function createLearningDemo(today: string): LearningData {
  return {
    version: 1,
    habits: [
      {
        id: "english",
        title: "Tiếng Anh mỗi ngày",
        intention: "15 phút nghe, 5 từ mới. Chậm cũng được, đừng dừng.",
        minutes: 20,
        created: shiftDay(today, -6),
        archived: false,
        entries: Array.from({ length: 6 }, (_, i) => ({
          date: shiftDay(today, i - 6),
          minutes: 20,
          note: i === 5 ? "Shadowing một đoạn hội thoại và ôn 5 từ mới." : "",
        })),
      },
      {
        id: "learn",
        title: "Học thêm một điều mới",
        intention: "Một khái niệm, một trang sách hoặc một đoạn code tự hiểu.",
        minutes: 15,
        created: shiftDay(today, -13),
        archived: false,
        entries: Array.from({ length: 13 }, (_, i) => ({
          date: shiftDay(today, i - 13),
          minutes: 15,
          note:
            i === 12 ? "Tự giải thích lại kiến thức bằng lời của mình." : "",
        })),
      },
    ],
  };
}
