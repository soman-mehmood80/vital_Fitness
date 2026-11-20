import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    Footprints,
    Play,
    Square,
    Loader2,
    Target,
    AlertCircle,
    Activity,
    Calendar,
    RefreshCw,
    ArrowUpRight,
    Flame,
    TrendingUp,
    Trophy,
    CheckCircle2,
    Circle,
    Plus,
    Zap,
} from "lucide-react";
import API from "../../services/api";

const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
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

export default function StepCounter() {
    const [steps, setSteps] = useState(0);
    const [manualSteps, setManualSteps] = useState("");
    const [totalToday, setTotalToday] = useState(0);
    const [goal, setGoal] = useState(10000);
    const [isCounting, setIsCounting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");
    const lastStepTime = useRef(0);

    const fetchSteps = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const res = await API.get("/api/steps/today", {
                params: { date: getLocalDate() },
            });
            setTotalToday(res.data.steps || 0);
            setGoal(res.data.goal || 10000);
        } catch (err) {
            console.error(err);
            setError("Failed to load step data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchSteps(false);
    }, [fetchSteps]);

    // Sensor logic (preserved)
    useEffect(() => {
        if (!isCounting) return;

        const handleMotion = (event) => {
            const acc = event.accelerationIncludingGravity;
            if (!acc) return;

            const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);

            if (magnitude > 12) {
                const now = Date.now();
                if (now - lastStepTime.current > 300) {
                    lastStepTime.current = now;
                    setSteps((prev) => prev + 1);
                }
            }
        };

        window.addEventListener("devicemotion", handleMotion);
        return () => window.removeEventListener("devicemotion", handleMotion);
    }, [isCounting]);

    const addStepsToServer = async (amountToAdd, fromSensor = false) => {
        const numeric = Number(amountToAdd);
        if (!numeric || numeric <= 0) return;

        setSaving(true);
        setError("");
        try {
            const res = await API.post("/api/steps/add", {
                steps: numeric,
                date: getLocalDate(),
            });
            setTotalToday(res.data.steps);
            if (fromSensor) {
                setSteps(0);
                setIsCounting(false);
            }
            setFeedback(`+${numeric.toLocaleString()} steps saved`);
            setTimeout(() => setFeedback(""), 2200);
        } catch {
            setError("Failed to save steps");
        } finally {
            setSaving(false);
        }
    };

    const syncSteps = async () => {
        if (steps === 0) {
            setIsCounting(false);
            return;
        }
        await addStepsToServer(steps, true);
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        const amt = Number(manualSteps);
        if (!amt || amt <= 0) {
            setError("Please enter a valid number of steps.");
            return;
        }
        await addStepsToServer(amt, false);
        setManualSteps("");
    };

    const requestPermission = async () => {
        setError("");

        if (
            typeof DeviceMotionEvent !== "undefined" &&
            typeof DeviceMotionEvent.requestPermission === "function"
        ) {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === "granted") setIsCounting(true);
                else setError("Permission denied. Steps cannot be tracked.");
            } catch {
                setError("Cannot access motion sensors on this device");
            }
        } else if (typeof DeviceMotionEvent !== "undefined") {
            setIsCounting(true);
        } else {
            setError("Your device doesn't support step tracking. Try on mobile.");
        }
    };

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary, #ef4444)" }} />
            </div>
        );
    }

    const percent = Math.min(100, Math.round((totalToday / Math.max(goal, 1)) * 100));
    const remaining = Math.max(0, goal - totalToday);
    const estCalories = Math.round(totalToday * 0.04);
    const estDistanceKm = +(totalToday * 0.00076).toFixed(2);
    const estActiveMins = Math.round(totalToday / 100);

    const todayFormatted = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    const getMovementAdvice = () => {
        if (percent >= 100) {
            return {
                color: "green",
                badge: "Target Achieved",
                title: "Daily Step Goal Crushed!",
                desc: `You've logged ${totalToday.toLocaleString()} steps (~${estDistanceKm} km). Great cardiovascular base work.`,
            };
        }
        if (percent >= 50) {
            return {
                color: "amber",
                badge: "Strong Momentum",
                title: `${remaining.toLocaleString()} Steps Remaining`,
                desc: "A brisk 20-minute evening walk will lock in your 100% daily movement target.",
            };
        }
        return {
            color: "red",
            badge: "Movement Priority",
            title: "Time for a Quick Walk Break",
            desc: "Aim for 2,000–3,000 steps this afternoon to boost NEAT calorie burn and metabolic recovery.",
        };
    };

    const advice = getMovementAdvice();

    const milestones = [
        { label: "Warm-up stride (2,500 steps)", done: totalToday >= 2500 },
        { label: "Halfway milestone (5,000 steps)", done: totalToday >= 5000 },
        { label: "Active threshold (7,500 steps)", done: totalToday >= 7500 },
        { label: `Daily target (${goal.toLocaleString()} steps)`, done: totalToday >= goal },
    ];
    const doneCount = milestones.filter((m) => m.done).length;

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
                            <Target size={12} /> Step Goal: <strong>{percent}%</strong>
                        </span>
                        <button
                            type="button"
                            className="refresh-mini-btn"
                            onClick={() => fetchSteps(true)}
                            disabled={refreshing}
                            title="Refresh step data"
                            aria-label="Refresh step data"
                        >
                            <RefreshCw size={13} className={refreshing ? "spin" : ""} />
                        </button>
                    </div>

                    <div className="greeting-section">
                        <h1>
                            Movement <span>Tracker</span>
                        </h1>
                        <p>
                            {remaining === 0
                                ? `Goal complete! You have walked ${totalToday.toLocaleString()} steps today.`
                                : `${remaining.toLocaleString()} steps left to reach your daily goal of ${goal.toLocaleString()} steps.`}
                        </p>
                    </div>

                    <div className="quick-actions-row">
                        {!isCounting ? (
                            <button
                                type="button"
                                className="quick-action-chip primary"
                                onClick={requestPermission}
                            >
                                <Play size={14} /> Start Walking
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="quick-action-chip primary"
                                onClick={syncSteps}
                                disabled={saving}
                            >
                                <Square size={14} /> Save ({steps})
                            </button>
                        )}
                        <Link to="/dashboard" className="quick-action-chip">
                            Dashboard <ArrowUpRight size={13} />
                        </Link>
                        <Link to="/workouts" className="quick-action-chip">
                            Workouts <ArrowUpRight size={13} />
                        </Link>
                    </div>
                </div>

                {/* Top 4 KPI Tiles */}
                <div className="top-stats-row">
                    <div className="mini-stat">
                        <div className="mini-icon-box green">
                            <Footprints size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={totalToday} />
                            </strong>
                            <span>Today&apos;s Steps</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box red">
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
                            <Flame size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={estCalories} />
                            </strong>
                            <span>Est. Burn (kcal)</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box blue">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={estDistanceKm} decimals={2} suffix=" km" />
                            </strong>
                            <span>Est. Distance</span>
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
                {/* ROW 1 LEFT (5 cols): Daily Steps Ring */}
                <div className="bento-item col-span-5 step-gauge-bento">
                    <div className="bento-header">
                        <h3>
                            <Footprints size={17} color="#22c55e" /> Daily Steps Ring
                        </h3>
                        <span className="pct-badge green">{percent}% Complete</span>
                    </div>

                    <div className="gauge-bento-center">
                        <div className="water-gauge-wrapper">
                            <svg width="200" height="200" className="step-svg">
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
                                    stroke="#22c55e"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className="step-svg-fill"
                                />
                            </svg>
                            <div className="water-gauge-content">
                                <Footprints size={30} className="text-green" />
                                <h2>{totalToday.toLocaleString()}</h2>
                                <span>of {goal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="water-progress-footer">
                        <div className="water-progress-meta">
                            <span>Daily Stride Progress</span>
                            <strong>
                                {totalToday.toLocaleString()} / {goal.toLocaleString()}
                            </strong>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill green" style={{ width: `${percent}%` }} />
                        </div>
                    </div>
                </div>

                {/* ROW 1 RIGHT (7 cols): Live Walk Sensor & Quick Add */}
                <div className="bento-item col-span-7">
                    <div className="bento-header">
                        <h3>
                            <Zap size={17} color="var(--accent-primary, #ef4444)" /> Track Your Walk
                        </h3>
                        {feedback ? (
                            <span className="pct-badge green">{feedback}</span>
                        ) : isCounting ? (
                            <span className="readiness-pill">
                                <span className="pulse-dot" /> Sensor Active
                            </span>
                        ) : (
                            <span className="pct-badge red">Motion Sensor Ready</span>
                        )}
                    </div>

                    <div className="live-steps-bento">
                        <span>Live Session Steps</span>
                        <h2>{steps.toLocaleString()}</h2>
                        <small>
                            {isCounting
                                ? "Keep your phone in hand or pocket while walking"
                                : "Tap Start Walking below to count steps in real time"}
                        </small>
                    </div>

                    {!isCounting ? (
                        <button
                            type="button"
                            className="vf-bento-submit"
                            onClick={requestPermission}
                            style={{ marginBottom: 14 }}
                        >
                            <Play size={17} /> Start Walking
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="vf-bento-submit green"
                            onClick={syncSteps}
                            disabled={saving}
                            style={{ marginBottom: 14 }}
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={17} className="spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Square size={17} /> Stop &amp; Save ({steps} steps)
                                </>
                            )}
                        </button>
                    )}

                    {/* Optional manual log (handy on desktop browsers without motion sensors) */}
                    <form className="water-custom-row" onSubmit={handleManualSubmit} style={{ marginBottom: 0 }}>
                        <input
                            type="number"
                            min="1"
                            max="100000"
                            className="premium-input"
                            placeholder="Or manually add steps (e.g. 1500)"
                            value={manualSteps}
                            onChange={(e) => setManualSteps(e.target.value)}
                            disabled={saving}
                        />
                        <button type="submit" className="water-custom-btn" disabled={saving}>
                            <Plus size={15} /> Add Steps
                        </button>
                    </form>
                </div>

                {/* ROW 2 LEFT (6 cols): Movement Readiness & Stats */}
                <div className="bento-item col-span-6">
                    <div className="bento-header">
                        <h3>
                            <Trophy size={17} color="#f59e0b" /> Movement Telemetry
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
                            <Footprints size={16} color="#22c55e" />
                            <div>
                                <strong>{remaining.toLocaleString()}</strong>
                                <span>Steps Left</span>
                            </div>
                        </div>
                        <div className="milestone-box">
                            <Activity size={16} color="#ef4444" />
                            <div>
                                <strong>~{estActiveMins} min</strong>
                                <span>Walk Time</span>
                            </div>
                        </div>
                        <div className="milestone-box">
                            <Target size={16} color="#f59e0b" />
                            <div>
                                <strong>{goal.toLocaleString()}</strong>
                                <span>Daily Goal</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 2 RIGHT (6 cols): Daily Milestones & Sensor Info */}
                <div className="bento-item col-span-6">
                    <div className="bento-header">
                        <h3>
                            <CheckCircle2 size={17} color="#22c55e" /> Daily Step Checkpoints
                        </h3>
                        <span className="pct-badge green">
                            {doneCount} / {milestones.length} Done
                        </span>
                    </div>

                    <div className="checklist-items">
                        {milestones.map((item, idx) => (
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

                    <div className="step-info-note">
                        <div className="icon-box red" style={{ width: 36, height: 36, flexShrink: 0 }}>
                            <Activity size={18} />
                        </div>
                        <div>
                            <strong>How step tracking works</strong>
                            <p>
                                Your mobile motion sensor detects strides while walking. Tap &ldquo;Stop &amp; Save&rdquo;
                                to sync steps to your Dashboard, or use manual entry on desktop.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}