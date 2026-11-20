import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Moon,
    Sun,
    Bed,
    Clock,
    Loader2,
    Sparkles,
    History,
    Calendar,
    AlertCircle,
    RefreshCw,
    ArrowUpRight,
    Target,
    TrendingUp,
    Trophy,
    CheckCircle2,
} from "lucide-react";
import API from "../../services/api";

const getLocalDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const CountUp = ({ end, duration = 800, decimals = 0, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        let frame;
        const target = Number(end) || 0;

        const animate = (ts) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = target * easeOut;

            setCount(decimals > 0 ? Number(current.toFixed(decimals)) : Math.floor(current));
            if (progress < 1) frame = requestAnimationFrame(animate);
            else setCount(target);
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [end, duration, decimals]);

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

const QUALITY_OPTIONS = ["Poor", "Fair", "Good", "Excellent"];

const SLEEP_PRESETS = [
    { label: "10 PM – 6 AM", sleep: "22:00", wake: "06:00" },
    { label: "11 PM – 7 AM", sleep: "23:00", wake: "07:00" },
    { label: "11:30 PM – 6:30 AM", sleep: "23:30", wake: "06:30" },
];

export default function Sleep() {
    const [data, setData] = useState(null);
    const [history, setHistory] = useState([]);

    const [sleep, setSleep] = useState("22:00");
    const [wake, setWake] = useState("06:00");
    const [quality, setQuality] = useState("Good");

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savedMsg, setSavedMsg] = useState("");
    const [error, setError] = useState("");

    const load = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            setError("");
            const today = getLocalDate();

            const [todayRes, historyRes] = await Promise.all([
                API.get("/api/sleep/today", { params: { date: today } }),
                API.get("/api/sleep/history", { params: { days: 30 } }),
            ]);

            setData(todayRes.data);
            setHistory(historyRes.data.history || []);

            if (todayRes.data.log) {
                setSleep(todayRes.data.log.sleepTime.slice(11, 16));
                setWake(todayRes.data.log.wakeTime.slice(11, 16));
                setQuality(todayRes.data.log.quality || "Good");
            }
        } catch (err) {
            console.error("Failed to load sleep data", err);
            setError("Failed to load sleep data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load(false);
    }, [load]);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const todayStr = getLocalDate();
            const now = new Date();

            const [sleepH, sleepM] = sleep.split(":").map(Number);
            const [wakeH, wakeM] = wake.split(":").map(Number);
            const isOvernight = sleepH * 60 + sleepM > wakeH * 60 + wakeM;

            let sleepDateStr = todayStr;
            if (isOvernight) {
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                sleepDateStr = getLocalDate(yesterday);
            }

            await API.post("/api/sleep", {
                sleepTime: `${sleepDateStr}T${sleep}:00`,
                wakeTime: `${todayStr}T${wake}:00`,
                quality,
                date: todayStr,
            });
            setSavedMsg("Sleep log saved");
            setTimeout(() => setSavedMsg(""), 2400);
            await load(true);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save sleep log");
        } finally {
            setSaving(false);
        }
    };

    const calculateDuration = () => {
        if (!sleep || !wake) return 0;
        const [sleepH, sleepM] = sleep.split(":").map(Number);
        const [wakeH, wakeM] = wake.split(":").map(Number);

        let diffMins = wakeH * 60 + wakeM - (sleepH * 60 + sleepM);
        if (diffMins < 0) diffMins += 24 * 60;
        return +(diffMins / 60).toFixed(1);
    };

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary, #ef4444)" }} />
            </div>
        );
    }

    const previewDuration = calculateDuration();
    const goal = data?.goal || 8;
    const percent = Math.min(100, Math.round((previewDuration / Math.max(goal, 1)) * 100));

    const recent7 = history.slice(0, 7);
    const avg7Day = recent7.length
        ? +(recent7.reduce((s, l) => s + (Number(l.durationHours) || 0), 0) / recent7.length).toFixed(1)
        : previewDuration;
    const bestNight = history.length
        ? Math.max(...history.map((l) => Number(l.durationHours) || 0))
        : previewDuration;

    const todayFormatted = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    const getRecoveryAdvice = () => {
        if (previewDuration >= goal) {
            return {
                color: "green",
                badge: "Peak Recovery",
                title: "Cleared for High-Intensity Output",
                desc: "Full restorative sleep achieved. Your CNS and muscle recovery are primed for heavy lifts or HIIT.",
            };
        }
        if (previewDuration >= 6) {
            return {
                color: "amber",
                badge: "Moderate Recovery",
                title: "Steady Training + Early Wind-Down",
                desc: `You're ${(goal - previewDuration).toFixed(1)}h shy of your ${goal}h target. Aim for an earlier lights-out tonight.`,
            };
        }
        return {
            color: "red",
            badge: "Recovery Deficit",
            title: "Prioritize Mobility & Hydration",
            desc: "Under 6h sleep slows protein synthesis. Focus on Zone 2 cardio, stretching, and 20-min afternoon rest.",
        };
    };

    const advice = getRecoveryAdvice();

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
        <div className="bento-page-wrapper">
            {/* ===== TOP COMMAND HEADER (DASHBOARD RED & OBSIDIAN THEME) ===== */}
            <section className="dashboard-header-bento">
                <div className="header-left-col">
                    <div className="header-meta-row">
                        <span className="date-pill">
                            <Calendar size={12} /> {todayFormatted}
                        </span>
                        <span className="readiness-pill">
                            <span className="pulse-dot" />
                            <Target size={12} /> Sleep Goal: <strong>{percent}%</strong>
                        </span>
                        <button
                            type="button"
                            className="refresh-mini-btn"
                            onClick={() => load(true)}
                            disabled={refreshing}
                            title="Refresh sleep data"
                            aria-label="Refresh sleep data"
                        >
                            <RefreshCw size={13} className={refreshing ? "spin" : ""} />
                        </button>
                    </div>

                    <div className="greeting-section">
                        <h1>
                            Sleep <span>Recovery</span>
                        </h1>
                        <p>
                            {previewDuration >= goal
                                ? `Optimal rest! ${previewDuration}h logged meets your ${goal}h nightly recovery target.`
                                : `${previewDuration}h scheduled — ${(goal - previewDuration).toFixed(1)}h more reaches your ${goal}h recovery goal.`}
                        </p>
                    </div>

                    <div className="quick-actions-row">
                        <button
                            type="button"
                            className="quick-action-chip primary"
                            onClick={() => {
                                setSleep("22:00");
                                setWake("06:00");
                                setQuality("Excellent");
                            }}
                        >
                            <Moon size={14} /> 8h Preset
                        </button>
                        <Link to="/dashboard" className="quick-action-chip">
                            Dashboard <ArrowUpRight size={13} />
                        </Link>
                        <Link to="/workouts" className="quick-action-chip">
                            Workouts <ArrowUpRight size={13} />
                        </Link>
                        <Link to="/water" className="quick-action-chip">
                            Hydration <ArrowUpRight size={13} />
                        </Link>
                    </div>
                </div>

                {/* Top 4 KPI Tiles */}
                <div className="top-stats-row">
                    <div className="mini-stat">
                        <div className="mini-icon-box purple">
                            <Moon size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={previewDuration} decimals={1} suffix="h" />
                            </strong>
                            <span>Duration</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box green">
                            <Target size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={percent} suffix="%" />
                            </strong>
                            <span>Goal Achieved</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box orange">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <strong>{quality}</strong>
                            <span>Sleep Quality</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box red">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={avg7Day} decimals={1} suffix="h" />
                            </strong>
                            <span>7-Day Avg</span>
                        </div>
                    </div>
                </div>
            </section>

            {error && (
                <div className="bento-error-banner">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* ===== 12-COLUMN BENTO GRID ===== */}
            <div className="bento-grid">
                {/* ROW 1 LEFT (5 cols): Sleep Recovery Ring */}
                <div className="bento-item col-span-5 sleep-gauge-bento">
                    <div className="bento-header">
                        <h3>
                            <Moon size={17} color="#a855f7" /> Sleep Recovery Ring
                        </h3>
                        <span className="pct-badge purple">{percent}% Complete</span>
                    </div>

                    <div className="gauge-bento-center">
                        <div className="water-gauge-wrapper">
                            <svg width="200" height="200" className="sleep-svg">
                                <circle
                                    cx="100"
                                    cy="100"
                                    r={radius}
                                    stroke="var(--bg-elevated, #18181c)"
                                    strokeWidth="12"
                                    fill="none"
                                />
                                <circle
                                    cx="100"
                                    cy="100"
                                    r={radius}
                                    stroke="#a855f7"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className="sleep-svg-fill"
                                />
                            </svg>
                            <div className="sleep-gauge-content">
                                <Moon size={30} className="text-purple" />
                                <h2>{previewDuration}h</h2>
                                <span>of {goal}h goal</span>
                            </div>
                        </div>
                    </div>

                    <div className="water-progress-footer">
                        <div className="water-progress-meta">
                            <span>Schedule: {sleep} → {wake}</span>
                            <strong>{previewDuration} / {goal} hrs</strong>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill purple" style={{ width: `${percent}%` }} />
                        </div>
                    </div>
                </div>

                {/* ROW 1 RIGHT (7 cols): Log Sleep Form Studio */}
                <div className="bento-item col-span-7">
                    <div className="bento-header">
                        <h3>
                            <Bed size={17} color="var(--accent-primary, #ef4444)" /> Log Sleep Details
                        </h3>
                        {savedMsg && (
                            <span className="pct-badge green">
                                <CheckCircle2 size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                                {savedMsg}
                            </span>
                        )}
                    </div>

                    <form onSubmit={save} className="sleep-form" style={{ marginTop: 0 }}>
                        <div className="sleep-presets-row">
                            <span>Quick schedule:</span>
                            {SLEEP_PRESETS.map((p) => (
                                <button
                                    key={p.label}
                                    type="button"
                                    className="sleep-preset-chip"
                                    onClick={() => {
                                        setSleep(p.sleep);
                                        setWake(p.wake);
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <div className="sleep-time-grid">
                            <div>
                                <label className="sleep-field-label">
                                    <Clock size={13} /> Bedtime
                                </label>
                                <input
                                    type="time"
                                    value={sleep}
                                    onChange={(e) => setSleep(e.target.value)}
                                    required
                                    className="premium-input"
                                />
                            </div>
                            <div>
                                <label className="sleep-field-label">
                                    <Sun size={13} /> Wake Time
                                </label>
                                <input
                                    type="time"
                                    value={wake}
                                    onChange={(e) => setWake(e.target.value)}
                                    required
                                    className="premium-input"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="sleep-field-label">
                                <Sparkles size={13} /> Sleep Quality
                            </label>
                            <div className="sleep-quality-pills">
                                {QUALITY_OPTIONS.map((q) => (
                                    <button
                                        key={q}
                                        type="button"
                                        className={`quality-pill-btn ${quality === q ? "active" : ""}`}
                                        onClick={() => setQuality(q)}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="vf-bento-submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 size={17} className="spin" /> Saving...
                                </>
                            ) : (
                                "Save Sleep Log"
                            )}
                        </button>
                    </form>
                </div>

                {/* ROW 2 LEFT (6 cols): Recovery Readiness & Milestones */}
                <div className="bento-item col-span-6">
                    <div className="bento-header">
                        <h3>
                            <Trophy size={17} color="#f59e0b" /> Recovery Readiness
                        </h3>
                        <Link to="/settings" className="bento-action-link">
                            Edit Goal <ArrowUpRight size={14} />
                        </Link>
                    </div>

                    <div className={`readiness-banner ${advice.color}`}>
                        <span className="readiness-tag">
                            <TrendingUp size={13} /> {advice.badge}
                        </span>
                        <h4>{advice.title}</h4>
                        <p>{advice.desc}</p>
                    </div>

                    <div className="milestones-mini-grid">
                        <div className="milestone-box">
                            <Moon size={16} color="#a855f7" />
                            <div>
                                <strong>{bestNight.toFixed(1)}h</strong>
                                <span>Best Night</span>
                            </div>
                        </div>
                        <div className="milestone-box">
                            <Calendar size={16} color="#ef4444" />
                            <div>
                                <strong>{history.length} Nights</strong>
                                <span>Logged (30d)</span>
                            </div>
                        </div>
                        <div className="milestone-box">
                            <Target size={16} color="#22c55e" />
                            <div>
                                <strong>{goal} hrs</strong>
                                <span>Nightly Goal</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 2 RIGHT (6 cols): Recent Sleep History */}
                <div className="bento-item col-span-6">
                    <div className="bento-header">
                        <h3>
                            <History size={17} color="var(--accent-primary, #ef4444)" /> Recent Sleep History
                        </h3>
                        <span className="pct-badge red">{history.length} Logs</span>
                    </div>

                    {history.length === 0 ? (
                        <div className="empty-state" style={{ padding: "28px 16px" }}>
                            <Moon size={36} className="empty-icon" style={{ marginBottom: 10 }} />
                            <h3>No sleep history found</h3>
                            <p>Log your sleep above to start tracking recovery trends.</p>
                        </div>
                    ) : (
                        <div className="sleep-history-scroll">
                            {history.map((log) => (
                                <div key={log._id} className="sleep-log-item">
                                    <div className="sleep-log-info">
                                        <div className="sleep-log-icon">
                                            <Moon size={18} />
                                        </div>
                                        <div>
                                            <strong className="sleep-log-duration">
                                                {Number(log.durationHours).toFixed(1)} Hours
                                            </strong>
                                            <div className="sleep-log-meta">
                                                <span>
                                                    <Calendar size={12} />{" "}
                                                    {new Date(log.date).toLocaleDateString(undefined, {
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </span>
                                                <span>
                                                    <Sparkles size={12} /> {log.quality}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="badge purple-badge time-badge">
                                        {new Date(log.sleepTime).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}{" "}
                                        –{" "}
                                        {new Date(log.wakeTime).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}