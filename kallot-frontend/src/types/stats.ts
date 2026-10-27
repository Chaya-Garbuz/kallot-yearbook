import type { ClassStat } from "./classes"

export type Yearbook = {
    name: string,
    hebrewYear: string
}

export type Totals = {
    kallot: number,
    girls: number,
    percent: number,
    classes: number,
    yeshivot: number
}

export type AllStats = {
    yearbook: Yearbook,
    totals: Totals,
    classes: ClassStat[],
    specializations: ClassStat[]
}


