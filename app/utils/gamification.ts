import { differenceInCalendarDays, format, subDays } from "date-fns";

type DailyLog = {
    id: string;
    bleeding: "None" | "Light" | "Medium" | "Heavy";
    symptoms:  {name: string; intensity?: number}[];
    date: string;
    notes?: string;
}

export type Badge = {
    id: string;
    emoji: string;
    title: string;
    description: string;
    earned: boolean;
    earnedDate?: string;
};

export type GamificationStats = {
    currentStreak: number;
    longestStreak: number;
    totalLogs: number;
    xp: number;
    level: number;
    levelTitle: string;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    badges: Badge[];
};

// XP per action
const XP_PER_LOG = 10;  // Base XP for logging a day
const XP_STREAK_BONUS = 5; // Per day where streak bigger than or equal to 3
const XP_NOTES_BONUS = 2; // Per log with notes
const XP_SYMPTOM_BONUS = 2; // Per symptom logged where bigger than or equal to 3 symptoms

const LEVELS = [
    { min: 0, title: "Menstrual Newbie" },
    { min: 50, title: "Log Enthusiast" },
    { min: 150, title: "Pattern Spotter" },
    { min: 300, title: "Flow Keeper" },
    { min: 500, title: "Hormone Expert" },
    { min: 750, title: "Period Pro" },
    { min: 1000, title: "Master Tracker" },
];

export function getLevelInfo(xp: number): {level: number, title: string, xpForCurrentLevel: number, xpForNextLevel: number} {
    let levelIndex = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].min) {
            levelIndex = i;
            break;
        }
    }

    const xpForCurrentLevel = LEVELS[levelIndex].min;
    const xpForNextLevel = levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1].min : LEVELS[levelIndex].min + 500;

    return {
        level: levelIndex + 1,
        title: LEVELS[levelIndex].title,
        xpForCurrentLevel,
        xpForNextLevel,
    };
}

export function calculateStreaks(logs: DailyLog[]): { currentStreak: number; longestStreak: number } {
    if (!logs.length) return { currentStreak: 0, longestStreak: 0 };
    
    const logDates = new Set(logs.map(l => l.date));
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

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

export function calculateBadges(logs: DailyLog[], currentStreak: number, longestStreak: number): Badge[] {
    const total = logs.length;
    const hasNotes = logs.filter(l => l.notes?.trim()).length;
    const hasSymptoms = logs.filter(l => (l.symptoms || []).length >= 3).length;
    const bleedingLogs = logs.filter(l => l.bleeding !== "None").length;

    const badgeDefs: Badge[] = [
        {
            id: "first_log",
            emoji:'🌱',
            title: "First Step",
            description: "Logged your first day",
            earned: total >= 1,
            earnedDate: total >= 1 ? logs.sort((a, b) => a.date.localeCompare(b.date))[0].date : undefined,
        },
        {
            id: "streak_3",
            emoji:'🔥',
            title: "On A Roll",
            description: "Maintained a 3-day streak",
            earned: currentStreak >= 3,
            earnedDate: currentStreak >= 3 ? logs.sort((a, b) => a.date.localeCompare(b.date))[0].date : undefined,
        },
        {
            id: "streak_7",
            emoji:'⚡',
            title: "Weekly Warrior",
            description: "Maintained a 7-day streak",
            earned: currentStreak >= 7,
            earnedDate: currentStreak >= 7 ? logs.sort((a, b) => a.date.localeCompare(b.date))[0].date : undefined,
        },
        {
            id: "streak_30",
            emoji:'💎',
            title: "Monthly Master",
            description: "Maintained a 30-day streak",
            earned: currentStreak >= 30,
            earnedDate: currentStreak >= 30 ? logs.sort((a, b) => a.date.localeCompare(b.date))[0].date : undefined,
        },
        {
            id: "logs_10",
            emoji:'📒',
            title: "Getting Consistent",
            description: "Logged 10 days",
            earned: total >= 10,
            earnedDate: total >= 10 ? logs.sort((a, b) => a.date.localeCompare(b.date))[9].date : undefined,
        },
        {
            id: "logs_50",
            emoji:'🏆',
            title: "Dedicated Tracker",
            description: "Logged 50 days",
            earned: total >= 50,
            earnedDate: total >= 50 ? logs.sort((a, b) => a.date.localeCompare(b.date))[49].date : undefined,
        },
        {
            id: "logs_100",
            emoji:'👑',
            title: "Cycle Master",
            description: "Logged 100 days",
            earned: total >= 100,
            earnedDate: total >= 100 ? logs.sort((a, b) => a.date.localeCompare(b.date))[99].date : undefined,
        },
        {
            id: "notes_taker",
            emoji:'✍️',
            title: "Notes Taker",
            description: "Added notes to 5 logs",
            earned: hasNotes >= 5,
            earnedDate: hasNotes >= 5 ? logs.filter(l => l.notes?.trim()).sort((a, b) => a.date.localeCompare(b.date))[4].date : undefined,
        },
        {
            id: "symptom_tracker",
            emoji:'🔍',
            title: "Detail Oriented",
            description: "Logged 10 days with 3+ symptoms",
            earned: hasSymptoms >= 10,
            earnedDate: hasSymptoms >= 10 ? logs.filter(l => (l.symptoms || []).length >= 3).sort((a, b) => a.date.localeCompare(b.date))[9].date : undefined,
        },
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

export function computeGamificationStats(logs: DailyLog[]): GamificationStats {
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