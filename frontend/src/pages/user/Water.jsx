import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Droplets,
    Plus,
    Loader2,
    Target,
    RotateCcw,
    AlertCircle,
    Calendar,
    RefreshCw,
    ArrowUpRight,
    CheckCircle2,
    Circle,
    TrendingUp,
    Clock,
    Zap,
    Trophy,
} from "lucide-react";
import API from "../../services/api";

const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
};

const CountUp = ({ end, duration = 800 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        let frame;
        const target = Number(end) || 0;

        const animate = (ts) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(target * easeOut));

            if (progress < 1) frame = requestAnimationFrame(animate);
            else setCount(target);
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [end, duration]);

    return <>{count.toLocaleString()}</>;
};

const QUICK_PRESETS = [
    { amount: 250, label: "Small Glass", sub: "1 standard cup" },
    { amount: 500, label: "Water Bottle", sub: "Standard 0.5L" },
    { amount: 750, label: "Gym Shaker", sub: "Training bottle" },
    { amount: 1000, label: "Large Jug", sub: "Full 1.0 Liter" },
];

export default function Water() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [customAmount, setCustomAmount] = useState("");
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");

    const load = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            setError("");
            const res = await API.get("/api/water/today", {
                params: { date: getLocalDate() },
            });
            setData(res.data);
        } catch (err) {
            console.error("Failed to load water data:", err);
            setError("Failed to load water data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load(false);
    }, [load]);

    const add = async (amt) => {
        const numeric = Number(amt);
        if (isAdding || !numeric || numeric <= 0) return;

        setIsAdding(true);
        setError("");
        try {
            await API.post("/api/water", {
                amount: numeric,
                date: getLocalDate(),
            });
            setFeedback(`+${numeric} ml added`);
            setTimeout(() => setFeedback(""), 2200);
            await load(true);
        } catch (err) {
            console.error("Add Water Error:", err);
            setError(err.response?.data?.message || "Failed to add water");
        } finally {
            setIsAdding(false);
        }
    };

    const handleCustomSubmit = (e) => {
        e.preventDefault();
        const amt = Number(customAmount);
        if (!amt || amt <= 0) {
            setError("Please enter a valid water amount in ml.");
            return;
        }
        add(amt);
        setCustomAmount("");
    };

    const reset = async () => {
        if (!window.confirm("Reset today's water intake? This will set it to 0.")) return;
        if (!data?.log?._id) return;

        try {
            await API.delete(`/api/water/${data.log._id}`);
            setFeedback("Today's log reset");
            setTimeout(() => setFeedback(""), 2200);
            await load(true);
        } catch {
            setError("Failed to reset");
        }
    };

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary, #ef4444)" }} />
            </div>
        );
    }

    const total = data?.total || 0;
    const goal = data?.goal || 2500;
    const percent = Math.min(100, data?.percentage ?? Math.round((total / Math.max(goal, 1)) * 100));
    const remaining = data?.remaining ?? Math.max(0, goal - total);
    const glassesDone = Math.floor(total / 250);
    const glassesLeft = Math.ceil(remaining / 250);

    const todayFormatted = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    const getHydrationAdvice = () => {
        if (percent >= 100) {
            return {
                color: "green",
                badge: "Goal Achieved",
                title: "Peak Cellular Hydration",
                desc: "You hit 100% of your daily water target. Maintain steady sips around training sessions.",
            };
        }
        if (percent >= 50) {
            return {
                color: "amber",
                badge: "Momentum Building",
                title: `${glassesLeft} More Glass${glassesLeft === 1 ? "" : "es"} to Target`,
                desc: `Great pace! Sip ${Math.max(150, Math.round(remaining / 4))} ml every hour to finish strong.`,
            };
        }
        return {
            color: "red",
            badge: "Hydration Priority",
            title: "Front-Load Your Hydration",
            desc: "Drink a 500 ml bottle now to boost energy, mental focus, and recovery before evening.",
        };
    };

    const advice = getHydrationAdvice();

    const checkpoints = [
        { label: "Morning kickstart (500 ml)", done: total >= 500 },
        { label: "Halfway milestone (50% goal)", done: percent >= 50 },
        { label: "Pre-workout hydration (75% goal)", done: percent >= 75 },
        { label: `Daily target complete (${goal.toLocaleString()} ml)`, done: percent >= 100 },
    ];
    const completedChecks = checkpoints.filter((c) => c.done).length;

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
                            <Target size={12} /> Hydration Goal: <strong>{percent}%</strong>
                        </span>
                        <button
                            type="button"
                            className="refresh-mini-btn"
                            onClick={() => load(true)}
                            disabled={refreshing}
                            title="Refresh hydration data"
                            aria-label="Refresh hydration data"
                        >
                            <RefreshCw size={13} className={refreshing ? "spin" : ""} />
                        </button>
                    </div>

                    <div className="greeting-section">
                        <h1>
                            Hydration <span>Tracker</span>
                        </h1>
                        <p>
                            {remaining === 0
                                ? "Target reached! Optimal fluid balance keeps endurance and recovery at their peak."
                                : `${remaining.toLocaleString()} ml remaining today to reach your ${goal.toLocaleString()} ml hydration goal.`}
                        </p>
                    </div>

                    <div className="quick-actions-row">
                        <button
                            type="button"
                            className="quick-action-chip primary"
                            onClick={() => add(250)}
                            disabled={isAdding}
                        >
                            <Plus size={14} /> +250 ml
                        </button>
                        <button
                            type="button"
                            className="quick-action-chip"
                            onClick={() => add(500)}
                            disabled={isAdding}
                        >
                            <Plus size={13} /> +500 ml
                        </button>
                        <Link to="/dashboard" className="quick-action-chip">
                            Dashboard <ArrowUpRight size={13} />
                        </Link>
                        <Link to="/nutrition" className="quick-action-chip">
                            Nutrition <ArrowUpRight size={13} />
                        </Link>
                    </div>
                </div>

                {/* Top 4 KPI Tiles (same Dashboard color badges) */}
                <div className="top-stats-row">
                    <div className="mini-stat">
                        <div className="mini-icon-box blue">
                            <Droplets size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={total} />
                            </strong>
                            <span>Consumed (ml)</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box green">
                            <Target size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={percent} />%
                            </strong>
                            <span>Goal Achieved</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box orange">
                            <Clock size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={remaining} />
                            </strong>
                            <span>Remaining (ml)</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box red">
                            <Zap size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={glassesDone} />
                            </strong>
                            <span>Glasses (250ml)</span>
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
                {/* ROW 1 LEFT (5 cols): Hydration Gauge Ring */}
                <div className="bento-item col-span-5 water-gauge-bento">
                    <div className="bento-header">
                        <h3>
                            <Droplets size={17} color="#3b82f6" /> Water Intake Ring
                        </h3>
                        <span className="pct-badge blue">{percent}% Complete</span>
                    </div>

                    <div className="water-gauge-center">
                        <div className="water-gauge-wrapper">
                            <svg width="200" height="200" className="water-svg">
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
                                    stroke="#3b82f6"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className="water-svg-fill"
                                />
                            </svg>
                            <div className="water-gauge-content">
                                <Droplets size={30} className="text-info" />
                                <h2>
                                    {total.toLocaleString()} <small>ml</small>
                                </h2>
                                <span>of {goal.toLocaleString()} ml</span>
                            </div>
                        </div>
                    </div>

                    <div className="water-progress-footer">
                        <div className="water-progress-meta">
                            <span>Daily Progress</span>
                            <strong>
                                {total.toLocaleString()} / {goal.toLocaleString()} ml
                            </strong>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill blue" style={{ width: `${percent}%` }} />
                        </div>
                    </div>
                </div>

                {/* ROW 1 RIGHT (7 cols): Quick Add & Custom Intake */}
                <div className="bento-item col-span-7">
                    <div className="bento-header">
                        <h3>
                            <Plus size={17} color="var(--accent-primary, #ef4444)" /> Quick Log Water
                        </h3>
                        {feedback && <span className="water-feedback-pill">{feedback}</span>}
                    </div>

                    <div className="water-preset-grid">
                        {QUICK_PRESETS.map((preset) => (
                            <button
                                key={preset.amount}
                                type="button"
                                className="water-preset-btn"
                                onClick={() => add(preset.amount)}
                                disabled={isAdding}
                            >
                                <div className="water-preset-icon">
                                    <Droplets size={20} />
                                </div>
                                <div>
                                    <strong>+{preset.amount} ml</strong>
                                    <span>
                                        {preset.label} • {preset.sub}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <form className="water-custom-row" onSubmit={handleCustomSubmit}>
                        <input
                            type="number"
                            min="1"
                            max="5000"
                            className="premium-input"
                            placeholder="Custom amount in ml (e.g. 350)"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            disabled={isAdding}
                        />
                        <button type="submit" className="water-custom-btn" disabled={isAdding}>
                            {isAdding ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
                            Add Custom
                        </button>
                    </form>

                    <div className="water-controls-footer">
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            Synced automatically with your Dashboard telemetry.
                        </span>
                        {total > 0 && data?.log?._id && (
                            <button type="button" className="water-reset-btn" onClick={reset}>
                                <RotateCcw size={13} /> Reset Today
                            </button>
                        )}
                    </div>
                </div>

                {/* ROW 2 LEFT (6 cols): Hydration Readiness & Pace */}
                <div className="bento-item col-span-6">
                    <div className="bento-header">
                        <h3>
                            <Trophy size={17} color="#f59e0b" /> Hydration Telemetry
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
                            <Droplets size={16} color="#3b82f6" />
                            <div>
                                <strong>{(total / 1000).toFixed(2)} L</strong>
                                <span>Volume Today</span>
                            </div>
                        </div>
                        <div className="milestone-box">
                            <Target size={16} color="#ef4444" />
                            <div>
                                <strong>{(goal / 1000).toFixed(1)} L</strong>
                                <span>Daily Target</span>
                            </div>
                        </div>
                        <div className="milestone-box">
                            <Clock size={16} color="#f59e0b" />
                            <div>
                                <strong>{glassesLeft} Cups</strong>
                                <span>To Target</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 2 RIGHT (6 cols): Daily Hydration Checkpoints */}
                <div className="bento-item col-span-6">
                    <div className="bento-header">
                        <h3>
                            <CheckCircle2 size={17} color="#22c55e" /> Daily Hydration Checkpoints
                        </h3>
                        <span className="pct-badge green">
                            {completedChecks} / {checkpoints.length} Done
                        </span>
                    </div>

                    <div className="checklist-items">
                        {checkpoints.map((item, idx) => (
                            <div
                                key={idx}
                                className={`checklist-row ${item.done ? "checked" : ""}`}
                            >
                                <span className="check-icon-wrap">
                                    {item.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                                </span>
                                <span className="check-label">{item.label}</span>
                                <span className="check-tag">{item.done ? "Done" : "Pending"}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}