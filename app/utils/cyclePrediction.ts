// utils/cyclePrediction.ts
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";

export type DailyLog = {
    bleeding: "None" | "Light" | "Medium" | "Heavy";
    symptoms: string[];
    date: string;
};

export type Cycle = {
    startDate: string; 
    endDate: string;
    cycleLength?: number;
};

export function buildCycles(logs: DailyLog[]): Cycle[] {
  if (!logs.length) return [];

  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const cycles: Cycle[] = [];
  let startDate: string | null = null;
  const today = new Date();

    for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        const bleedingToday = current.bleeding !== "None";

        if (bleedingToday && !startDate) {
        startDate = current.date;
        }

        if (!startDate) continue;

        const currentDate = parseISO(current.date);
        const nextDate = next ? parseISO(next.date) : null;
        const bleedingNext = next?.bleeding !== "None";

        // End cycle if:
        // 1. Next day is not bleeding
        // 2. Gap to next log > 1 day
        // 3. Next log is after today (we treat this as end of past cycle)
        // 4. Last log in dataset
        const endCycle =
        !next ||                       // last log
        !bleedingNext ||               // next day not bleeding
        (nextDate && differenceInCalendarDays(nextDate, currentDate) > 1) ||
        (nextDate && nextDate > today && currentDate < today);

        if (endCycle) {
        cycles.push({
            startDate,
            endDate: current.date,
        });
        startDate = null;
        }
    }

  // Calculate cycle lengths
  for (let i = 0; i < cycles.length; i++) {
    if (i < cycles.length - 1) {
      cycles[i].cycleLength = differenceInCalendarDays(
        parseISO(cycles[i + 1].startDate),
        parseISO(cycles[i].startDate)
      );
    } else {
      cycles[i].cycleLength =
        differenceInCalendarDays(
          parseISO(cycles[i].endDate),
          parseISO(cycles[i].startDate)
        ) + 1;
    }
  }

  return cycles;
}


export function getAverageCycleLength(cycles: Cycle[]) {
    if (!cycles.length) return null;

    if (cycles.length === 1) {
        return cycles[0].cycleLength ?? null;
    }

    const completedCycles = cycles.slice(0, -1);

    const lengths = completedCycles
        .map((c) => c.cycleLength)
        .filter((l): l is number => typeof l === "number");
    
    if (!lengths.length) return null;

    const total = lengths.reduce((sum, l) => sum + l, 0);
    return Math.round(total / lengths.length);
}

export function predictNextPeriod(cycles: Cycle[]) {
    if (!cycles.length) return null;

    const avg = getAverageCycleLength(cycles);
    if (!avg) return null;

    const last = cycles[cycles.length - 1];
    if (!last.startDate) return null;

    return addDays(parseISO(last.startDate), avg);
}

export function getCycleProgress(cycles: Cycle[]) {
    if (!cycles.length) return null;

    const last = cycles[cycles.length - 1];
    if (!last.startDate) return null;

    const today = new Date();

    const start = parseISO(last.startDate);
    const end = parseISO(last.endDate);

    if (today > end) {
        return {
            cycleDay: null,
            avgLength: getAverageCycleLength(cycles),
            status: "between",
        };
    }

    const cycleDay = differenceInCalendarDays(today, start) + 1;

    return {
        cycleDay: cycleDay,
        avgLength: getAverageCycleLength(cycles),
        status: "in_cycle",
    };

}

