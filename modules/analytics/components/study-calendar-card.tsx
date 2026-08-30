"use client";
// プレゼンテーション層 - 学習カレンダー（芝生）
//
// 月ごとのマス目を表示し、‹ › で前後の月に切り替える。
// 全月分のデータをサーバーから受け取っているため、切り替えは画面内で完結し
// 再取得は発生しない。カレンダーの組み立て（何曜日始まりか・濃さの段階）は
// すべてドメイン側で済んでおり、ここは受け取ったマスを並べるだけ。
import { useState } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/atoms/card";
import type { DashboardView } from "../api/get-dashboard-data";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/**
 * 濃さ0〜4に対応する配色。Tailwind が静的に解決できるよう直書きする。
 *
 * 学習量を表す意味的な色なので、アプリのアクセント色（primary）ではなく
 * 緑系を使う。primary はほぼ黒のため、濃いマスが真っ黒になってしまう。
 */
const LEVEL_CLASSES = [
  "bg-foreground/[0.06] text-muted-foreground",
  "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100",
  "bg-emerald-400 text-emerald-950 dark:bg-emerald-700 dark:text-emerald-50",
  "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950",
  "bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950",
] as const;

type Props = {
  study: DashboardView["study"];
};

export function StudyCalendarCard({ study }: Props) {
  // 末尾が当月。初期表示は当月にする
  const [monthIndex, setMonthIndex] = useState(study.months.length - 1);
  const month = study.months[monthIndex];

  const hasPrev = monthIndex > 0;
  const hasNext = monthIndex < study.months.length - 1;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Flame className="h-4 w-4" />
            <span className="text-xs font-medium">学習の記録</span>
          </div>
          <p className="text-xs text-muted-foreground">
            通算{" "}
            <span className="font-bold tabular-nums text-foreground">
              {study.totalStudyDays}
            </span>{" "}
            日
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <MonthNavButton
            label="前の月"
            disabled={!hasPrev}
            onClick={() => setMonthIndex((i) => i - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </MonthNavButton>

          <p aria-live="polite" className="text-sm font-semibold tabular-nums">
            {month.label}
          </p>

          <MonthNavButton
            label="次の月"
            disabled={!hasNext}
            onClick={() => setMonthIndex((i) => i + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </MonthNavButton>
        </div>

        {/* カード幅いっぱいに広げるとマスが大きくなりすぎるため、
            日付が読める程度の幅に抑えて中央に置く */}
        <div className="mx-auto w-full max-w-[19rem]">
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAY_LABELS.map((weekday) => (
              <div
                key={weekday}
                aria-hidden
                className="pb-1 text-center text-[10px] font-medium text-muted-foreground"
              >
                {weekday}
              </div>
            ))}

            {/* 月初の曜日までを空けてから1日を置く */}
            {Array.from({ length: month.startWeekday }, (_, i) => (
              <div key={`pad-${i}`} aria-hidden />
            ))}

            {month.cells.map((cell) => (
              <div
                key={cell.date}
                title={`${month.label}${cell.day}日：${cell.answerCount}問`}
                className={[
                  "flex aspect-square items-center justify-center rounded-[5px] text-[11px] tabular-nums",
                  LEVEL_CLASSES[cell.level],
                  cell.isToday
                    ? "ring-2 ring-foreground/50 ring-offset-1 ring-offset-card"
                    : "",
                ].join(" ")}
              >
                {cell.day}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          {/* マス目の色は読み上げに乗らないため、要点は文章でも示す */}
          <p>
            この月の学習：
            <span className="font-medium tabular-nums text-foreground">
              {month.studyDayCount}
            </span>
            日
          </p>
          <p className="flex items-center gap-1">
            <span className="text-[10px]">少</span>
            {LEVEL_CLASSES.map((levelClass, level) => (
              <span
                key={level}
                aria-hidden
                className={`size-3 rounded-[3px] ${levelClass}`}
              />
            ))}
            <span className="text-[10px]">多</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthNavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
