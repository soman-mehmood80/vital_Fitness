import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    Activity,
    Flame,
    Droplets,
    Moon,
    Dumbbell,
    Loader2,
    Utensils,
    Heart,
    Zap,
    Sparkles,
    BarChart3,
    Footprints,
    RefreshCw,
    ArrowUpRight,
    Calendar,
    Target,
    Clock,
    Plus,
    Play,
    Pause,
    RotateCcw,
    CheckCircle2,
    Circle,
    Trophy,
    Timer,
    TrendingUp,
    Check,
    AlertCircle,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import API from "../../services/api";
import { getStoredUser } from "../../utils/auth";
import BodySkeletonSelector from "../../components/BodySkeletonSelector";

// Local date helper
const getLocalDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// Format mm:ss for live timer
const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// Animated Number
const CountUp = ({ end, duration = 850, decimals = 0, suffix = "" }) => {
    const target = Number(end) || 0;
    const [count, setCount] = useState(target);
    const prevRef = useRef(0);

    useEffect(() => {
        const startVal = prevRef.current;
        if (startVal === target) {
            setCount(target);
            return;
        }

        let startTime = null;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);

            const current = startVal + (target - startVal) * easeOut;
            setCount(
                decimals > 0
                    ? Number(current.toFixed(decimals))
                    : Math.floor(current)
            );

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                prevRef.current = target;
                setCount(target);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration, decimals]);

    const formatted =
        decimals > 0
            ? count.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: decimals,
              })
            : count.toLocaleString();

    return (
        <>
            {formatted}
            {suffix}
        </>
    );
};

const WORKOUT_MODES = [
    { id: "strength", label: "Strength", kcalPerMin: 6.8, focus: "Compound Lifts & Hypertrophy" },
    { id: "hiit", label: "HIIT", kcalPerMin: 11.4, focus: "Peak VO2 & Fat Burn" },
    { id: "cardio", label: "Cardio", kcalPerMin: 9.2, focus: "Aerobic Endurance & Pace" },
    { id: "mobility", label: "Mobility", kcalPerMin: 4.1, focus: "Joint Health & Recovery" },
];

const DEFAULT_HABITS = [
    { id: "warmup", label: "10-min Dynamic Warm-up", done: false },
    { id: "protein", label: "Hit Daily Protein Target", done: false },
    { id: "stretch", label: "Post-Workout Cooldown Stretch", done: false },
];

