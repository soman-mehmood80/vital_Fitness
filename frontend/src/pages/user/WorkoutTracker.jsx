import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    CheckCircle2,
    X,
    Timer,
    Loader2,
    Flame,
    AlertCircle,
    Play,
    Pause,
    RotateCcw,
    Dumbbell,
    Trophy,
} from "lucide-react";
import API from "../../services/api";

export default function WorkoutTracker() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [workout, setWorkout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);
    const [caloriesBurned, setCaloriesBurned] = useState(0);
    const [notes, setNotes] = useState("");

    // Built-in Between-Set Rest Countdown
    const [restSeconds, setRestSeconds] = useState(0);

    // Fetch workout
    useEffect(() => {
        API.get(`/api/workouts/${id}`)
            .then((res) => {
                setWorkout(res.data.workout);
                setCaloriesBurned(res.data.workout.caloriesEstimate || 0);
            })
            .catch(() => setError("Failed to load workout"))
            .finally(() => setLoading(false));
    }, [id]);

    // Main Workout Timer
    useEffect(() => {
        let interval = null;
        if (isActive && !isCompleted) {
            interval = setInterval(() => setSeconds((s) => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, isCompleted]);

    // Rest Timer Countdown
    useEffect(() => {
        if (restSeconds <= 0) return;
        const t = setTimeout(() => setRestSeconds((prev) => Math.max(prev - 1, 0)), 1000);
        return () => clearTimeout(t);
    }, [restSeconds]);

    const formatTime = (totalSecs) => {
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60)
            .toString()
            .padStart(2, "0");
        const s = (totalSecs % 60).toString().padStart(2, "0");
        return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
    };

    const finishWorkout = async () => {
        setSaving(true);
        setError("");
        try {
            const durationMin = Math.max(1, Math.round(seconds / 60));
            await API.post("/api/workout-logs/complete", {
                workoutId: id,
                duration: durationMin,
                caloriesBurned: Number(caloriesBurned),
                notes: notes.trim().slice(0, 500),
            });
            setIsActive(false);
            setIsCompleted(true);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save workout");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary, #ef4444)" }} />
            </div>
        );
    }

    if (!workout) {
        return (
            <div className="workouts-wrapper">
                <div className="panel empty-state" style={{ marginTop: 40 }}>
                    <AlertCircle size={44} className="empty-icon" />
                    <h3>Workout not found</h3>
                    <p>This workout session may have been removed.</p>
                    <button
                        type="button"
                        className="primary-btn"
                        onClick={() => navigate("/workouts")}
                        style={{ marginTop: 16 }}
                    >
                        Back to Workouts
                    </button>
                </div>
            </div>
        );
    }

    // ===== SUCCESS SCREEN =====
    if (isCompleted) {
        return (
            <div className="tracker-success-wrap">
                <div className="tracker-success-card">
                    <div className="success-halo">
                        <CheckCircle2 size={48} color="#22c55e" />
                    </div>

                    <div className="eyebrow-pill" style={{ margin: "0 auto 12px" }}>
                        <Trophy size={13} />
                        <span>SESSION LOGGED</span>
                    </div>

                    <h1>
                        Workout <span>Complete!</span>
                    </h1>
                    <p>
                        You crushed <strong>{workout.title}</strong> in{" "}
                        <strong>{formatTime(seconds)}</strong> and burned approximately{" "}
                        <strong className="accent-text">{caloriesBurned} kcal</strong>.
                    </p>

                    <div className="success-stats-pair">
                        <div className="success-stat-box">
                            <span>Duration</span>
                            <strong>{formatTime(seconds)}</strong>
                        </div>
                        <div className="success-stat-box">
                            <span>Burned</span>
                            <strong>{caloriesBurned} kcal</strong>
                        </div>
                    </div>

                    <div className="success-actions-row">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate("/workouts")}
                        >
                            Browse More
                        </button>
                        <button
                            type="button"
                            className="primary-btn"
                            onClick={() => navigate("/my-workouts")}
                        >
                            View History
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ===== ACTIVE TRACKER HUD =====
    return (
        <div className="tracker-wrapper">
            {error && (
                <div className="error-msg">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                </div>
            )}

            {/* Top HUD Bar */}
            <div className="tracker-top-bar">
                <div className="tracker-live-pill">
                    <span className="pulse-dot" style={{ background: isActive ? "#fff" : "#f59e0b" }} />
                    <span>{isActive ? "LIVE SESSION" : "PAUSED"}</span>
                </div>

                <button
                    type="button"
                    className="tracker-end-btn"
                    onClick={() => navigate("/workouts")}
                >
                    Cancel Session <X size={15} />
                </button>
            </div>

            {/* Main 3D Glass Telemetry Panel */}
            <div className="panel tracker-hero-panel">
                <div className="eyebrow-pill" style={{ margin: "0 auto 14px" }}>
                    <Dumbbell size={13} />
                    <span>{workout.category || "TRAINING"} • {workout.difficulty || "ALL LEVELS"}</span>
                </div>

                <h1 className="tracker-title">{workout.title}</h1>

                {/* Digital Stopwatch Display */}
                <div className="tracker-clock-ring">
                    <span className="clock-label">ELAPSED TIME</span>
                    <div className="clock-digits">{formatTime(seconds)}</div>
                    <span className="clock-target">
                        Target: {workout.duration || 30} min
                    </span>
                </div>

                {/* Quick Metrics Strip */}
                <div className="tracker-metrics-strip">
                    <div className="tracker-metric-pill">
                        <span>Category</span>
                        <strong>{workout.category}</strong>
                    </div>
                    <div className="tracker-metric-pill">
                        <span>Difficulty</span>
                        <strong>{workout.difficulty}</strong>
                    </div>
                    <div className="tracker-metric-pill highlight">
                        <span>Est. Burn</span>
                        <strong>~{caloriesBurned} kcal</strong>
                    </div>
                </div>

                {/* Between-Set Rest Countdown Bar */}
                <div className="tracker-rest-bar">
                    <div className="rest-bar-left">
                        <Timer size={15} color="#3b82f6" />
                        <span>
                            {restSeconds > 0 ? (
                                <>
                                    Rest Countdown: <strong>{restSeconds}s</strong>
                                </>
                            ) : (
                                "Between-Set Rest Timer"
                            )}
                        </span>
                    </div>
                    <div className="rest-bar-actions">
                        {[45, 60, 90].map((sec) => (
                            <button
                                key={sec}
                                type="button"
                                className="rest-preset-btn"
                                onClick={() => setRestSeconds(sec)}
                            >
                                {sec}s
                            </button>
                        ))}
                        {restSeconds > 0 && (
                            <button
                                type="button"
                                className="rest-preset-btn reset"
                                onClick={() => setRestSeconds(0)}
                                title="Clear rest timer"
                            >
                                <RotateCcw size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Editable Burn & Notes */}
                <div className="tracker-form-grid">
                    <div className="tracker-field">
                        <label>
                            <Flame size={14} color="#ef4444" /> Calories Burned (kcal)
                        </label>
                        <input
                            type="number"
                            value={caloriesBurned}
                            onChange={(e) => setCaloriesBurned(Number(e.target.value))}
                            className="premium-input"
                            min="0"
                        />
                    </div>

                    <div className="tracker-field">
                        <label>Session Notes (optional)</label>
                        <textarea
                            rows="2"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="premium-input"
                            placeholder="PRs hit, energy level, or weights used..."
                            maxLength="500"
                        />
                    </div>
                </div>

                {/* Primary Controls */}
                <div className="tracker-controls-row">
                    <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className="tracker-pause-btn"
                        title={isActive ? "Pause" : "Resume"}
                    >
                        {isActive ? <Pause size={22} /> : <Play size={22} />}
                    </button>

                    <button
                        type="button"
                        onClick={finishWorkout}
                        disabled={saving}
                        className="primary-btn tracker-finish-btn"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="spin" /> Saving Session...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={19} /> Finish Workout
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}