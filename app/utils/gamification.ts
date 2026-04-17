// app/utils/gamification.ts

/*
    This file contains utility functions for the gamification system of the app. 
    This includes:
    - Type definitions for daily logs, badges, and overall gamification stats.
    - Functions to calculate the user's current streak of logging, longest streak, total XP earned, current level, and badges earned based on their daily logs.
    - The gamification system is designed to motivate users to consistently log their symptoms and engage with the app by rewarding them with badges for their achievements.
    
    Note: The XP and leveling system is currently not active in the app, but the code for calculating XP and levels is still present in this file and can be re-enabled in the future if desired.

    Key features:
    - Calculates current and longest streaks of logging based on the dates of the user's daily logs.
    - Calculates total XP earned based on the number of logs, presence of notes, number of symptoms logged, and current streak.
    - Determines the user's current level and the XP thresholds for the current and next levels based on their total XP.
    - Defines a set of badges with specific criteria for earning them, and calculates which badges the user has earned based on their logging activity.
    - The main function `computeGamificationStats` takes the user's daily logs as input and returns an object containing all the relevant gamification stats to be displayed in the app.
    
*/

// Imports
import { differenceInCalendarDays, format, subDays } from "date-fns";

// Type for daily log entries
type DailyLog = {
    id: string; // Unique identifier for the log
    bleeding: "None" | "Light" | "Medium" | "Heavy"; // Bleeding level for the day
    symptoms:  {name: string; intensity?: number}[]; // List of symptoms logged for the day, with optional intensity
    date: string; // Date of the log 
    notes?: string; // Optional notes added by the user for the day
}

// Type for badge information
export type Badge = {
    id: string; // Unique identifier for the badge
    emoji: string; // Emoji representing the badge
    title: string; // Title of the badge
    description: string; // Description of the badge and how to earn it
    earned: boolean; // Whether the badge has been earned by the user
    earnedDate?: string; // Optional date when the badge was earned, used for sorting badges in the UI
};

/*
    BIG NOTE!!!
    REMOVED FEATURE
    - XP is no longer used in the app
    - Leveling system is no longer used in the app
    - Badges are still calculated and displayed, but they do not contribute to any XP or levels
    - The gamification system is now purely for fun and motivation, without any progression mechanics tied to XP or levels.

    The code for xp is still present in this file, but it is not currently used in the app. 
    It can be re-enabled in the future if we decide to bring back the XP and leveling system. 
    For now it is essentially dormant code that does not affect the current functionality of the app. 
    The focus of the gamification system is now solely on earning badges as a fun way to motivate users to log their symptoms and engage with the app.
    
*/

// Type for the overall gamification stats that will be computed and displayed to the user
export type GamificationStats = {
    currentStreak: number; // Current consecutive day streak of logging
    longestStreak: number; // Longest consecutive day streak of logging
    totalLogs: number; // Total number of daily logs the user has made
    xp: number; // Total experience points earned by the user based on their logging activity
    level: number; // Current level of the user based on their XP
    levelTitle: string; // Title of the user's current level
    xpForCurrentLevel: number; // XP required for the current level
    xpForNextLevel: number; // XP required for the next level
    badges: Badge[]; // List of badges earned by the user
};

// XP per action
const XP_PER_LOG = 10;  // Base XP for logging a day
const XP_STREAK_BONUS = 5; // Per day where streak bigger than or equal to 3
const XP_NOTES_BONUS = 2; // Per log with notes
const XP_SYMPTOM_BONUS = 2; // Per symptom logged where bigger than or equal to 3 symptoms

// XP thresholds for each level and corresponding titles (REMOVED FEATURE)
const LEVELS = [
    { min: 0, title: "Menstrual Newbie" }, // Level 1: 0+ XP
    { min: 50, title: "Log Enthusiast" }, // Level 2: 50+ XP
    { min: 150, title: "Pattern Spotter" }, // Level 3: 150+ XP
    { min: 300, title: "Flow Keeper" }, // Level 4: 300+ XP
    { min: 500, title: "Hormone Expert" }, // Level 5: 500+ XP
    { min: 750, title: "Period Pro" }, // Level 6: 750+ XP
    { min: 1000, title: "Master Tracker" }, // Level 7: 1000+ XP
];

