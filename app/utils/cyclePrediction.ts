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
        (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()
    );

    const cycles: Cycle[] = [];
    let inCycle = false;
    let startDate: string | null = null;

    for (let i = 0; i < sorted.length; i++) {
        const today = sorted[i];
        const prev = sorted[i - 1];

        const bleedingToday =today.bleeding !== "None";
        const bleedingPrev = prev?.bleeding !== "None";

        if (bleedingToday && !bleedingPrev && !inCycle) {
            inCycle = true;
            startDate = today.date!;
        }

        if (!bleedingToday && bleedingPrev && inCycle && startDate) {

            cycles.push({
                startDate,
                endDate: prev.date!,
            });

            inCycle = false;
            startDate = null;
        }

        
    
    }

    if (inCycle && startDate) {
        cycles.push({
            startDate,
            endDate: sorted[sorted.length - 1].date!,
        });
    }

    for (let i = 0; i < cycles.length; i++) {
        if (i < cycles.length - 1) {
            cycles[i].cycleLength = differenceInCalendarDays(
                parseISO(cycles[i + 1].startDate),
                parseISO(cycles[i].startDate)
            );
        } else {
            cycles[i].cycleLength = differenceInCalendarDays(
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

    const comepletedCycles = cycles.slice(0, -1);

    const lengths = comepletedCycles
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

