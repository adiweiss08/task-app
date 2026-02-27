import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowLeft, BarChart3, PieChart as PieIcon, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router";

interface Todo {
    id: number;
    title: string;
    completed: boolean;
    category: string;
    priority: string;
}

const COLORS = ["#0ea5e9", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"];

export default function TaskInsights() {
    const [todos, setTodos] = useState<Todo[]>([]);

    useEffect(() => {
        fetch("http://localhost:5000/tasks")
            .then((res) => res.json())
            .then((data) => setTodos(data))
            .catch((err) => console.error("Error fetching tasks:", err));
    }, []);

    // עיבוד נתונים 1: התפלגות לפי קטגוריות (עבור גרף עוגה)
    const categoryData = Object.entries(
        todos.reduce((acc: any, todo) => {
            acc[todo.category] = (acc[todo.category] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    // עיבוד נתונים 2: סטטוס ביצוע
    const completedCount = todos.filter(t => t.completed).length;
    const pendingCount = todos.length - completedCount;

    // עיבוד נתונים 3: לפי עדיפות (עבור גרף עמודות)
    const priorityData = ["High", "Medium", "Low"].map(p => ({
        priority: p,
        count: todos.filter(t => t.priority === p).length
    }));

    return (
        <div className="bg-slate-50 p-6 lg:p-10">
            <div className="mx-auto max-w-5xl">
                <header className="mb-8 flex items-start justify-between">
                    {/* צד שמאל: כותרות */}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Task Insights</h1>
                        <p className="text-slate-500">Data analysis of your productivity</p>
                    </div>

                    {/* צד ימין: הכפתור והאייקון */}
                    <div className="flex flex-col items-end gap-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm hover:bg-white hover:shadow-md transition-all">
                            <ArrowLeft className="h-4 w-4" />
                            Back to tasks
                        </Link>
                        {/* <BarChart3 className="h-10 w-10 text-sky-500 opacity-20" /> */}
                    </div>
                </header>
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 text-sky-600 mb-2">
                            <Clock className="h-5 w-5" />
                            <span className="font-semibold uppercase text-xs tracking-wider">Total Tasks</span>
                        </div>
                        <div className="text-4xl font-bold text-slate-800">{todos.length}</div>
                    </div>
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 text-emerald-600 mb-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-semibold uppercase text-xs tracking-wider">Completed</span>
                        </div>
                        <div className="text-4xl font-bold text-slate-800">{completedCount}</div>
                    </div>
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 text-amber-500 mb-2">
                            <PieIcon className="h-5 w-5" />
                            <span className="font-semibold uppercase text-xs tracking-wider">Completion Rate</span>
                        </div>
                        <div className="text-4xl font-bold text-slate-800">
                            {todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0}%
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* גרף עוגה - קטגוריות */}
                    <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                        <h3 className="mb-6 font-bold text-slate-800">Tasks by Category</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* גרף עמודות - עדיפויות */}
                    <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                        <h3 className="mb-6 font-bold text-slate-800">Tasks by Priority</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={priorityData}>
                                    <XAxis dataKey="priority" axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" fill="#0ea5e9" radius={[10, 10, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}