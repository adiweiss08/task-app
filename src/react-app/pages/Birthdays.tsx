import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Gift, ArrowLeft, CheckCircle2, Star, Trash2 } from "lucide-react";
import { Link } from "react-router";

interface Birthday {
  id: number;
  name: string;
  date: string;
  type: string;
}

interface TodoForCalendar {
  id: number;
  title: string;
  dueDate: string | null;
  completed: boolean;
  category: string;
  priority: string;
  created_at: string;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
}

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8787"
  : "https://task-app.adi-weiss08.workers.dev";

export default function BirthdaysPage() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [apiHolidays, setApiHolidays] = useState<Holiday[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [eventType, setEventType] = useState<"birthday" | "holiday" | "other">("birthday");
  const [tasks, setTasks] = useState<TodoForCalendar[]>([]);
  const [birthdayColor, setBirthdayColor] = useState<string>("#ec4899"); // pink
  const [holidayColor, setHolidayColor] = useState<string>("#3b82f6"); // blue
  const [tasksColor, setTasksColor] = useState<string>("#22c55e"); // green

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [showHolidaysList, setShowHolidaysList] = useState(true);
  const [showTasksList, setShowTasksList] = useState(true);
  const [showEventsList, setShowEventsList] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/birthdays`, { cache: "no-store" })
      .then(res => res.json())
      .then(data => setBirthdays(data))
      .catch(err => console.error("Error loading birthdays:", err));

    fetch(`${API_BASE}/api/todos`, { cache: "no-store" })
      .then(res => res.json())
      .then((data) => {
        const mapped = (data as any[]).map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.due_date ?? null,
          completed: Boolean(t.is_completed),
        })) as TodoForCalendar[];
        setTasks(mapped);
      })
      .catch(err => console.error("Error loading tasks:", err));
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mytasks_calendar_colors");
      if (saved) {
        const parsed = JSON.parse(saved) as {
          birthdayColor?: string;
          holidayColor?: string;
          tasksColor?: string;
        };
        if (parsed.birthdayColor) setBirthdayColor(parsed.birthdayColor);
        if (parsed.holidayColor) setHolidayColor(parsed.holidayColor);
        if (parsed.tasksColor) setTasksColor(parsed.tasksColor);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("mytasks_birthdays", JSON.stringify(birthdays));
    } catch {
      // ignore
    }
  }, [birthdays]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "mytasks_calendar_colors",
        JSON.stringify({ birthdayColor, holidayColor, tasksColor })
      );
    } catch {
      // ignore
    }
  }, [birthdayColor, holidayColor, tasksColor]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mytasks_show_holidays_list");
      if (saved) {
        setShowHolidaysList(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("mytasks_show_holidays_list", String(showHolidaysList));
    } catch {
      // ignore
    }
  }, [showHolidaysList]);

  useEffect(() => {
    fetch("https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=off&mod=off&nx=off&year=2026&month=x&ss=off&mf=off&geo=country&location=IL")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.items) {
          const filtered = data.items.filter((item: any) =>
            item.category === "holiday" || item.category === "roshchodesh"
          );

          const formatted = filtered.map((item: any) => ({
            id: item.title + item.date,
            name: item.title,
            date: item.date
          }));

          setApiHolidays(formatted);
        }
      })
      .catch((err) => console.error("Error fetching holidays:", err));
  }, []);

  const addBirthday = () => {
    if (!name.trim() || !date) return;

    const newBirthday = {
      name: name.trim(),
      date: date,
      type: eventType,
    };

    fetch(`${API_BASE}/api/birthdays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBirthday),
      cache: "no-store",
    })
      .then(res => res.json())
      .then(savedBirthday => {
        setBirthdays([...birthdays, savedBirthday]);
        setName("");
        setDate("");
        setEventType("birthday");
      })
      .catch(err => console.error("Error saving birthday:", err));
  };

  const deleteBirthday = (id: number) => {
    fetch(`${API_BASE}/api/birthdays/${id}`, {
      method: "DELETE",
      cache: "no-store",
    })
      .then((res) => {
        if (res.ok) {
          setBirthdays(birthdays.filter((b) => b.id !== id));
        }
      })
      .catch((err) => console.error("Error deleting birthday:", err));
  };

  const formatMonthYear = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const startDate = new Date(startOfMonth);
  startDate.setDate(startOfMonth.getDate() - startOfMonth.getDay());

  const endDate = new Date(endOfMonth);
  endDate.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));

  const days: Date[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-fuchsia-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 shadow-lg shadow-sky-200">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                My Calendar
              </h1>
              <p className="text-muted-foreground">
                Keep track of birthdays, tasks and holidays
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm hover:bg-white hover:shadow-md transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tasks
          </Link>
        </header>

        <div className="mb-8 grid gap-4 rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur-sm border border-sky-100 md:grid-cols-[2fr,3fr]">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Add an event
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Event's name"
                  className="w-full rounded-lg border border-sky-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-sky-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as "birthday" | "holiday" | "other")}
                  className="w-full rounded-lg border border-sky-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="birthday">Birthday</option>
                  <option value="holiday">Holiday</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button
                onClick={addBirthday}
                disabled={!name.trim() || !date}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-sky-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Gift className="h-4 w-4" />
                Save event
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-sky-800">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                Today is{" "}
                {today.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
              <label className="flex flex-col gap-1">
                <span className="font-medium text-sky-800">Birthday color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={birthdayColor || "#3b82f6"}
                    onChange={(e) => setBirthdayColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded-lg border-2 border-sky-100 bg-white p-1 shadow-sm transition-all hover:scale-105 hover:border-sky-300 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium text-sky-800">Holiday color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={holidayColor || "#3b82f6"}
                    onChange={(e) => setHolidayColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded-lg border-2 border-sky-100 bg-white p-1 shadow-sm transition-all hover:scale-105 hover:border-sky-300 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium text-sky-800">Tasks color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tasksColor || "#3b82f6"}
                    onChange={(e) => setTasksColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded-lg border-2 border-sky-100 bg-white p-1 shadow-sm transition-all hover:scale-105 hover:border-sky-300 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-sky-100 bg-white/90 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <button
              onClick={() => changeMonth(-1)}
              className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
            >
              Previous
            </button>
            <h2 className="text-sm font-semibold text-sky-900">
              {formatMonthYear(startOfMonth)}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
            >
              Next
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-sky-500">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs">
            {days.map((day) => {
              const iso = toISO(day);
              const dayBirthdays = birthdays.filter((b) => {
                if (!b.date) return false;
                const parts = b.date.split("-");
                const bM = parseInt(parts[1], 10);
                const bD = parseInt(parts[2], 10);
                return (bM - 1) === day.getMonth() && bD === day.getDate();
              });

              const dayTasks = tasks.filter((t) => {
                if (!t.dueDate) return false;
                // חותכים רק את ה-10 תווים הראשונים (YYYY-MM-DD) כדי להשוות ל-ISO
                const taskDateOnly = t.dueDate.split('T')[0];
                return taskDateOnly === iso && !t.completed;
              });
              const dayHolidays = apiHolidays.filter((h) => {
                const [, m, d] = h.date.split("-").map(Number);
                return m - 1 === day.getMonth() && d === day.getDate();
              });

              const isCurrentMonth = day.getMonth() === month;
              const isToday = day.toDateString() === today.toDateString();

              return (
                <div
                  key={iso}
                  className={`min-h-[80px] rounded-xl border px-2 py-1.5 ${isToday
                    ? "border-amber-300 bg-amber-50"
                    : isCurrentMonth
                      ? "border-sky-100 bg-sky-50"
                      : "border-slate-100 bg-slate-50/60 text-slate-400"
                    }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold">
                      {day.getDate()}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-950">
                        Today
                      </span>
                    )}
                  </div>

                  {dayBirthdays.map((b, i) => {
                    const isBirthday = b.type === "birthday";
                    const birthYear = isBirthday ? Number(b.date.split("-")[0]) : undefined;
                    const currentYear = day.getFullYear();
                    const age = isBirthday && birthYear ? currentYear - birthYear : undefined;

                    return (
                      <div
                        key={i}
                        className="mb-1 flex items-center gap-1 text-[11px] font-medium"
                        style={{ color: b.type === "holiday" ? holidayColor : birthdayColor }}
                      >
                        <Gift className="h-3 w-3" />
                        <span className="truncate">
                          {b.name}
                          {isBirthday && age && age > 0 && (
                            <span className="ml-0.5 opacity-80 text-[9px]">({age})</span>
                          )}
                          {b.type === "other" && (
                            <span className="ml-0.5 text-[9px] uppercase opacity-70">
                              (event)
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}

                  {dayTasks.length > 0 && (
                    <div
                      className="mb-1 flex items-center gap-1 text-[11px]"
                      style={{ color: tasksColor }}
                    >
                      <CheckCircle2 className="h-3 w-3" style={{ color: tasksColor }} />
                      <span>
                        {dayTasks.length === 1
                          ? dayTasks[0].title
                          : `${dayTasks.length} tasks`}
                      </span>
                    </div>
                  )}

                  {dayHolidays.length > 0 && (
                    <div
                      className="flex items-center gap-1 text-[11px]"
                      style={{ color: holidayColor }}
                    >
                      <Star className="h-3 w-3" style={{ color: holidayColor }} />
                      <span>
                        {dayHolidays.length === 1
                          ? dayHolidays[0].name
                          : `${dayHolidays.length} holidays`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-sky-100 bg-white/90 p-5 shadow-sm">
          {/* כותרת עם כפתור הסתרה/הצגה */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-sky-900">
              All events
            </h2>
            <button
              onClick={() => setShowEventsList((prev) => !prev)}
              className="text-[11px] font-medium text-sky-600 hover:text-sky-800"
            >
              {showEventsList ? "Hide" : "Show"}
            </button>
          </div>

          {showEventsList && (
            <>
              {birthdays.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No events saved yet. Add one using the form above.
                </p>
              ) : (
                <ul className="divide-y divide-sky-50 text-xs">
                  {birthdays
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((b) => {
                      const d = new Date(b.date);
                      return (
                        <li
                          key={b.id}
                          className="group flex items-center justify-between py-2 transition-colors hover:bg-sky-50/30"
                        >
                          <div className="flex flex-row items-center justify-between w-full py-2">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {b.name}
                              </span>
                              <span className="text-[10px] uppercase text-sky-500 font-semibold mt-1">
                                {b.type ? b.type : "Event"}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-4">
                                {d.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => deleteBirthday(b.id)}
                            className="ml-2 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                            title="Delete birthday"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                </ul>
              )}
            </>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-sky-100 bg-white/90 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-sky-900">
              My Tasks List
            </h2>
            <button
              onClick={() => setShowTasksList((prev) => !prev)}
              className="text-[11px] font-medium text-sky-600 hover:text-sky-800"
            >
              {showTasksList ? "Hide" : "Show"}
            </button>
          </div>

          {showTasksList && (
            <ul className="divide-y divide-sky-50 text-xs">
              {tasks.length === 0 ? (
                <p className="text-[11px] text-muted-foreground py-2">No tasks found.</p>
              ) : (
                tasks.map((t) => (
                  <li
                    key={t.id}
                    className="group flex items-center justify-between py-2 transition-colors hover:bg-sky-50/30"
                  >
                    <div className="flex flex-row items-center w-full py-1">
                      { }
                      <span className={`flex-1 font-medium ${t.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {t.title}
                      </span>

                      {t.dueDate && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-4">
                          {new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-sky-100 bg-white/90 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-sky-900">
              Israeli holidays
            </h2>
            <button
              onClick={() => setShowHolidaysList((prev) => !prev)}
              className="text-[11px] font-medium text-sky-600 hover:text-sky-800"
            >
              {showHolidaysList ? "Hide" : "Show"}
            </button>
          </div>
          {showHolidaysList && (
            <ul className="divide-y divide-sky-50 text-xs">
              {apiHolidays.map((h) => {
                const d = new Date(h.date);
                return (
                  <li
                    key={h.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span
                      className="flex items-center gap-1 font-medium"
                      style={{ color: holidayColor }}
                    >
                      <Star className="h-3 w-3" style={{ color: holidayColor }} />
                      {h.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

