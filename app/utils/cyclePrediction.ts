// utils/cyclePrediction.ts

/*
    This file contains utility functions for analyzing daily logs to predict menstrual cycle information.
    It defines types for daily logs and cycles.

    The main functions include:
    - buildCycles: Takes an array of daily logs and identifies menstrual cycles based on bleeding patterns, returning an array of Cycle objects with start and end dates, and cycle lengths.
    - getAverageCycleLength: Calculates the average cycle length from an array of Cycle objects, which is used for predicting future cycles and understanding cycle patterns.
    - predictNextPeriod: Predicts the start date of the next period based on the average cycle length calculated from past cycles.
    - getCycleProgress: Determines the user's current position in their cycle (cycle day and phase) based on the detected cycles and today's date.
    - getCycleInfo: Main function that takes daily logs and returns comprehensive cycle information including the current cycle day, phase, average cycle length, and the start date of the current cycle.

    Key features:
    - Uses date-fns for date manipulation and calculations.
    - Handles edge cases such as missing logs, irregular cycles, and cycles that span across the current date.
    - Provides detailed cycle information that can be used to enhance the user experience in the app, such as displaying cycle progress and making predictions about future cycles.

*/

// Imports
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";

// Type definitions for daily logs
export type DailyLog = {
    bleeding: "None" | "Light" | "Medium" | "Heavy"; // Level of bleeding for the day
    symptoms: string[]; // List of symptoms experienced on that day
    date: string; // Date of the log entry 
    notes?: string; // Optional notes for the day
};

// Type definition for a menstrual cycle
export type Cycle = {
    startDate: string; // Start date of the cycle (first day of bleeding)
    endDate: string; // End date of the cycle (last day of bleeding)
    cycleLength?: number; // Length of the cycle in days
};

export function buildCycles(logs: DailyLog[]): Cycle[] {
    // If there are no logs, return an empty array of cycles
    if (!logs.length) return [];

    // Sort logs by date to ensure they are in chronological order for cycle detection
    const sorted = [...logs].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Initialize an array to hold detected cycles and a variable to track the start date of the current cycle
    const cycles: Cycle[] = [];
    let startDate: string | null = null;
    const today = new Date();

        // Iterate through the sorted logs to identify cycles based on bleeding patterns
        for (let i = 0; i < sorted.length; i++) {

            // Set current log and the next log for comparison to determine cycle boundaries
            const current = sorted[i];
            const next = sorted[i + 1];

            // Determine if the user is bleeding today based on the current log's bleeding level
            const bleedingToday = current.bleeding !== "None";

            // If the user is bleeding today and we haven't already marked the start of a cycle, set the start date to the current log's date
            if (bleedingToday && !startDate) {
                startDate = current.date;
            }

            // If we have a start date for the current cycle, we need to check if the cycle has ended based on the next log's bleeding status and the gap between logs
            if (!startDate) continue;

            // Parse the current and next log dates for comparison
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

            // If the cycle has ended based on the above conditions, push the cycle with its start and end dates to the cycles array and reset the start date for the next cycle detection
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
        // Identify the length of the cycle by calculating the difference in days between the start date of the current cycle and the start date of the next cycle, or between the start and end dates for the last cycle
        if (i < cycles.length - 1) {
            cycles[i].cycleLength = differenceInCalendarDays(
                parseISO(cycles[i + 1].startDate),
                parseISO(cycles[i].startDate)
            );
        } else {
        // 
            cycles[i].cycleLength =
                differenceInCalendarDays(
                parseISO(cycles[i].endDate),
                parseISO(cycles[i].startDate)
                ) + 1;
        }
    }

    return cycles;
}

// Function to calculate the average cycle length from an array of cycles, which is used for predicting future cycles and understanding cycle patterns
export function getAverageCycleLength(cycles: Cycle[]) {

    // If there are no cycles, return null as we cannot calculate an average cycle length
    if (!cycles.length) return null;

    // If there is only one cycle, return its length as the average, since we don't have enough data to calculate a true average
    if (cycles.length === 1) {
        return cycles[0].cycleLength ?? null;
    }

    // For multiple cycles, we calculate the average cycle length by taking the lengths of all completed cycles (excluding the current ongoing cycle if it exists) and averaging them
    const completedCycles = cycles.slice(0, -1);

    // The lengths array contains the cycle lengths of all completed cycles, filtering out any cycles that do not have a defined length
    const lengths = completedCycles
        .map((c) => c.cycleLength)
        .filter((l): l is number => typeof l === "number");
    
    // If there are no valid cycle lengths to average, return null
    if (!lengths.length) return null;

    // Calculate the average cycle length by summing all the cycle lengths and dividing by the number of cycles, then rounding to the nearest whole number for a more user-friendly prediction
    const total = lengths.reduce((sum, l) => sum + l, 0);
    return Math.round(total / lengths.length);
}

