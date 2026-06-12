// Hustle Board — Live Clock & Payday Hook
// Ticks every second, computes countdown to next biweekly payday and month progress

import { useState, useEffect } from "react";

// First payday anchor: May 1, 2026 (Thursday)
// Biweekly = every 14 days from this anchor
const FIRST_PAYDAY = new Date(2026, 4, 1); // May 1 2026, midnight local

function getNextPayday(now: Date): Date {
  const msPerDay = 86400000;
  const msSinceAnchor = now.getTime() - FIRST_PAYDAY.getTime();
  const daysSinceAnchor = Math.floor(msSinceAnchor / msPerDay);

  if (daysSinceAnchor < 0) {
    // Before first payday
    return new Date(FIRST_PAYDAY);
  }

  const cycleDay = daysSinceAnchor % 14;
  const daysUntilNext = cycleDay === 0 ? 0 : 14 - cycleDay;

  const next = new Date(now);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + daysUntilNext);
  return next;
}

function getPaydayCountdown(now: Date): {
  nextPayday: Date;
  daysUntil: number;
  hoursUntil: number;
  minutesUntil: number;
  secondsUntil: number;
  isToday: boolean;
  cycleProgress: number; // 0-100 % through current 14-day pay cycle
  paydayNumber: number;  // how many paydays since anchor (1-indexed)
} {
  const nextPayday = getNextPayday(now);

  const nowMs = now.getTime();
  const nextMs = nextPayday.getTime();
  const diffMs = Math.max(0, nextMs - nowMs);

  const totalSeconds = Math.floor(diffMs / 1000);
  const daysUntil = Math.floor(totalSeconds / 86400);
  const hoursUntil = Math.floor((totalSeconds % 86400) / 3600);
  const minutesUntil = Math.floor((totalSeconds % 3600) / 60);
  const secondsUntil = totalSeconds % 60;
  const isToday = daysUntil === 0;

  // Cycle progress: how far through the current 14-day window are we
  const msPerCycle = 14 * 86400000;
  const msSinceAnchor = nowMs - FIRST_PAYDAY.getTime();
  const msIntoCycle = ((msSinceAnchor % msPerCycle) + msPerCycle) % msPerCycle;
  const cycleProgress = Math.min(100, (msIntoCycle / msPerCycle) * 100);

  // Payday number
  const paydayNumber = Math.max(1, Math.floor(msSinceAnchor / msPerCycle) + 1);

  return {
    nextPayday,
    daysUntil,
    hoursUntil,
    minutesUntil,
    secondsUntil,
    isToday,
    cycleProgress,
    paydayNumber,
  };
}

function getMonthProgress(now: Date): {
  monthName: string;
  dayOfMonth: number;
  daysInMonth: number;
  daysRemaining: number;
  progress: number; // 0-100
  year: number;
} {
  const year = now.getFullYear();
  const month = now.getMonth();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysRemaining = daysInMonth - dayOfMonth;
  const progress = (dayOfMonth / daysInMonth) * 100;
  const monthName = now.toLocaleDateString("en-US", { month: "long" });

  return { monthName, dayOfMonth, daysInMonth, daysRemaining, progress, year };
}

export interface LiveClockData {
  now: Date;
  timeString: string;       // e.g. "11:42:07 PM"
  dateString: string;       // e.g. "Saturday, April 26, 2026"
  shortDate: string;        // e.g. "Apr 26, 2026"
  dayOfWeek: string;        // e.g. "Saturday"
  payday: ReturnType<typeof getPaydayCountdown>;
  month: ReturnType<typeof getMonthProgress>;
}

export function useLiveClock(): LiveClockData {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeString = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateString = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const shortDate = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

  return {
    now,
    timeString,
    dateString,
    shortDate,
    dayOfWeek,
    payday: getPaydayCountdown(now),
    month: getMonthProgress(now),
  };
}
