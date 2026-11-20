import { useEffect, useState } from "react";
import {
    Trash2,
    Dumbbell,
    Flame,
    Clock,
    Calendar,
    Loader2,
    History,
    Inbox,
    Search,
    Plus,
    Zap,
    FileText,
} from "lucide-react";
import API from "../../services/api";
import { Link } from "react-router-dom";

// Fallback images (if database doesn't have a snapshot)
const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=240&q=80",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=240&q=80",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=240&q=80",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=240&q=80",
];

export default function MyWorkouts() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [failedImages, setFailedImages] = useState({});

    const load = async () => {
        try {
            setLoading(true);
            const res = await API.get("/api/workout-logs/my-history");
            setLogs(res.data.logs || []);
        } catch (error) {
            console.error("Failed to load workouts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const del = async (id) => {
        if (!window.confirm("Are you sure you want to delete this workout log?")) return;
        try {
            await API.delete(`/api/workout-logs/${id}`);
            setLogs((prev) => prev.filter((log) => log._id !== id));
        } catch (error) {
            alert("Failed to delete log");
        }
    };

    // Summary Logic
    const totalWorkouts = logs.length;
    const totalCalories = logs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
    const totalMinutes = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const avgBurn = totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0;

    const filteredLogs = logs.filter((log) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const title = (log.workoutTitleSnapshot || log.title || "").toLowerCase();
        const notes = (log.notes || "").toLowerCase();
        return title.includes(q) || notes.includes(q);
    });

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary, #ef4444)" }} />
            </div>
        );
    }

    return (
        <div className="workouts-wrapper">
            {/* 1. Command Header */}
            <div className="page-header-clean header-flex-between">
                <div>
                    <div className="eyebrow-pill">
                        <span className="pulse-dot" />
                        <span>HISTORY &amp; TELEMETRY LOGS</span>
                    </div>
                    <h1>
                        My <span>Workouts</span>
                    </h1>
                    <p>Review your completed sessions, burned calories, and training consistency.</p>
                </div>

                <Link to="/workouts" className="primary-btn">
                    <Plus size={17} /> Start New Workout
                </Link>
            </div>

            {/* 2. Summary KPI Cards */}
            {logs.length > 0 && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="icon-box red">
                            <Dumbbell size={22} />
                        </div>
                        <div>
                            <p>Total Workouts</p>
                            <h3>
                                {totalWorkouts} <small>sessions</small>
                            </h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="icon-box orange">
                            <Flame size={22} />
                        </div>
                        <div>
                            <p>Calories Burned</p>
                            <h3>
                                {totalCalories.toLocaleString()} <small>kcal</small>
                            </h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="icon-box blue">
                            <Clock size={22} />
                        </div>
                        <div>
                            <p>Time Invested</p>
                            <h3>
                                {totalMinutes} <small>min</small>
                            </h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="icon-box green">
                            <Zap size={22} />
                        </div>
                        <div>
                            <p>Avg Burn / Session</p>
                            <h3>
                                {avgBurn} <small>kcal</small>
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. History List */}
            <div className="panel">
                <div className="panel-top-row">
                    <h3 className="section-title flex-title">
                        <History size={18} color="var(--accent-primary, #ef4444)" /> Past Sessions
                        <span className="count-pill">{filteredLogs.length}</span>
                    </h3>

                    {logs.length > 0 && (
                        <div className="search-input-box">
                            <Search size={15} className="search-icon" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search workouts or notes..."
                            />
                        </div>
                    )}
                </div>

                <div className="workout-history-list">
                    {logs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon-ring">
                                <Inbox size={38} className="empty-icon" />
                            </div>
                            <h3>No workouts logged yet</h3>
                            <p>Pick a guided workout session to start building your streak.</p>
                            <Link to="/workouts" className="primary-btn" style={{ marginTop: 16 }}>
                                Browse Workouts
                            </Link>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="empty-state">
                            <Search size={36} className="empty-icon" />
                            <h3>No matching workouts</h3>
                            <p>Try a different keyword or clear your search filter.</p>
                        </div>
                    ) : (
                        filteredLogs.map((log, idx) => {
                            const imageUrl =
                                log.workoutImageSnapshot ||
                                log.workoutId?.image ||
                                FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
                            const dateObj = log.completedAt ? new Date(log.completedAt) : new Date();
                            const formattedDate = dateObj.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            });

                            return (
                                <div key={log._id} className="workout-log-item">
                                    {/* Left Side: Thumbnail & Details */}
                                    <div className="log-info-wrapper">
                                        <div className="workout-thumb-box">
                                            {failedImages[log._id] ? (
                                                <Dumbbell
                                                    size={24}
                                                    style={{ color: "var(--accent-primary, #ef4444)", opacity: 0.7 }}
                                                />
                                            ) : (
                                                <img
                                                    src={imageUrl}
                                                    alt={log.workoutTitleSnapshot || "Workout"}
                                                    onError={() =>
                                                        setFailedImages((prev) => ({
                                                            ...prev,
                                                            [log._id]: true,
                                                        }))
                                                    }
                                                />
                                            )}
                                        </div>

                                        <div className="log-details">
                                            <strong className="log-title">
                                                {log.workoutTitleSnapshot || "Unknown Workout"}
                                            </strong>

                                            <div className="log-meta">
                                                <span className="meta-tag">
                                                    <Calendar size={13} /> {formattedDate}
                                                </span>
                                                <span className="meta-tag">
                                                    <Clock size={13} /> {log.duration || 0} min
                                                </span>
                                                <span className="meta-tag cal-highlight">
                                                    <Flame size={13} /> ~{log.caloriesBurned || 0} kcal
                                                </span>
                                            </div>

                                            {log.notes && (
                                                <p className="log-note-preview">
                                                    <FileText size={12} /> {log.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side: Actions */}
                                    <div className="log-actions">
                                        <button
                                            type="button"
                                            className="icon-btn danger"
                                            onClick={() => del(log._id)}
                                            title="Delete Log"
                                            aria-label="Delete workout log"
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}