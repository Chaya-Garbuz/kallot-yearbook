
import type { Yearbook } from "./stats";

export type ClassOption = {
  id: string;
  name: string;
};

export type ClassesByCodeResponse = {
  yearbook:Yearbook
  classes: ClassOption[];
};

export type ClassStat = ClassOption & {
  size: number;
  kallotCount: number;
  percent: number;
};