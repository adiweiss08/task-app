import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Gift, ArrowLeft, CheckCircle2, Star, Trash2 } from "lucide-react";
import { Link } from "react-router";

interface Birthday {
  id: number;
  name: string;
  date: string;
}

interface TodoForCalendar {
  id: number;
  title: string;
  dueDate: string | null;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
}

const israelHolidays2026: Holiday[] = [
  { id: "tu-bishvat", name: "Tu BiShvat", date: "2026-02-02" },
  { id: "purim", name: "Purim", date: "2026-03-03" },
  { id: "shushan-purim", name: "Shushan Purim", date: "2026-03-04" },
  { id: "pesach-1", name: "Passover (Eve)", date: "2026-04-01" },
  { id: "pesach-end", name: "Passover (7th Day)", date: "2026-04-08" },
  { id: "yom-hashoah", name: "Yom HaShoah", date: "2026-04-14" },
  { id: "yom-hazikaron", name: "Yom HaZikaron", date: "2026-04-21" },
  { id: "yom-haatzmaut", name: "Yom HaAtzmaut", date: "2026-04-22" },
  { id: "lag-baomer", name: "Lag BaOmer", date: "2026-05-05" },
  { id: "jerusalem-day", name: "Jerusalem Day", date: "2026-05-15" },
  { id: "shavuot-1", name: "Shavuot", date: "2026-05-21" },
  { id: "tisha-bav", name: "Tisha B'Av", date: "2026-07-23" },
  { id: "rosh-hashanah-1", name: "Rosh Hashanah (Eve)", date: "2026-09-11" },
  { id: "yom-kippur", name: "Yom Kippur (Eve)", date: "2026-09-20" },
  { id: "sukkot-1", name: "Sukkot (Eve)", date: "2026-09-25" },
  { id: "shmini-atzeret", name: "Simchat Torah", date: "2026-10-02" },
  { id: "hanukkah-1", name: "Hanukkah (1st Candle)", date: "2026-12-04" },
];

export default function BirthdaysPage() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [apiHolidays, setApiHolidays] = useState<Holiday[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [tasks, setTasks] = useState<TodoForCalendar[]>([]);
  const [birthdayColor, setBirthdayColor] = useState<string>("#ec4899"); // pink-500
  const [holidayColor, setHolidayColor] = useState<string>("#f59e0b"); // amber-500

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  useEffect(() => {
    fetch('http://localhost:5000/birthdays')
      .then(res => res.json())
      .then(data => setBirthdays(data))
      .catch(err => console.error("Error loading birthdays:", err));
      
    fetch('http://localhost:5000/tasks')
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error("Error loading tasks:", err));
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mytasks_calendar_colors");
      if (saved) {
        const parsed = JSON.parse(saved) as {
          birthdayColor?: string;
          holidayColor?: string;
        };
        if (parsed.birthdayColor) setBirthdayColor(parsed.birthdayColor);
        if (parsed.holidayColor) setHolidayColor(parsed.holidayColor);
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
        JSON.stringify({ birthdayColor, holidayColor })
      );
    } catch {
      // ignore
    }
  }, [birthdayColor, holidayColor]);

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
    };

    fetch('http://localhost:5000/birthdays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBirthday),
    })
      .then(res => res.json())
      .then(savedBirthday => {
        setBirthdays([...birthdays, savedBirthday]);
        setName("");
        setDate("");
      })
      .catch(err => console.error("Error saving birthday:", err));
  };

  const deleteBirthday = (id: number) => {
    fetch(`http://localhost:5000/birthdays/${id}`, {
      method: 'DELETE',
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
      <div className="mx-auto max-w-4xl px-4 py-10">
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
              Add a birthday
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
                  placeholder="Person's name"
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
              <button
                onClick={addBirthday}
                disabled={!name.trim() || !date}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-sky-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Gift className="h-4 w-4" />
                Save birthday
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
            <p className="text-xs text-muted-foreground">
              Use the calendar below to see birthdays, task due dates, and
              Israeli holidays for each day of the month.
            </p>
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
                  <span className="text-[10px] text-muted-foreground">
                    Icon & text color for birthdays
                  </span>
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
                  <span className="text-[10px] text-muted-foreground">
                    Icon & text color for holidays
                  </span>
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
                });              const dayTasks = tasks.filter((t) => t.dueDate === iso);
              const dayHolidays = apiHolidays.filter((h) => {
                const [, m, d] = h.date.split("-").map(Number);
                return m - 1 === day.getMonth() && d === day.getDate();
              });
              const isCurrentMonth = day.getMonth() === month;
              const isToday = day.toDateString() === today.toDateString();

              return (
                <div
                  key={iso}
                  className={`min-h-[80px] rounded-xl border px-2 py-1.5 ${
                    isToday
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
                    const birthYear = Number(b.date.split("-")[0]);
                    const currentYear = day.getFullYear();
                    const age = currentYear - birthYear;

                    return (
                      <div
                        key={i}
                        className="mb-1 flex items-center gap-1 text-[11px] font-medium"
                        style={{ color: birthdayColor }}
                      >
                        <Gift className="h-3 w-3" />
                        <span className="truncate">
                          {b.name}
                          {age > 0 && (
                            <span className="ml-0.5 opacity-80 text-[9px]">({age})</span>
                          )}
                        </span>
                      </div>
                    );
                  })}

                  {dayTasks.length > 0 && (
                    <div className="mb-1 flex items-center gap-1 text-[11px] text-emerald-800">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
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
          <h2 className="mb-3 text-sm font-semibold text-sky-900">
            All birthdays
          </h2>
          {birthdays.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No birthdays saved yet. Add one using the form above.
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
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {b.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {d.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {/* כפתור המחיקה שמופיע ב-Hover */}
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
        </section>

        <section className="mt-4 rounded-2xl border border-sky-100 bg-white/90 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-sky-900">
            Israeli holidays
          </h2>
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
        </section>
      </div>
    </div>
  );
}