export default function Dashboard() {
    const user = getStoredUser();
    const todayKey = getLocalDate();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [chartMetric, setChartMetric] = useState("calories");
    const [chartData, setChartData] = useState([]);
    const [recentWorkouts, setRecentWorkouts] = useState([]);
    const [videoFailed, setVideoFailed] = useState(false);
    const [savingWorkout, setSavingWorkout] = useState(false);

    const [stats, setStats] = useState({
        caloriesBurned: 0,
        activeMinutes: 0,
        streak: 0,
        steps: 0,
        stepGoal: 10000,
        waterIntake: 0,
        waterGoal: 2500,
        sleepHours: 0,
        sleepGoal: 8,
        nutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    });

    // Interactive Quick Workout Timer State
    const [workoutMode, setWorkoutMode] = useState(WORKOUT_MODES[0]);
    const [activeMuscleTarget, setActiveMuscleTarget] = useState("");
    const [timerRunning, setTimerRunning] = useState(false);
    const [elapsedSec, setElapsedSec] = useState(0);
    const [restSec, setRestSec] = useState(0);
    const [activeRestPreset, setActiveRestPreset] = useState(null);
    const [sessionSavedMsg, setSessionSavedMsg] = useState("");
    const timerRef = useRef(null);
    const restRef = useRef(null);
    const timerCardRef = useRef(null);

    // Daily Habits State (persisted in MongoDB)
    const [habits, setHabits] = useState(DEFAULT_HABITS);

    // Water quick-add state
    const [waterAdding, setWaterAdding] = useState(false);
    const [waterFeedback, setWaterFeedback] = useState("");

    const fetchDashboard = useCallback(async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);
            setError("");

            const today = getLocalDate();

            const [dashboardRes, stepsRes, historyRes] = await Promise.all([
                API.get("/api/dashboard/summary", { params: { date: today } }),
                API.get("/api/steps/today", { params: { date: today } }).catch(() => ({
                    data: { steps: 0, goal: 10000 },
                })),
                API.get("/api/workout-logs/my-history").catch(() => ({
                    data: { logs: [] },
                })),
            ]);

            const data = dashboardRes.data;
            const todaySteps = stepsRes.data.steps || 0;
            const stepGoal = stepsRes.data.goal || 10000;
            const logs = historyRes.data.logs || [];

            setStats({
                caloriesBurned: data.workouts?.caloriesBurned || 0,
                activeMinutes: data.workouts?.duration || 0,
                streak: data.achievements?.streak || 0,
                steps: todaySteps,
                stepGoal,
                waterIntake: data.water?.total || 0,
                waterGoal: data.water?.goal || 2500,
                sleepHours: data.sleep?.hours || 0,
                sleepGoal: data.sleep?.goal || 8,
                nutrition: {
                    calories: data.nutrition?.calories || 0,
                    protein: data.nutrition?.protein || 0,
                    carbs: data.nutrition?.carbs || 0,
                    fats: data.nutrition?.fats || 0,
                },
            });

            if (Array.isArray(data.habits) && data.habits.length > 0) {
                setHabits(data.habits);
            } else {
                setHabits(DEFAULT_HABITS);
            }

            const sortedLogs = [...logs]
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                .slice(0, 4);
            setRecentWorkouts(sortedLogs);

            // 7-day chart directly from MongoDB logs
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return {
                    dateStr: getLocalDate(d),
                    dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
                    calories: 0,
                    duration: 0,
                };
            });

            logs.forEach((log) => {
                const logDate = getLocalDate(new Date(log.completedAt));
                const dayData = last7Days.find((d) => d.dateStr === logDate);
                if (dayData) {
                    dayData.calories += log.caloriesBurned || 0;
                    dayData.duration += log.duration || 0;
                }
            });

            setChartData(last7Days);
        } catch (err) {
            console.error("Dashboard fetch failed", err);
            setError("Could not refresh some dashboard data. Check your connection.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard(false);
    }, [fetchDashboard]);

    // Stopwatch interval
    useEffect(() => {
        if (timerRunning) {
            timerRef.current = setInterval(() => {
                setElapsedSec((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timerRunning]);

    // Rest countdown interval
    useEffect(() => {
        if (restSec > 0) {
            restRef.current = setTimeout(() => {
                setRestSec((prev) => {
                    const next = Math.max(prev - 1, 0);
                    if (next === 0) setActiveRestPreset(null);
                    return next;
                });
            }, 1000);
        }
        return () => clearTimeout(restRef.current);
    }, [restSec]);

    // Save water directly to MongoDB
    const handleQuickWater = async (ml) => {
        if (waterAdding) return;
        setWaterAdding(true);
        setStats((prev) => ({
            ...prev,
            waterIntake: prev.waterIntake + ml,
        }));

        try {
            await API.post("/api/water", {
                amount: Number(ml),
                date: getLocalDate(),
            });
            setWaterFeedback(`+${ml} ml synced`);
            setTimeout(() => setWaterFeedback(""), 2000);
        } catch (err) {
            setStats((prev) => ({
                ...prev,
                waterIntake: Math.max(0, prev.waterIntake - ml),
            }));
            setError(err.response?.data?.message || "Failed to log water intake");
        } finally {
            setWaterAdding(false);
        }
    };

    const handleRestPreset = (sec) => {
        if (activeRestPreset === sec && restSec > 0) {
            setRestSec(0);
            setActiveRestPreset(null);
        } else {
            setActiveRestPreset(sec);
            setRestSec(sec);
        }
    };

    // Save habit toggle directly to MongoDB
    const toggleHabit = async (id) => {
        const previous = habits;
        const updated = habits.map((h) =>
            h.id === id ? { ...h, done: !h.done } : h
        );
        setHabits(updated);

        try {
            await API.put("/api/dashboard/habits", {
                date: todayKey,
                habits: updated,
            });
        } catch (err) {
            setHabits(previous);
            setError(err.response?.data?.message || "Failed to save habit");
        }
    };

    // Save Quick Timer session directly to MongoDB
    const handleSaveQuickSession = async () => {
        if (savingWorkout) return;
        const mins = Math.max(1, Math.round(elapsedSec / 60));
        const estKcal = Math.max(
            Math.round((elapsedSec / 60) * workoutMode.kcalPerMin),
            Math.round(workoutMode.kcalPerMin)
        );
        const sessionLabel = activeMuscleTarget
            ? `${activeMuscleTarget} • ${workoutMode.label} Session`
            : `${workoutMode.label} Quick Session`;

        setSavingWorkout(true);
        try {
            await API.post("/api/dashboard/quick-workout", {
                title: sessionLabel,
                muscleGroup: activeMuscleTarget || "General",
                mode: workoutMode.id,
                source: "timer",
                duration: mins,
                caloriesBurned: estKcal,
                completedAt: new Date().toISOString(),
            });

            setTimerRunning(false);
            setElapsedSec(0);
            setRestSec(0);
            setActiveRestPreset(null);
            setActiveMuscleTarget("");
            setSessionSavedMsg(`Saved ${mins}m (${estKcal} kcal)`);
            setTimeout(() => setSessionSavedMsg(""), 2600);
            await fetchDashboard(true);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save workout session");
        } finally {
            setSavingWorkout(false);
        }
    };

    // Skeleton -> Start Timer
    const handleStartMuscleTimer = (muscle) => {
        const matchedMode =
            WORKOUT_MODES.find((m) => m.id === muscle.modeId) || WORKOUT_MODES[0];
        setWorkoutMode(matchedMode);
        setActiveMuscleTarget(muscle.label);
        setElapsedSec(0);
        setTimerRunning(true);
        timerCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    // Skeleton -> Save directly to MongoDB
    const handleQuickLogMuscle = async (muscle, chosenExercises = []) => {
        if (savingWorkout) return false;
        setSavingWorkout(true);
        try {
            await API.post("/api/dashboard/quick-workout", {
                title: `${muscle.label} Workout (${chosenExercises.length} exercises)`,
                muscleGroup: muscle.label,
                exercises: chosenExercises,
                mode: muscle.modeId,
                source: "skeleton",
                duration: muscle.defaultMinutes,
                caloriesBurned: muscle.estCalories,
                completedAt: new Date().toISOString(),
            });
            await fetchDashboard(true);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || "Failed to log muscle workout");
            return false;
        } finally {
            setSavingWorkout(false);
        }
    };

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary, #ef4444)" }} />
            </div>
        );
    }

    const getTimeGreeting = () => {
        const hr = new Date().getHours();
        if (hr < 12) return "Good Morning";
        if (hr < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const getDynamicMessage = () => {
        if (stats.streak === 0)
            return "Your transformation begins with a single rep. Log your first workout today.";
        if (stats.streak < 3)
            return `You're on a ${stats.streak}-day streak. Keep the momentum surging!`;
        if (stats.streak < 7)
            return `${stats.streak} days strong! Consistency is your unfair advantage.`;
        return `Unstoppable! ${stats.streak} days of pure athletic dedication.`;
    };

    const todayFormatted = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    const stepPercent = Math.min((stats.steps / Math.max(stats.stepGoal, 1)) * 100, 100);
    const waterPercent = Math.min((stats.waterIntake / Math.max(stats.waterGoal, 1)) * 100, 100);
    const sleepPercent = Math.min((stats.sleepHours / Math.max(stats.sleepGoal, 1)) * 100, 100);
    const workoutScore = stats.activeMinutes > 0 ? 100 : 0;
    const dailyScore = Math.round((stepPercent + waterPercent + sleepPercent + workoutScore) / 4);

    const getReadinessAdvice = () => {
        if (stats.sleepHours > 0 && stats.sleepHours < 6) {
            return {
                badge: "Recovery Focus",
                color: "amber",
                title: "Prioritize Mobility & Zone 2",
                desc: "Sleep was under 6h. Aim for 20-min light cardio, stretching, and extra hydration today.",
            };
        }
        if (dailyScore >= 70) {
            return {
                badge: "Peak Readiness",
                color: "green",
                title: "Cleared for Heavy Lifts / HIIT",
                desc: "Your recovery and activity markers are strong. Push progressive overload or Zone 5 intervals.",
            };
        }
        return {
            badge: "Balanced Output",
            color: "red",
            title: "40-Min Strength + 10K Steps",
            desc: "Build daily momentum with compound movements and steady hydration throughout the afternoon.",
        };
    };

    const readiness = getReadinessAdvice();

    const weeklyTotal = chartData.reduce((sum, d) => sum + (d[chartMetric] || 0), 0);
    const weeklyAvg = Math.round(weeklyTotal / 7);
    const weeklyBestBurn = Math.max(...chartData.map((d) => d.calories || 0), 0);
    const weeklyActiveDays = chartData.filter((d) => (d.duration || 0) > 0).length;

    const totalMacroGrams = Math.max(
        stats.nutrition.protein + stats.nutrition.carbs + stats.nutrition.fats,
        1
    );
    const proteinPct = Math.round((stats.nutrition.protein / totalMacroGrams) * 100);
    const carbsPct = Math.round((stats.nutrition.carbs / totalMacroGrams) * 100);
    const fatsPct = Math.round((stats.nutrition.fats / totalMacroGrams) * 100);

    const liveEstimatedKcal = Math.round((elapsedSec / 60) * workoutMode.kcalPerMin);

    const autoTargets = [
        { id: "auto-steps", label: `Reach ${stats.stepGoal.toLocaleString()} steps`, done: stats.steps >= stats.stepGoal },
        { id: "auto-water", label: `Drink ${stats.waterGoal} ml water`, done: stats.waterIntake >= stats.waterGoal },
        { id: "auto-wk", label: "Complete 1 workout session", done: stats.activeMinutes > 0 },
    ];
    const completedCheckCount =
        autoTargets.filter((t) => t.done).length + habits.filter((h) => h.done).length;
    const totalCheckCount = autoTargets.length + habits.length;

    const firstName = user?.name?.split(" ")[0] || "Champ";
    const sleepDecimals = stats.sleepHours % 1 !== 0 ? 1 : 0;

    return (
        <div className="dashboard-container">
            {/* ===== TOP COMMAND HEADER ===== */}
            <section className="dashboard-header-bento">
                <div className="header-left-col">
                    <div className="header-meta-row">
                        <span className="date-pill">
                            <Calendar size={12} /> {todayFormatted}
                        </span>
                        <span className="readiness-pill">
                            <span className="pulse-dot" />
                            <Target size={12} /> Daily Goal: <strong>{dailyScore}%</strong>
                        </span>
                        <button
                            type="button"
                            className="refresh-mini-btn"
                            onClick={() => fetchDashboard(true)}
                            disabled={refreshing}
                            title="Refresh dashboard stats"
                            aria-label="Refresh dashboard stats"
                        >
                            <RefreshCw size={13} className={refreshing ? "spin" : ""} />
                        </button>
                    </div>

                    <div className="greeting-section">
                        <h1>
                            {getTimeGreeting()}, <span>{firstName}</span>
                        </h1>
                        <p>{getDynamicMessage()}</p>
                    </div>

                    <div className="quick-actions-row">
                        <Link to="/workouts" className="quick-action-chip primary">
                            <Plus size={14} /> Log Workout
                        </Link>
                        <Link to="/nutrition" className="quick-action-chip">
                            <Utensils size={13} /> Add Meal
                        </Link>
                        <Link to="/water" className="quick-action-chip">
                            <Droplets size={13} /> Water Log
                        </Link>
                        <Link to="/sleep" className="quick-action-chip">
                            <Moon size={13} /> Log Sleep
                        </Link>
                        <Link to="/ai-coach" className="quick-action-chip">
                            <Sparkles size={13} /> AI Coach
                        </Link>
                    </div>
                </div>

                {/* Top 4 KPI Tiles */}
                <div className="top-stats-row">
                    <Link to="/steps" className="mini-stat">
                        <div className="mini-icon-box green">
                            <Footprints size={20} />
                        </div>
                        <div>
                            <strong><CountUp end={stats.steps} /></strong>
                            <span>Steps</span>
                        </div>
                    </Link>

                    <Link to="/workouts" className="mini-stat">
                        <div className="mini-icon-box red">
                            <Activity size={20} />
                        </div>
                        <div>
                            <strong><CountUp end={stats.activeMinutes} /></strong>
                            <span>Active Mins</span>
                        </div>
                    </Link>

                    <Link to="/workouts" className="mini-stat">
                        <div className="mini-icon-box orange">
                            <Flame size={20} />
                        </div>
                        <div>
                            <strong><CountUp end={stats.caloriesBurned} /></strong>
                            <span>Burned kcal</span>
                        </div>
                    </Link>

                    <Link to="/progress" className="mini-stat">
                        <div className="mini-icon-box pink">
                            <Heart size={20} fill="currentColor" />
                        </div>
                        <div>
                            <strong><CountUp end={stats.streak} /></strong>
                            <span>Day Streak</span>
                        </div>
                    </Link>
                </div>
            </section>

            {error && (
                <div className="dash-error-banner" role="alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                    <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
                        Dismiss
                    </button>
                </div>
            )}

            {/* ===== 12-COLUMN BENTO GRID ===== */}
            <div className="bento-grid">
                {/* ROW 1 LEFT (8 cols): Weekly Activity Chart */}
                <div className="bento-item activity-chart-card">
                    <div className="bento-header chart-header-wrap">
                        <div className="bento-title-stack">
                            <h3>
                                <BarChart3 size={17} color="var(--accent-primary, #ef4444)" /> Weekly Telemetry
                            </h3>
                            <div className="chart-summary-pills">
                                <span>
                                    7-Day Total: <strong>{weeklyTotal.toLocaleString()}</strong>{" "}
                                    {chartMetric === "calories" ? "kcal" : "mins"}
                                </span>
                                <span>
                                    Avg: <strong>{weeklyAvg.toLocaleString()}</strong>/day
                                </span>
                            </div>
                        </div>

                        <div className="chart-toggle-group" role="tablist" aria-label="Chart metric">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={chartMetric === "calories"}
                                className={`chart-toggle-btn ${chartMetric === "calories" ? "active" : ""}`}
                                onClick={() => setChartMetric("calories")}
                            >
                                Calories
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={chartMetric === "duration"}
                                className={`chart-toggle-btn ${chartMetric === "duration" ? "active" : ""}`}
                                onClick={() => setChartMetric("duration")}
                            >
                                Minutes
                            </button>
                        </div>
                    </div>

                    <div className="chart-canvas-wrap">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.45} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border-subtle, rgba(255,255,255,0.08))"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="dayName"
                                    stroke="var(--text-muted, #a1a1aa)"
                                    tick={{ fill: "var(--text-muted, #a1a1aa)", fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    stroke="var(--text-muted, #a1a1aa)"
                                    tick={{ fill: "var(--text-muted, #a1a1aa)", fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "var(--bg-surface, #18181c)",
                                        border: "1px solid rgba(239, 68, 68, 0.35)",
                                        borderRadius: "12px",
                                        color: "var(--text-main, #fafafa)",
                                        boxShadow: "0 14px 35px rgba(0,0,0,0.45)",
                                    }}
                                    itemStyle={{ color: "#ef4444", fontWeight: 700 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={chartMetric}
                                    name={chartMetric === "calories" ? "Calories Burned" : "Active Minutes"}
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorMetric)"
                                    activeDot={{ r: 5, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ROW 1 RIGHT (4 cols): Hero AI Coach Video Spotlight */}
                <div className="bento-item hero-image-card ai-spotlight-card">
                    {!videoFailed ? (
                        <video
                            className="bg-img"
                            autoPlay
                            muted
                            loop
                            playsInline
                            onError={() => setVideoFailed(true)}
                            poster="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop"
                        >
                            <source
                                src="https://videos.pexels.com/video-files/5319856/5319856-uhd_2160_3840_25fps.mp4"
                                type="video/mp4"
                            />
                        </video>
                    ) : (
                        <img
                            className="bg-img"
                            src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop"
                            alt="VitalFit Training Spotlight"
                        />
                    )}
                    <div className="hero-overlay">
                        <div className="ai-badge">
                            <span className="pulse-dot" style={{ background: "#fff" }} />
                            <Sparkles size={13} /> AI COACH TELEMETRY
                        </div>
                        <h2>Own Your <span>Strength.</span></h2>
                        <p>Personalized training splits, recovery alerts &amp; smart macro guidance.</p>
                        <Link to="/ai-coach" className="hero-btn glass-btn">
                            <Zap size={15} /> Launch AI Coach
                        </Link>
                    </div>
                </div>

                {/* ROW 2 CARD 1 (4 cols): Live Workout & Rest Timer Studio */}
                <div ref={timerCardRef} className="bento-item live-timer-card">
                    <div>
                        <div className="bento-header">
                            <h3><Timer size={16} color="#ef4444" /> Quick Session Timer</h3>
                            <span className="timer-mode-badge">{workoutMode.kcalPerMin} kcal/m</span>
                        </div>

                        <div className="timer-mode-pills">
                            {WORKOUT_MODES.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    className={`mode-pill ${workoutMode.id === m.id ? "active" : ""}`}
                                    onClick={() => setWorkoutMode(m)}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        <div className="timer-readout-box">
                            <div className="timer-clock">{formatDuration(elapsedSec)}</div>
                            <div className="timer-meta">
                                <span><Flame size={13} color="#ef4444" /> ~{liveEstimatedKcal} kcal</span>
                                {restSec > 0 && <span className="rest-countdown-pill">Rest: {restSec}s</span>}
                            </div>
                            <small>
                                {activeMuscleTarget
                                    ? `Target: ${activeMuscleTarget} • ${workoutMode.focus}`
                                    : workoutMode.focus}
                            </small>
                        </div>
                    </div>

                    <div>
                        <div className="timer-controls-row">
                            <button
                                type="button"
                                className={`timer-btn primary ${timerRunning ? "running" : ""}`}
                                onClick={() => setTimerRunning((r) => !r)}
                            >
                                {timerRunning ? (
                                    <><Pause size={15} /> Pause</>
                                ) : (
                                    <><Play size={15} /> {elapsedSec > 0 ? "Resume" : "Start"}</>
                                )}
                            </button>

                            <button
                                type="button"
                                className="timer-btn icon"
                                onClick={() => {
                                    setTimerRunning(false);
                                    setElapsedSec(0);
                                    setRestSec(0);
                                    setActiveRestPreset(null);
                                    setActiveMuscleTarget("");
                                }}
                                title="Reset timer"
                                aria-label="Reset timer"
                            >
                                <RotateCcw size={15} />
                            </button>

                            {elapsedSec >= 10 && (
                                <button
                                    type="button"
                                    className="timer-btn save"
                                    onClick={handleSaveQuickSession}
                                    disabled={savingWorkout}
                                >
                                    {savingWorkout ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Save
                                </button>
                            )}
                        </div>

                        <div className="rest-presets-row">
                            <span>Rest timer:</span>
                            <div className="rest-chips-group">
                                {[45, 60, 90].map((sec) => (
                                    <button
                                        key={sec}
                                        type="button"
                                        className={`rest-chip ${activeRestPreset === sec && restSec > 0 ? "active" : ""}`}
                                        onClick={() => handleRestPreset(sec)}
                                    >
                                        {sec}s
                                    </button>
                                ))}
                            </div>
                        </div>

                        {sessionSavedMsg && <div className="mini-toast">{sessionSavedMsg}</div>}
                    </div>
                </div>

                {/* ROW 2 CARD 2 (4 cols): Water Intake + Quick Log */}
                <div className="bento-item water-card">
                    <div className="bento-header">
                        <h3>Water Intake</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {waterFeedback && <span className="water-toast">{waterFeedback}</span>}
                            <Link to="/water" className="icon-mini blue" aria-label="Log Water">
                                <Droplets size={16} />
                            </Link>
                        </div>
                    </div>

                    <div className="water-content">
                        <div className="radial-progress blue-glow">
                            <div className="radial-inner">
                                <strong>{Math.round(waterPercent)}%</strong>
                            </div>
                            <svg className="radial-svg" viewBox="0 0 60 60">
                                <circle
                                    cx="30"
                                    cy="30"
                                    r="26"
                                    stroke="var(--bg-elevated, #18181c)"
                                    strokeWidth="6"
                                    fill="none"
                                />
                                <circle
                                    cx="30"
                                    cy="30"
                                    r="26"
                                    stroke="#3b82f6"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 26}
                                    strokeDashoffset={
                                        2 * Math.PI * 26 - (waterPercent / 100) * (2 * Math.PI * 26)
                                    }
                                    className="radial-fill"
                                />
                            </svg>
                        </div>
                        <div className="water-details">
                            <h3><CountUp end={stats.waterIntake} /> <small>ml</small></h3>
                            <span>Goal: {stats.waterGoal.toLocaleString()} ml</span>
                        </div>
                    </div>

                    <div className="water-quick-btns">
                        <button type="button" onClick={() => handleQuickWater(250)} disabled={waterAdding}>
                            <Plus size={13} /> 250 ml
                        </button>
                        <button type="button" onClick={() => handleQuickWater(500)} disabled={waterAdding}>
                            <Plus size={13} /> 500 ml
                        </button>
                    </div>
                </div>

                {/* ROW 2 CARD 3 (4 cols): Steps & Sleep Combined Readiness */}
                <div className="bento-item steps-sleep-stack">
                    <div className="sub-metric-block">
                        <div className="bento-header">
                            <h3>Daily Steps</h3>
                            <Link to="/steps" className="card-link-icon" aria-label="Open Steps">
                                <ArrowUpRight size={16} />
                            </Link>
                        </div>

                        <div className="metric-hero-row">
                            <div>
                                <h3 className="metric-big"><CountUp end={stats.steps} /></h3>
                                <span className="metric-sub">Goal: {stats.stepGoal.toLocaleString()} steps</span>
                            </div>
                            <span className="pct-badge green">{Math.round(stepPercent)}%</span>
                        </div>

                        <div className="progress-track">
                            <div className="progress-fill green" style={{ width: `${stepPercent}%` }} />
                        </div>
                    </div>

                    <div className="stack-divider" />

                    <div className="sub-metric-block">
                        <div className="bento-header">
                            <h3>Sleep Recovery</h3>
                            <Link to="/sleep" className="icon-mini purple" aria-label="Log Sleep">
                                <Moon size={15} />
                            </Link>
                        </div>

                        <div className="metric-hero-row">
                            <div>
                                <h3 className="metric-big">
                                    <CountUp end={stats.sleepHours} decimals={sleepDecimals} /> <small>hrs</small>
                                </h3>
                                <span className="metric-sub">Goal: {stats.sleepGoal} hours</span>
                            </div>
                            <span className="pct-badge purple">{Math.round(sleepPercent)}%</span>
                        </div>

                        <div className="sleep-bar">
                            <div className="sleep-bar-fill" style={{ width: `${sleepPercent}%` }} />
                        </div>
                    </div>
                </div>

                {/* INTERACTIVE BODY SKELETON COMPONENT */}
                <BodySkeletonSelector
                    onStartMuscleTimer={handleStartMuscleTimer}
                    onQuickLogMuscle={handleQuickLogMuscle}
                    savingWorkout={savingWorkout}
                />

                {/* ROW 3 LEFT (6 cols): Today's Nutrition & Macros */}
                <div className="bento-item nutrition-card">
                    <div className="bento-header">
                        <h3>Today&apos;s Nutrition</h3>
                        <Link to="/nutrition" className="bento-action-link">
                            Log Meal <ArrowUpRight size={14} />
                        </Link>
                    </div>

                    <div className="nutrition-summary-top">
                        <div className="kcal-total">
                            <strong><CountUp end={stats.nutrition.calories} /></strong>
                            <span>kcal consumed today</span>
                        </div>
                        <div className="macro-split-bar" title="Protein / Carbs / Fats ratio">
                            <div className="split-seg blue" style={{ width: `${proteinPct}%` }} />
                            <div className="split-seg orange" style={{ width: `${carbsPct}%` }} />
                            <div className="split-seg red" style={{ width: `${fatsPct}%` }} />
                        </div>
                    </div>

                    <div className="macro-row">
                        <div className="macro-pill"><span className="text-blue">{stats.nutrition.protein}g</span> Protein</div>
                        <div className="macro-pill"><span className="text-orange">{stats.nutrition.carbs}g</span> Carbs</div>
                        <div className="macro-pill"><span className="text-red">{stats.nutrition.fats}g</span> Fats</div>
                    </div>
                </div>

                {/* ROW 3 RIGHT (6 cols): Recent Workouts Feed */}
                <div className="bento-item recent-workouts-card">
                    <div className="bento-header">
                        <h3>Recent Workouts</h3>
                        <Link to="/workouts" className="bento-action-link">
                            Browse All <ArrowUpRight size={14} />
                        </Link>
                    </div>

                    {recentWorkouts.length === 0 ? (
                        <div className="recent-empty">
                            <div className="recent-empty-icon"><Dumbbell size={22} /></div>
                            <div>
                                <strong>No workouts logged yet</strong>
                                <p>Start the Quick Timer or pick a muscle on the Body Skeleton.</p>
                            </div>
                            <Link to="/workouts" className="btn-sm-accent">Start Workout</Link>
                        </div>
                    ) : (
                        <div className="recent-workout-list">
                            {recentWorkouts.map((log, i) => {
                                const title =
                                    log.workoutId?.title ||
                                    log.workoutTitleSnapshot ||
                                    log.workout?.title ||
                                    log.workoutTitle ||
                                    log.title ||
                                    log.name ||
                                    "Workout Session";
                                const dateLabel = log.completedAt
                                    ? new Date(log.completedAt).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                      })
                                    : "Recent";

                                return (
                                    <div key={log._id || i} className="recent-workout-row">
                                        <div className="recent-wk-left">
                                            <div className="recent-wk-icon"><Dumbbell size={16} /></div>
                                            <div>
                                                <strong>{title}</strong>
                                                <span>{dateLabel}</span>
                                            </div>
                                        </div>
                                        <div className="recent-wk-stats">
                                            <span><Clock size={12} /> {log.duration || 0}m</span>
                                            <span className="cal-chip">
                                                <Flame size={12} /> {log.caloriesBurned || 0} kcal
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ROW 4 LEFT (6 cols): Daily Fitness Checklist & Habits */}
                <div className="bento-item checklist-card">
                    <div className="bento-header">
                        <h3><CheckCircle2 size={17} color="#22c55e" /> Daily Fitness Checklist</h3>
                        <span className="pct-badge green">{completedCheckCount} / {totalCheckCount} Done</span>
                    </div>

                    <div className="checklist-items">
                        {autoTargets.map((item) => (
                            <div key={item.id} className={`checklist-row auto ${item.done ? "checked" : ""}`}>
                                <span className="check-icon-wrap">
                                    {item.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                                </span>
                                <span className="check-label">{item.label}</span>
                                <span className="check-tag">Auto</span>
                            </div>
                        ))}

                        {habits.map((h) => (
                            <button
                                key={h.id}
                                type="button"
                                className={`checklist-row interactive ${h.done ? "checked" : ""}`}
                                onClick={() => toggleHabit(h.id)}
                            >
                                <span className="check-icon-wrap">
                                    {h.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                                </span>
                                <span className="check-label">{h.label}</span>
                                <span className="check-tag">{h.done ? "Done" : "Tap"}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ROW 4 RIGHT (6 cols): AI Readiness & Weekly Milestones */}
                <div className="bento-item readiness-milestones-card">
                    <div className="bento-header">
                        <h3><Trophy size={17} color="#f59e0b" /> Readiness &amp; Milestones</h3>
                        <Link to="/progress" className="bento-action-link">
                            Full Progress <ArrowUpRight size={14} />
                        </Link>
                    </div>

                    <div className={`readiness-banner ${readiness.color}`}>
                        <span className="readiness-tag"><TrendingUp size={13} /> {readiness.badge}</span>
                        <h4>{readiness.title}</h4>
                        <p>{readiness.desc}</p>
                    </div>

                    <div className="milestones-mini-grid">
                        <div className="milestone-box">
                            <Flame size={16} color="#ef4444" />
                            <div>
                                <strong>{weeklyBestBurn.toLocaleString()} kcal</strong>
                                <span>Best Day Burn</span>
                            </div>
                        </div>
                        <div className="milestone-box">
                            <Calendar size={16} color="#3b82f6" />
                            <div>
                                <strong>{weeklyActiveDays} / 7 Days</strong>
                                <span>Active This Week</span>
                            </div>
                        </div>
                        <div className="milestone-box">
                            <Trophy size={16} color="#f59e0b" />
                            <div>
                                <strong>{stats.streak} Days</strong>
                                <span>Current Streak</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}