// Function to determine the user's current level and XP thresholds based on their total XP (REMOVED FEATURE)
export function getLevelInfo(xp: number): {level: number, title: string, xpForCurrentLevel: number, xpForNextLevel: number} {
    let levelIndex = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].min) {
            levelIndex = i;
            break;
        }
    }

    // Calculate the XP thresholds for the current level and the next level
    const xpForCurrentLevel = LEVELS[levelIndex].min;
    const xpForNextLevel = levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1].min : LEVELS[levelIndex].min + 500;

    return {
        level: levelIndex + 1,
        title: LEVELS[levelIndex].title,
        xpForCurrentLevel,
        xpForNextLevel,
    };
}

// Function to calculate the user's current streak of consecutive logging days and their longest streak (used for badge calculations)
export function calculateStreaks(logs: DailyLog[]): { currentStreak: number; longestStreak: number } {
    
    // If there are no logs, both current and longest streaks are 0
    if (!logs.length) return { currentStreak: 0, longestStreak: 0 };
    
    // Create a set of log dates for quick lookup
    const logDates = new Set(logs.map(l => l.date));
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

    // Calculate current streak by checking if today is logged, if not check yesterday, and then continue checking backwards until we find a day that is not logged
    let currentStreak = 0;
    let checkDate = logDates.has(today) ? new Date() : logDates.has(yesterday) ? subDays(new Date(), 1) : null;

    if (checkDate) {
        let d = checkDate;
        while (logDates.has(format(d, "yyyy-MM-dd"))) {
            currentStreak++;
            d = subDays(d, 1);
        }
    }

    // Calculate longest streak
    const sorted = [...logDates].sort();
    let longest = 0;
    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
        const diff = differenceInCalendarDays(new Date(sorted[i]), new Date(sorted[i - 1]));
        if (diff === 1) {
            run++;
            longest = Math.max(longest, run);
        } else {
            run = 1;
        }
    }
    longest = Math.max(longest, run, currentStreak);

    return { currentStreak, longestStreak: longest };
}

// Function to calculate the total XP earned by the user based on their logs and current streak (REMOVED FEATURE)
export function calculateXP(logs: DailyLog[], currentStreak: number): number {
    let xp = 0;
    for (const log of logs) {
        xp += XP_PER_LOG;
        if (log.notes?.trim()) xp += XP_NOTES_BONUS;
        if ((log.symptoms || []).length >= 3) xp += XP_SYMPTOM_BONUS;
    }

    if (currentStreak >= 3) {
        xp += (currentStreak - 2) * XP_STREAK_BONUS; 
    }

    return xp;
}

