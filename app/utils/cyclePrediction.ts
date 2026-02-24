// utils/cyclePrediction.ts
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";

export type DailyLog = {
    id: string;
    bleeding: string;
    symptoms: string[];
    date?: string;
};

export type Cycle = {
    startDate: string; 
    endDate: string;
    length: number;
};

export function buildCycles(logs: DailyLog[]): Cycle[] {
    if (!logs.length) return [];

    const sorted = [...logs].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
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
            startDate = today.date;
        }

        if (!bleedingToday && bleedingPrev && inCycle && startDate) {
            const length = differenceInCalendarDays(parseISO(prev.date), parseISO(startDate)) + 1;

            cycles.push({
                startDate,
                endDate: prev.date,
                length,
            });

            inCycle = false;
            startDate = null;
        }
    
    }

    return cycles;
}

export function getAverageCycleLength(cycles: Cycle[]) {
    if (!cycles.length) return null;

    const total = cycles.reduce((sum, c) => sum + c.length, 0);
    return Math.round(total / cycles.length);
}

export function predictNextPeriod(cycles: Cycle[]) {
    if (cycles.length === 0) return null;

    const last = cycles[cycles.length - 1];
    const avg = getAverageCycleLength(cycles);
    if (!avg) return null;

    return addDays(parseISO(last.startDate), avg);
}

export function getCycleProgress(cycles: Cycle[]) {
    if (!cycles.length) return null;

    const last = cycles[cycles.length - 1];
    const today = new Date();

    const day = differenceInCalendarDays(today, parseISO(last.startDate)) + 1;
    const avg = getAverageCycleLength(cycles);

    return {
        cycleDay: day,
        avgLength: avg,
    }
}
