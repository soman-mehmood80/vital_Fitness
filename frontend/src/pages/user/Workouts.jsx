import { useEffect, useState } from "react";
import { Trash2, Dumbbell, Flame, Clock, Calendar, Loader2, History, Inbox } from "lucide-react";
import API from "../../services/api";
import { Link } from "react-router-dom";

// Fallback images (agar database mein image na ho toh)
const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=150&q=80",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=150&q=80",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=150&q=80",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&q=80",
];

export default function MyWorkouts() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
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
            setLogs(logs.filter(log => log._id !== id));
        } catch (error) {
            alert("Failed to delete log");
        }
    };

    // Summary Logic
    const totalWorkouts = logs.length;
    const totalCalories = logs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
    const totalMinutes = logs.reduce((sum, log) => sum + (log.duration || 0), 0);

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary)" }} />
            </div>
        );
    }

    return (
        <div className="workouts-wrapper">
            
            {/* 1. Header */}
            <div className="page-header-clean">
                <p className="eyebrow">HISTORY & LOGS</p>
                <h1>My Workouts</h1>
                <p>Review your past sessions and track your fitness journey.</p>
            </div>

            {/* 2. Summary Cards */}
            {logs.length > 0 && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="icon-box red"><Dumbbell size={24} /></div>
                        <div>
                            <p>Total Workouts</p>
                            <h3>{totalWorkouts} <small>sessions</small></h3>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon-box orange"><Flame size={24} /></div>
                        <div>
                            <p>Calories Burned</p>
                            <h3>{totalCalories.toLocaleString()} <small>kcal</small></h3>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon-box blue"><Clock size={24} /></div>
                        <div>
                            <p>Time Invested</p>
                            <h3>{totalMinutes} <small>min</small></h3>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. History List */}
            <div className="panel">
                <h3 className="section-title flex-title">
                    <History size={18} color="var(--accent-primary)" /> Past Sessions
                </h3>

                <div className="workout-history-list">
                    {logs.length === 0 ? (
                        <div className="empty-state">
                            <Inbox size={48} className="empty-icon" />
                            <h3>No workouts logged yet</h3>
                            <p>Start your first workout to see your progress here.</p>
                            <Link to="/workouts" className="primary-btn" style={{ marginTop: 16 }}>
                                Browse Workouts
                            </Link>
                        </div>
                    ) : (
                        logs.map((log, idx) => {
                            const imageUrl = log.workoutImageSnapshot || log.workoutId?.image || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
                            const dateObj = log.completedAt ? new Date(log.completedAt) : new Date();
                            const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                            return (
                                <div key={log._id} className="workout-log-item">
                                    
                                    {/* Left Side: Image & Details */}
                                    <div className="log-info-wrapper">
                                        
                                        {/* Image Thumbnail */}
                                        <div className="workout-thumb-box">
                                            {failedImages[log._id] ? (
                                                <Dumbbell size={24} style={{ color: "var(--accent-primary)", opacity: 0.5 }} />
                                            ) : (
                                                <img 
                                                    src={imageUrl} 
                                                    alt="Workout" 
                                                    onError={() => setFailedImages(prev => ({ ...prev, [log._id]: true }))}
                                                />
                                            )}
                                        </div>
                                        
                                        <div className="log-details">
                                            <strong className="log-title">
                                                {log.workoutTitleSnapshot || "Unknown Workout"}
                                            </strong>
                                            
                                            <div className="log-meta">
                                                <span className="meta-tag"><Calendar size={14} /> {formattedDate}</span>
                                                <span className="meta-tag"><Clock size={14} /> {log.duration || 0} min</span>
                                                <span className="meta-tag text-orange"><Flame size={14} /> ~{log.caloriesBurned || 0} kcal</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Actions */}
                                    <div className="log-actions">
                                        <button className="icon-btn danger" onClick={() => del(log._id)} title="Delete Log">
                                            <Trash2 size={18} />
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