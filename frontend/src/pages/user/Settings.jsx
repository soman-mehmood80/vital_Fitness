import { useEffect, useState } from "react";
import {
    MessageSquare,
    Shield,
    Bell,
    Sliders,
    LogOut,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Save,
    Moon,
    Target,
    Droplets,
    Footprints,
    Calendar,
    ArrowUpRight,
    Download,
    Sparkles,
    Zap,
    Timer,
    Flame,
    Dumbbell,
    Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { applyTheme } from "../../utils/theme";
import { getStoredUser, updateStoredUser } from "../../utils/auth";

const CountUp = ({ end, duration = 700, decimals = 0, suffix = "" }) => {
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

const GOAL_PRESETS = [
    {
        label: "Starter",
        waterGoal: 2000,
        sleepGoal: 7.5,
        stepGoal: 7500,
        calorieGoal: 1900,
        proteinGoal: 110,
    },
    {
        label: "Balanced",
        waterGoal: 2500,
        sleepGoal: 8,
        stepGoal: 10000,
        calorieGoal: 2200,
        proteinGoal: 140,
    },
    {
        label: "Athlete",
        waterGoal: 3500,
        sleepGoal: 8.5,
        stepGoal: 13000,
        calorieGoal: 2700,
        proteinGoal: 175,
    },
];

const TRAINING_SPLITS = [
    "Push / Pull / Legs",
    "Upper / Lower",
    "Full Body",
    "Strength & Hypertrophy",
    "HIIT & Cardio",
];

const REST_PRESETS = [30, 45, 60, 90, 120];
const SESSION_LENGTHS = [20, 30, 45, 60];
const FEEDBACK_TYPES = ["Feedback", "Bug", "Feature Request", "Other"];

export default function Settings() {
    const navigate = useNavigate();
    const user = getStoredUser();
    const [activeTab, setActiveTab] = useState("experience");

    // Enforce Obsidian Dark mode
    useEffect(() => {
        applyTheme("dark");
        try {
            localStorage.setItem("theme", "dark");
        } catch {
            // ignore
        }
    }, []);

    // Training, Units & Display Experience
    const [unitSystem, setUnitSystem] = useState(
        () => localStorage.getItem("vitalfit_units") || user?.preferences?.unitSystem || "metric"
    );
    const [trainingPrefs, setTrainingPrefs] = useState({
        preferredSplit:
            user?.preferences?.preferredSplit ||
            localStorage.getItem("vitalfit_split") ||
            "Push / Pull / Legs",
        defaultRestSec:
            Number(user?.preferences?.defaultRestSec) ||
            Number(localStorage.getItem("vitalfit_default_rest")) ||
            60,
        defaultSessionMins:
            Number(user?.preferences?.defaultSessionMins) ||
            Number(localStorage.getItem("vitalfit_default_session")) ||
            45,
        soundEffects: user?.preferences?.soundEffects ?? true,
        reducedMotion: user?.preferences?.reducedMotion ?? false,
    });
    const [savingExperience, setSavingExperience] = useState(false);

    // Notifications
    const [prefs, setPrefs] = useState({
        notifications: user?.preferences?.notifications ?? true,
        hydrationReminders: user?.preferences?.hydrationReminders ?? true,
        weeklySummary: user?.preferences?.weeklySummary ?? true,
        streakReminder: user?.preferences?.streakReminder ?? true,
    });
    const [savingPrefs, setSavingPrefs] = useState(false);

    // Goals
    const [goals, setGoals] = useState({
        waterGoal: user?.waterGoal || 2500,
        sleepGoal: user?.sleepGoal || 8,
        stepGoal: user?.stepGoal || 10000,
        calorieGoal:
            Number(user?.preferences?.calorieGoal) ||
            Number(localStorage.getItem("vitalfit_calorie_goal")) ||
            2200,
        proteinGoal:
            Number(user?.preferences?.proteinGoal) ||
            Number(localStorage.getItem("vitalfit_protein_goal")) ||
            140,
    });
    const [savingGoals, setSavingGoals] = useState(false);

    // Feedback
    const [form, setForm] = useState({ type: "Feedback", message: "" });
    const [statusMsg, setStatusMsg] = useState("");
    const [isStatusError, setIsStatusError] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [exporting, setExporting] = useState(false);

    const showStatus = (text, isErr = false) => {
        setIsStatusError(isErr);
        setStatusMsg(text);
        setTimeout(() => setStatusMsg(""), 3200);
    };

    const changeUnits = (system) => {
        setUnitSystem(system);
        try {
            localStorage.setItem("vitalfit_units", system);
        } catch {
            // ignore
        }
        API.put("/auth/profile", {
            preferences: { ...user?.preferences, theme: "dark", unitSystem: system },
        }).catch(() => {});
        showStatus(
            `Units updated to ${system === "metric" ? "Metric (ml / kg)" : "Imperial (oz / lbs)"}`
        );
    };

    const saveTrainingExperience = async () => {
        setSavingExperience(true);
        setStatusMsg("");
        try {
            localStorage.setItem("vitalfit_split", trainingPrefs.preferredSplit);
            localStorage.setItem("vitalfit_default_rest", String(trainingPrefs.defaultRestSec));
            localStorage.setItem(
                "vitalfit_default_session",
                String(trainingPrefs.defaultSessionMins)
            );
        } catch {
            // ignore
        }

        const mergedPrefs = {
            ...user?.preferences,
            ...prefs,
            ...trainingPrefs,
            theme: "dark",
            unitSystem,
        };

        try {
            await API.put("/auth/profile", { preferences: mergedPrefs });
            updateStoredUser({ ...user, preferences: mergedPrefs });
            showStatus("Training & experience preferences saved!");
        } catch {
            showStatus("Failed to save training preferences", true);
        } finally {
            setSavingExperience(false);
        }
    };

    const saveNotifications = async () => {
        setSavingPrefs(true);
        setStatusMsg("");
        const mergedPrefs = {
            ...user?.preferences,
            ...trainingPrefs,
            ...prefs,
            theme: "dark",
            unitSystem,
        };
        try {
            await API.put("/auth/profile", { preferences: mergedPrefs });
            updateStoredUser({ ...user, preferences: mergedPrefs });
            showStatus("Notification preferences saved!");
        } catch {
            showStatus("Failed to save preferences", true);
        } finally {
            setSavingPrefs(false);
        }
    };

    const saveGoals = async () => {
        setSavingGoals(true);
        setStatusMsg("");
        try {
            localStorage.setItem("vitalfit_calorie_goal", String(goals.calorieGoal));
            localStorage.setItem("vitalfit_protein_goal", String(goals.proteinGoal));
        } catch {
            // ignore
        }

        const mergedPrefs = {
            ...user?.preferences,
            ...trainingPrefs,
            ...prefs,
            theme: "dark",
            unitSystem,
            calorieGoal: goals.calorieGoal,
            proteinGoal: goals.proteinGoal,
        };

        try {
            await API.put("/auth/profile", {
                waterGoal: goals.waterGoal,
                sleepGoal: goals.sleepGoal,
                stepGoal: goals.stepGoal,
                preferences: mergedPrefs,
            });
            updateStoredUser({
                ...user,
                waterGoal: goals.waterGoal,
                sleepGoal: goals.sleepGoal,
                stepGoal: goals.stepGoal,
                preferences: mergedPrefs,
            });
            showStatus("Daily targets updated across your Dashboard!");
        } catch {
            showStatus("Failed to save goals", true);
        } finally {
            setSavingGoals(false);
        }
    };

    const submitFeedback = async (e) => {
        e.preventDefault();
        if (!form.message.trim()) return;

        setSubmitting(true);
        setStatusMsg("");

        try {
            await API.post("/api/feedback", form);
            showStatus("Thank you! Your feedback has been submitted.");
            setForm({ type: "Feedback", message: "" });
        } catch {
            showStatus("Failed to submit feedback.", true);
        } finally {
            setSubmitting(false);
        }
    };

    const exportMyData = async () => {
        if (exporting) return;
        setExporting(true);
        try {
            const [summaryRes, historyRes] = await Promise.allSettled([
                API.get("/api/dashboard/summary"),
                API.get("/api/workout-logs/my-history"),
            ]);

            const snapshot = {
                exportedAt: new Date().toISOString(),
                user: {
                    name: user?.name || "Athlete",
                    email: user?.email || "",
                    fitnessGoal: user?.fitnessGoal || "",
                    activityLevel: user?.activityLevel || "",
                },
                unitSystem,
                goals,
                trainingPreferences: trainingPrefs,
                notifications: prefs,
                todaySummary:
                    summaryRes.status === "fulfilled" ? summaryRes.value.data : null,
                workoutHistory:
                    historyRes.status === "fulfilled"
                        ? historyRes.value.data?.logs || []
                        : [],
            };

            const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `vitalfit-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showStatus("Full fitness backup downloaded!");
        } catch {
            showStatus("Failed to export backup.", true);
        } finally {
            setExporting(false);
        }
    };

    const clearLocalCache = () => {
        try {
            Object.keys(localStorage).forEach((key) => {
                if (
                    key.startsWith("vitalfit_ai_chat_") ||
                    key.startsWith("vitalfit_habits_") ||
                    key.startsWith("vitalfit_quick_sessions_")
                ) {
                    localStorage.removeItem(key);
                }
            });
            showStatus("Local UI & AI chat cache cleared!");
        } catch {
            showStatus("Could not clear local cache.", true);
        }
    };

    const logoutAll = async () => {
        if (!window.confirm("Logout from all devices? You'll be signed out everywhere.")) return;
        try {
            await API.post("/auth/logout-all");
            localStorage.clear();
            sessionStorage.clear();
            navigate("/login");
        } catch {
            alert("Failed to logout");
        }
    };

    const tabs = [
        { id: "experience", label: "Training & Units", icon: <Sliders size={18} /> },
        { id: "goals", label: "Daily Goals", icon: <Target size={18} /> },
        { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
        { id: "feedback", label: "Feedback", icon: <MessageSquare size={18} /> },
        { id: "security", label: "Security & Data", icon: <Shield size={18} /> },
    ];

    const todayFormatted = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    return (
        <div className="bento-page-wrapper">
            {/* ===== TOP COMMAND HEADER ===== */}
            <section className="dashboard-header-bento">
                <div className="header-left-col">
                    <div className="header-meta-row">
                        <span className="date-pill">
                            <Calendar size={12} /> {todayFormatted}
                        </span>
                        <span className="readiness-pill">
                            <span className="pulse-dot" />
                            <Dumbbell size={12} /> Split: <strong>{trainingPrefs.preferredSplit}</strong>
                        </span>
                    </div>

                    <div className="greeting-section">
                        <h1>
                            System <span>Settings</span>
                        </h1>
                        <p>
                            Customize your training split, rest timers, daily nutrition &amp; activity goals, alerts, and account security.
                        </p>
                    </div>

                    <div className="quick-actions-row">
                        <button
                            type="button"
                            className={`quick-action-chip ${activeTab === "goals" ? "primary" : ""}`}
                            onClick={() => setActiveTab("goals")}
                        >
                            <Target size={14} /> Edit Goals
                        </button>
                        <button
                            type="button"
                            className={`quick-action-chip ${activeTab === "experience" ? "primary" : ""}`}
                            onClick={() => setActiveTab("experience")}
                        >
                            <Sliders size={13} /> Training Setup
                        </button>
                        <Link to="/profile" className="quick-action-chip">
                            Profile <ArrowUpRight size={13} />
                        </Link>
                        <Link to="/support" className="quick-action-chip">
                            Support <ArrowUpRight size={13} />
                        </Link>
                    </div>
                </div>

                {/* Top 4 KPI Tiles */}
                <div className="top-stats-row">
                    <div className="mini-stat">
                        <div className="mini-icon-box blue">
                            <Droplets size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={goals.waterGoal} suffix=" ml" />
                            </strong>
                            <span>Water Goal</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box purple">
                            <Moon size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={goals.sleepGoal} decimals={1} suffix="h" />
                            </strong>
                            <span>Sleep Goal</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box green">
                            <Footprints size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={goals.stepGoal} />
                            </strong>
                            <span>Step Goal</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box red">
                            <Timer size={20} />
                        </div>
                        <div>
                            <strong>{trainingPrefs.defaultRestSec}s Rest</strong>
                            <span>{unitSystem === "metric" ? "Metric" : "Imperial"} Units</span>
                        </div>
                    </div>
                </div>
            </section>

            {statusMsg && (
                <div className={isStatusError ? "bento-error-banner" : "bento-success-banner"}>
                    {isStatusError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    <span>{statusMsg}</span>
                </div>
            )}

            {/* ===== 12-COLUMN BENTO GRID ===== */}
            <div className="bento-grid">
                {/* LEFT NAVIGATION CARD (4 cols) */}
                <div className="bento-item col-span-4">
                    <div className="bento-header">
                        <h3>
                            <Sparkles size={17} color="var(--accent-primary, #ef4444)" /> Preferences
                        </h3>
                        <span className="pct-badge red">Obsidian Pro</span>
                    </div>

                    <div className="settings-bento-nav">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`settings-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* RIGHT ACTIVE PANEL (8 cols) */}
                <div className="bento-item col-span-8 settings-content">
                    {/* Training & Units */}
                    {activeTab === "experience" && (
                        <div className="tab-pane">
                            <div className="bento-header" style={{ marginBottom: 4 }}>
                                <h3>
                                    <Sliders size={17} color="var(--accent-primary, #ef4444)" /> Training Defaults &amp; Units
                                </h3>
                                <span className="pct-badge green">Obsidian Dark</span>
                            </div>
                            <p className="subtitle-text" style={{ marginBottom: 12 }}>
                                Configure your workout split, default rest countdown, measurement units, and motion settings.
                            </p>

                            <div>
                                <label className="sleep-field-label">Measurement Units</label>
                                <div className="unit-toggle-group">
                                    <button
                                        type="button"
                                        className={`unit-pill-btn ${unitSystem === "metric" ? "active" : ""}`}
                                        onClick={() => changeUnits("metric")}
                                    >
                                        Metric (ml, kg, km)
                                    </button>
                                    <button
                                        type="button"
                                        className={`unit-pill-btn ${unitSystem === "imperial" ? "active" : ""}`}
                                        onClick={() => changeUnits("imperial")}
                                    >
                                        Imperial (oz, lbs, mi)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="sleep-field-label">Preferred Training Split</label>
                                <div className="feedback-type-pills" style={{ marginBottom: 0 }}>
                                    {TRAINING_SPLITS.map((split) => (
                                        <button
                                            key={split}
                                            type="button"
                                            className={`quality-pill-btn ${
                                                trainingPrefs.preferredSplit === split ? "active" : ""
                                            }`}
                                            style={{ padding: "9px 14px" }}
                                            onClick={() =>
                                                setTrainingPrefs({
                                                    ...trainingPrefs,
                                                    preferredSplit: split,
                                                })
                                            }
                                        >
                                            {split}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div>
                                    <label className="sleep-field-label">Default Rest Timer</label>
                                    <div className="feedback-type-pills" style={{ marginBottom: 0 }}>
                                        {REST_PRESETS.map((sec) => (
                                            <button
                                                key={sec}
                                                type="button"
                                                className={`quality-pill-btn ${
                                                    trainingPrefs.defaultRestSec === sec ? "active" : ""
                                                }`}
                                                style={{ padding: "8px 12px" }}
                                                onClick={() =>
                                                    setTrainingPrefs({
                                                        ...trainingPrefs,
                                                        defaultRestSec: sec,
                                                    })
                                                }
                                            >
                                                {sec}s
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="sleep-field-label">Default Session Length</label>
                                    <div className="feedback-type-pills" style={{ marginBottom: 0 }}>
                                        {SESSION_LENGTHS.map((mins) => (
                                            <button
                                                key={mins}
                                                type="button"
                                                className={`quality-pill-btn ${
                                                    trainingPrefs.defaultSessionMins === mins ? "active" : ""
                                                }`}
                                                style={{ padding: "8px 12px" }}
                                                onClick={() =>
                                                    setTrainingPrefs({
                                                        ...trainingPrefs,
                                                        defaultSessionMins: mins,
                                                    })
                                                }
                                            >
                                                {mins}m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="settings-group">
                                <div className="setting-item">
                                    <div>
                                        <strong>Timer Chime &amp; Sound Alerts</strong>
                                        <span>Play a subtle audio cue when rest timers finish.</span>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={trainingPrefs.soundEffects}
                                            onChange={(e) =>
                                                setTrainingPrefs({
                                                    ...trainingPrefs,
                                                    soundEffects: e.target.checked,
                                                })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="setting-item">
                                    <div>
                                        <strong>Reduced Motion</strong>
                                        <span>Minimize UI animations for faster, distraction-free tracking.</span>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={trainingPrefs.reducedMotion}
                                            onChange={(e) =>
                                                setTrainingPrefs({
                                                    ...trainingPrefs,
                                                    reducedMotion: e.target.checked,
                                                })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={saveTrainingExperience}
                                className="vf-bento-submit"
                                disabled={savingExperience}
                            >
                                {savingExperience ? (
                                    <Loader2 size={18} className="spin" />
                                ) : (
                                    <>
                                        <Save size={18} /> Save Training Preferences
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Goals */}
                    {activeTab === "goals" && (
                        <div className="tab-pane">
                            <div className="bento-header" style={{ marginBottom: 4 }}>
                                <h3>
                                    <Target size={17} color="var(--accent-primary, #ef4444)" /> Daily Goals
                                </h3>
                                <span className="pct-badge red">Telemetry Targets</span>
                            </div>
                            <p className="subtitle-text" style={{ marginBottom: 10 }}>
                                Set personalized targets for hydration, sleep, steps, calories, and protein.
                            </p>

                            <div className="goal-presets-row">
                                <span>Quick presets:</span>
                                {GOAL_PRESETS.map((p) => (
                                    <button
                                        key={p.label}
                                        type="button"
                                        className="goal-preset-pill"
                                        onClick={() =>
                                            setGoals({
                                                waterGoal: p.waterGoal,
                                                sleepGoal: p.sleepGoal,
                                                stepGoal: p.stepGoal,
                                                calorieGoal: p.calorieGoal,
                                                proteinGoal: p.proteinGoal,
                                            })
                                        }
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            <div className="settings-group">
                                <div className="goal-input-row">
                                    <div className="goal-input-icon blue"><Droplets size={20} /></div>
                                    <div className="goal-input-content">
                                        <label>Water Goal (ml)</label>
                                        <input
                                            type="number"
                                            min="500"
                                            max="10000"
                                            step="100"
                                            value={goals.waterGoal}
                                            onChange={(e) =>
                                                setGoals({ ...goals, waterGoal: Number(e.target.value) })
                                            }
                                            className="premium-input"
                                        />
                                    </div>
                                </div>
                                <div className="goal-input-row">
                                    <div className="goal-input-icon purple"><Moon size={20} /></div>
                                    <div className="goal-input-content">
                                        <label>Sleep Goal (hours)</label>
                                        <input
                                            type="number"
                                            min="4"
                                            max="12"
                                            step="0.5"
                                            value={goals.sleepGoal}
                                            onChange={(e) =>
                                                setGoals({ ...goals, sleepGoal: Number(e.target.value) })
                                            }
                                            className="premium-input"
                                        />
                                    </div>
                                </div>
                                <div className="goal-input-row">
                                    <div className="goal-input-icon green"><Footprints size={20} /></div>
                                    <div className="goal-input-content">
                                        <label>Step Goal</label>
                                        <input
                                            type="number"
                                            min="1000"
                                            max="50000"
                                            step="500"
                                            value={goals.stepGoal}
                                            onChange={(e) =>
                                                setGoals({ ...goals, stepGoal: Number(e.target.value) })
                                            }
                                            className="premium-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="goal-input-row">
                                        <div
                                            className="goal-input-icon"
                                            style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}
                                        >
                                            <Flame size={20} />
                                        </div>
                                        <div className="goal-input-content">
                                            <label>Daily Calorie Target (kcal)</label>
                                            <input
                                                type="number"
                                                min="1000"
                                                max="6000"
                                                step="50"
                                                value={goals.calorieGoal}
                                                onChange={(e) =>
                                                    setGoals({ ...goals, calorieGoal: Number(e.target.value) })
                                                }
                                                className="premium-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="goal-input-row">
                                        <div
                                            className="goal-input-icon"
                                            style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}
                                        >
                                            <Zap size={20} />
                                        </div>
                                        <div className="goal-input-content">
                                            <label>Daily Protein Target (g)</label>
                                            <input
                                                type="number"
                                                min="40"
                                                max="400"
                                                step="5"
                                                value={goals.proteinGoal}
                                                onChange={(e) =>
                                                    setGoals({ ...goals, proteinGoal: Number(e.target.value) })
                                                }
                                                className="premium-input"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={saveGoals}
                                className="vf-bento-submit"
                                disabled={savingGoals}
                                style={{ marginTop: 8 }}
                            >
                                {savingGoals ? (
                                    <Loader2 size={18} className="spin" />
                                ) : (
                                    <>
                                        <Save size={18} /> Save Goals
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeTab === "notifications" && (
                        <div className="tab-pane">
                            <div className="bento-header" style={{ marginBottom: 4 }}>
                                <h3>
                                    <Bell size={17} color="var(--accent-primary, #ef4444)" /> Notification Preferences
                                </h3>
                            </div>
                            <p className="subtitle-text" style={{ marginBottom: 12 }}>
                                Manage workout alerts, streak protection, hydration nudges, and progress summaries.
                            </p>

                            <div className="settings-group">
                                <div className="setting-item">
                                    <div>
                                        <strong>Email Alerts</strong>
                                        <span>Receive workout reminders and milestone notifications.</span>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={prefs.notifications}
                                            onChange={(e) =>
                                                setPrefs({ ...prefs, notifications: e.target.checked })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="setting-item">
                                    <div>
                                        <strong>Streak Protection Alert</strong>
                                        <span>Evening reminder if you haven&apos;t logged a workout yet today.</span>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={prefs.streakReminder}
                                            onChange={(e) =>
                                                setPrefs({ ...prefs, streakReminder: e.target.checked })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="setting-item">
                                    <div>
                                        <strong>Hydration Nudges</strong>
                                        <span>Gentle reminders to hit your daily water goal.</span>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={prefs.hydrationReminders}
                                            onChange={(e) =>
                                                setPrefs({ ...prefs, hydrationReminders: e.target.checked })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="setting-item">
                                    <div>
                                        <strong>Weekly Progress Digest</strong>
                                        <span>Summary of calories burned, steps, and sleep consistency.</span>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={prefs.weeklySummary}
                                            onChange={(e) =>
                                                setPrefs({ ...prefs, weeklySummary: e.target.checked })
                                            }
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={saveNotifications}
                                className="vf-bento-submit"
                                disabled={savingPrefs}
                                style={{ marginTop: 8 }}
                            >
                                {savingPrefs ? (
                                    <Loader2 size={18} className="spin" />
                                ) : (
                                    <>
                                        <Save size={18} /> Save Preferences
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Feedback */}
                    {activeTab === "feedback" && (
                        <div className="tab-pane">
                            <div className="bento-header" style={{ marginBottom: 4 }}>
                                <h3>
                                    <MessageSquare size={17} color="var(--accent-primary, #ef4444)" /> Send Feedback
                                </h3>
                            </div>
                            <p className="subtitle-text" style={{ marginBottom: 12 }}>
                                Share ideas, report bugs, or request new VitalFit features.
                            </p>

                            <form onSubmit={submitFeedback}>
                                <label className="sleep-field-label">Category</label>
                                <div className="feedback-type-pills">
                                    {FEEDBACK_TYPES.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            className={`quality-pill-btn ${form.type === t ? "active" : ""}`}
                                            style={{ padding: "8px 14px" }}
                                            onClick={() => setForm({ ...form, type: t })}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ marginBottom: 14 }}>
                                    <label className="sleep-field-label">Message</label>
                                    <textarea
                                        rows="5"
                                        maxLength={500}
                                        required
                                        placeholder="Tell us what's on your mind..."
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        className="premium-input"
                                        style={{ cursor: "text", resize: "vertical" }}
                                    />
                                    <div className="char-counter-row">
                                        <span>Be as specific as possible</span>
                                        <span>{form.message.length} / 500</span>
                                    </div>
                                </div>

                                <button
                                    className="vf-bento-submit"
                                    type="submit"
                                    disabled={submitting || !form.message.trim()}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="spin" /> Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} /> Submit Feedback
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Security & Data */}
                    {activeTab === "security" && (
                        <div className="tab-pane">
                            <div className="bento-header" style={{ marginBottom: 4 }}>
                                <h3>
                                    <Shield size={17} color="var(--accent-primary, #ef4444)" /> Account Security &amp; Data
                                </h3>
                            </div>
                            <p className="subtitle-text" style={{ marginBottom: 12 }}>
                                Manage your password, download your fitness backup, clear cached data, or revoke sessions.
                            </p>

                            <div className="settings-group">
                                <div className="setting-item">
                                    <div>
                                        <strong>Password</strong>
                                        <span>Change your current login password.</span>
                                    </div>
                                    <Link to="/change-password" className="settings-bento-btn-ghost">
                                        Update <ArrowUpRight size={14} />
                                    </Link>
                                </div>

                                <div className="setting-item">
                                    <div>
                                        <strong>Export Full Fitness Backup</strong>
                                        <span>Download your workout logs, daily summary, goals, and settings as JSON.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={exportMyData}
                                        disabled={exporting}
                                        className="settings-bento-btn-ghost"
                                    >
                                        {exporting ? (
                                            <Loader2 size={14} className="spin" />
                                        ) : (
                                            <Download size={14} />
                                        )}{" "}
                                        Export JSON
                                    </button>
                                </div>

                                <div className="setting-item">
                                    <div>
                                        <strong>Clear Local UI Cache</strong>
                                        <span>Clear cached AI chat history without signing out.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearLocalCache}
                                        className="settings-bento-btn-ghost"
                                    >
                                        <Trash2 size={14} /> Clear Cache
                                    </button>
                                </div>

                                <div className="setting-item danger-zone">
                                    <div>
                                        <strong className="text-danger">Danger Zone</strong>
                                        <span>End all active sessions across every device immediately.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={logoutAll}
                                        className="water-reset-btn"
                                    >
                                        <LogOut size={14} /> Logout All
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}