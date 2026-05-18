export type CalendarColors = {
  eventColor: string;
  holidayColor: string;
  tasksColor: string;
};

const STORAGE_KEY = "mytasks_calendar_colors";

const DEFAULT_COLORS: CalendarColors = {
  eventColor: "#ec4899",
  holidayColor: "#3b82f6",
  tasksColor: "#22c55e",
};

export function loadCalendarColors(): CalendarColors {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...DEFAULT_COLORS };
    const parsed = JSON.parse(saved) as Partial<CalendarColors> & { birthdayColor?: string };
    return {
      eventColor: parsed.eventColor ?? parsed.birthdayColor ?? DEFAULT_COLORS.eventColor,
      holidayColor: parsed.holidayColor ?? DEFAULT_COLORS.holidayColor,
      tasksColor: parsed.tasksColor ?? DEFAULT_COLORS.tasksColor,
    };
  } catch {
    return { ...DEFAULT_COLORS };
  }
}

export function saveCalendarColors(colors: CalendarColors): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch {}
}