// Function to calculate which badges the user has earned based on their logs, current streak, and longest streak
export function calculateBadges(logs: DailyLog[], currentStreak: number, longestStreak: number): Badge[] {

    // Calculate various stats needed for badge criteria
    const total = logs.length;
    const hasNotes = logs.filter(l => l.notes?.trim()).length;
    const hasSymptoms = logs.filter(l => (l.symptoms || []).length >= 3).length;
    const bleedingLogs = logs.filter(l => l.bleeding !== "None").length;

    // Define the badge criteria and information
    const badgeDefs: Badge[] = [

        // Badge for logging the first day
        {
            id: "first_log",
            emoji:'🌱',
            title: "First Step",
            description: "Logged your first day",
            earned: total >= 1,
            earnedDate: total >= 1 ? logs.sort((a, b) => a.date.localeCompare(b.date))[0].date : undefined,
        },

        // Badges for maintaining streaks of logging, with the earned date based on when the streak was achieved
        {
            id: "streak_3",
            emoji:'🔥',
            title: "On A Roll",
            description: "Maintained a 3-day streak",
            earned: currentStreak >= 3,
            earnedDate: currentStreak >= 3 ? logs.sort((a, b) => a.date.localeCompare(b.date))[0].date : undefined,
        },

        // Badge for maintaining a 7-day streak of logging, with the earned date based on when the streak was achieved
        {
            id: "streak_7",
            emoji:'⚡',
            title: "Weekly Warrior",
            description: "Maintained a 7-day streak",
            earned: currentStreak >= 7,
            earnedDate: currentStreak >= 7 ? logs.sort((a, b) => a.date.localeCompare(b.date))[0].date : undefined,
        },

        // Badge for maintaining a 30-day streak of logging, with the earned date based on when the streak was achieved
        {
            id: "streak_30",
            emoji:'💎',
            title: "Monthly Master",
            description: "Maintained a 30-day streak",
            earned: currentStreak >= 30,
            earnedDate: currentStreak >= 30 ? logs.sort((a, b) => a.date.localeCompare(b.date))[0].date : undefined,
        },

        // Badges for total number of logs, with the earned date based on when the total log count was reached
        {
            id: "logs_10",
            emoji:'📒',
            title: "Getting Consistent",
            description: "Logged 10 days",
            earned: total >= 10,
            earnedDate: total >= 10 ? logs.sort((a, b) => a.date.localeCompare(b.date))[9].date : undefined,
        },

        // Badge for logging 50 days, with the earned date based on when the total log count of 50 was reached
        {
            id: "logs_50",
            emoji:'🏆',
            title: "Dedicated Tracker",
            description: "Logged 50 days",
            earned: total >= 50,
            earnedDate: total >= 50 ? logs.sort((a, b) => a.date.localeCompare(b.date))[49].date : undefined,
        },

        // Badge for logging 100 days, with the earned date based on when the total log count of 100 was reached
        {
            id: "logs_100",
            emoji:'👑',
            title: "Cycle Master",
            description: "Logged 100 days",
            earned: total >= 100,
            earnedDate: total >= 100 ? logs.sort((a, b) => a.date.localeCompare(b.date))[99].date : undefined,
        },

        // Badge for adding notes to 5 logs, with the earned date based on when the 5th log with notes was added
        {
            id: "notes_taker",
            emoji:'✍️',
            title: "Notes Taker",
            description: "Added notes to 5 logs",
            earned: hasNotes >= 5,
            earnedDate: hasNotes >= 5 ? logs.filter(l => l.notes?.trim()).sort((a, b) => a.date.localeCompare(b.date))[4].date : undefined,
        },

        // Badge for logging 10 days with 3 or more symptoms, with the earned date based on when the 10th log with 3+ symptoms was added
        {
            id: "symptom_tracker",
            emoji:'🔍',
            title: "Detail Oriented",
            description: "Logged 10 days with 3+ symptoms",
            earned: hasSymptoms >= 10,
            earnedDate: hasSymptoms >= 10 ? logs.filter(l => (l.symptoms || []).length >= 3).sort((a, b) => a.date.localeCompare(b.date))[9].date : undefined,
        },

        // Badge for logging 5 days with bleeding, with the earned date based on when the 5th day with bleeding was logged
        {
            id: "period_tracker",
            emoji:'🩸',
            title: "Period Tracker",
            description: "Logged 5 days with bleeding",
            earned: bleedingLogs >= 5,
            earnedDate: bleedingLogs >= 5 ? logs.filter(l => l.bleeding !== "None").sort((a, b) => a.date.localeCompare(b.date))[4].date : undefined,
        },

    ];

    return badgeDefs;
}

// Main function to compute all gamification stats for the user based on their logs, including streaks, XP, levels, and badges
export function computeGamificationStats(logs: DailyLog[]): GamificationStats {

    // Calculate current streak, longest streak, total XP, current level, and badges earned based on the user's logs
    const { currentStreak, longestStreak } = calculateStreaks(logs);
    const xp = calculateXP(logs, currentStreak);
    const { level, title, xpForCurrentLevel, xpForNextLevel } = getLevelInfo(xp);
    const badges = calculateBadges(logs, currentStreak, longestStreak);
    
    return {
        currentStreak,
        longestStreak,
        totalLogs: logs.length,
        xp,
        level,
        levelTitle: title,
        xpForCurrentLevel,
        xpForNextLevel,
        badges,
    };
}