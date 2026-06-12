// Hustle Board — Live Date Bar Component
// Shows: live clock, date, payday countdown, month progress
// Design: Dark Urban Fintech — compact strip that sits below the hero KPIs

import { useLiveClock } from "@/hooks/useLiveClock";
import { Calendar, Clock, DollarSign, TrendingUp } from "lucide-react";

export function LiveDateBar() {
  const { timeString, dateString, shortDate, payday, month } = useLiveClock();

  const pad = (n: number) => String(n).padStart(2, "0");

  const countdownParts = payday.isToday
    ? ["TODAY", "💸"]
    : [
        payday.daysUntil > 0 ? `${payday.daysUntil}d` : null,
        `${pad(payday.hoursUntil)}h`,
        `${pad(payday.minutesUntil)}m`,
        `${pad(payday.secondsUntil)}s`,
      ].filter(Boolean);

  const nextPaydayStr = payday.nextPayday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="border-b border-white/6"
      style={{ background: "rgba(10,10,15,0.95)" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-2">

        {/* Live Clock */}
        <div className="flex items-center gap-2 shrink-0">
          <Clock size={13} className="text-slate-500" />
          <span
            className="text-sm font-mono font-bold text-white tracking-wider"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {timeString}
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">{dateString}</span>
          <span className="text-xs text-slate-500 sm:hidden">{shortDate}</span>
        </div>

        <div className="h-3 w-px bg-white/10 hidden sm:block" />

        {/* Payday Countdown */}
        <div className="flex items-center gap-2 shrink-0">
          <DollarSign size={13} className={payday.isToday ? "text-emerald-400" : "text-amber-400"} />
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">
              {payday.isToday ? "Payday" : `Payday (${nextPaydayStr})`}
            </span>
            <span
              className={`text-xs font-mono font-bold tracking-wide ${
                payday.isToday ? "text-emerald-400" : "text-amber-400"
              }`}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {payday.isToday
                ? "TODAY 💸"
                : countdownParts.join(" ")}
            </span>
          </div>
          {/* Cycle progress pill */}
          <div className="hidden md:flex items-center gap-1.5">
            <div className="w-16 h-1 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${payday.cycleProgress}%`,
                  background: payday.isToday
                    ? "#10b981"
                    : `linear-gradient(90deg, #f59e0b88, #f59e0b)`,
                }}
              />
            </div>
            <span className="text-xs text-slate-600 font-mono">
              {payday.cycleProgress.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="h-3 w-px bg-white/10 hidden md:block" />

        {/* Month Progress */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar size={13} className="text-slate-500" />
          <span className="text-xs text-slate-400">
            {month.monthName} {month.year}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-1 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${month.progress}%`,
                  background: "linear-gradient(90deg, #6366f188, #6366f1)",
                }}
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Day {month.dayOfMonth}/{month.daysInMonth}
            </span>
          </div>
          <span className="text-xs text-slate-600 hidden lg:inline">
            {month.daysRemaining}d left
          </span>
        </div>

      </div>
    </div>
  );
}