// Function to predict the start date of the next period based on the average cycle length calculated from past cycles
export function predictNextPeriod(cycles: Cycle[]) {

    // If there are no cycles, we cannot make a prediction, so we return null
    if (!cycles.length) return null;

    // Calculate the average cycle length using the getAverageCycleLength function
    const avg = getAverageCycleLength(cycles);
    if (!avg) return null;

    // Predict the next period start date by adding the average cycle length to the start date of the last cycle
    const last = cycles[cycles.length - 1];
    if (!last.startDate) return null;

    // Use the addDays function from date-fns to calculate the predicted next period start date by adding the average cycle length to the last cycle's start date
    return addDays(parseISO(last.startDate), avg);
}

// Function to get the current cycle progress
export function getCycleProgress(cycles: Cycle[]) {

    // If there are no cycles, we cannot determine cycle progress, so we return null
    if (!cycles.length) return null;

    // Get the last cycle from the cycles array
    const last = cycles[cycles.length - 1];
    if (!last.startDate) return null;

    // Get today
    const today = new Date();

    // Set the start and end dates of the last cycle 
    const start = parseISO(last.startDate);
    const end = parseISO(last.endDate);

    // If today is before the start of the last cycle, we are between cycles, so we return null for cycleDay and indicate that we are between cycles
    if (today > end) {
        return {
            cycleDay: null,
            avgLength: getAverageCycleLength(cycles),
            status: "between",
        };
    }

    // If today is within the current cycle, we calculate the current cycle day by finding the difference in calendar days between today and the start of the cycle, and adding 1 to convert from a 0-based index to a 1-based cycle day count
    const cycleDay = differenceInCalendarDays(today, start) + 1;

    return {
        cycleDay: cycleDay,
        avgLength: getAverageCycleLength(cycles),
        status: "in_cycle",
    };

}

// Main function to get cycle information based on daily logs
export function getCycleInfo(logs: DailyLog[]) {

    // Get cycles and progress from the logs using the buildCycles and getCycleProgress functions
    const cycles = buildCycles(logs);
    const progress = getCycleProgress(cycles);

    // If there are no cycles detected from the logs, we cannot provide cycle information, so we return null values 
    if (cycles.length === 0) {
        return {
            cycleDay: null,
            currentPhase: null,
            avgLength: null,
            cycleStartDate: null,
        };
    }

    // Set today and get the last cycle to determine the current cycle day and phase based on the user's logs
    const today = new Date();
    const lastCycle = cycles[cycles.length - 1];
    const lastPeriodStart = new Date(lastCycle.startDate);

    // Calculate the current cycle day by finding the difference in calendar days between today and the start of the last cycle, and adding 1 to convert from a 0-based index to a 1-based cycle day count
    const cycleDay = differenceInCalendarDays(today, lastPeriodStart) + 1;
    
    // Determine the length of the period phase for the last cycle
    const periodLength = lastCycle.cycleLength || 5;

    // Set standard lengths for ovulation and luteal phases, and calculate the follicular phase length based on the average cycle length minus the other phases
    const ovulationLength = 2;
    const lutealLength = 14;
    const follicularLength = Math.max(
        (progress?.avgLength || 28) - periodLength - ovulationLength - lutealLength,
        0
    );

    // Define the different phases of the cycle with their respective lengths
    const phases = [
        { name: "Menstrual", length: periodLength },
        { name: "Follicular", length: follicularLength },
        { name: "Ovulation", length: ovulationLength },
        { name: "Luteal", length: lutealLength },
    ];

    // Set the running value and currentPhase to determine which phase the user is currently in based on the cycle day and the lengths of each phase
    let running = 0;
    let currentPhase = "Luteal";

    // Iterate through the phases and accumulate their lengths until we find the phase that corresponds to the current cycle day, which indicates the user's current phase in their menstrual cycle
    for (const phase of phases) {
        running += phase.length;
        if (cycleDay <= running) {
            currentPhase = phase.name;
            break;
        }
    }

    // Return the cycle information
    return {
        cycleDay,
        currentPhase,
        avgLength: progress?.avgLength || 28,
        cycleStartDate: lastCycle.startDate,
    };
}
