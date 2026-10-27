import type { Yeshiva } from "../types/yeshivot";

const COLORS = [
  "#f6c1c1",
  "#c8e6c9",
  "#bbdefb",
  "#fff3b0",
  "#e1bee7",
  "#ffd8b1",
  "#b2ebf2",
  "#d7ccc8",
  "#f8bbd0",
  "#dcedc8",
];

export function buildYeshivaColors(yeshivot: Yeshiva[]): Record<string, string> {
  const colors: Record<string, string> = {};

  yeshivot.forEach((yeshiva, index) => {
    colors[yeshiva.id] = COLORS[index % COLORS.length];
  });

  return colors;
}