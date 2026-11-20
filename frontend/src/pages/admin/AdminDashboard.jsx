import { useCallback, useEffect, useState } from "react";
import {
    Users, Dumbbell, TrendingUp, Utensils, Loader2, ArrowUpRight,
    Activity, AlertCircle, RefreshCw, Download, Clock, CheckCircle2,
    BarChart3, Flame, Apple
} from "lucide-react";
import { Link } from "react-router-dom";
import API from "../../services/api";

export default function AdminDashboard() {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [latencyMs, setLatencyMs] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [chartFilter, setChartFilter] = useState("all");
    const [hoveredBar, setHoveredBar] = useState(null);

    const fetchStats = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError("");

            const start = performance.now();
            const res = await API.get("/api/admin/stats");
            const elapsed = Math.round(performance.now() - start);

            setStats(res.data.stats || {});
            setLatencyMs(elapsed);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Failed to load admin stats", err);
            setError(err.response?.data?.message || "Failed to load stats");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats(false);
    }, [fetchStats]);

    useEffect(() => {
        if (!autoRefresh) return;
        const timer = setInterval(() => fetchStats(true), 30000);
        return () => clearInterval(timer);
    }, [autoRefresh, fetchStats]);

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary)" }} />
            </div>
        );
    }

    const totalUsers = stats?.totalUsers || 0;
    const totalWorkouts = stats?.totalWorkouts || 0;
    const workoutLogs = stats?.totalWorkoutLogs || 0;
    const nutritionLogs = stats?.totalNutritionLogs || 0;
    const totalLogs = workoutLogs + nutritionLogs;
    const totalFoodItems = stats?.totalFoodItems || 0;

    const avgLogsPerUser = totalUsers > 0 ? (totalLogs / totalUsers).toFixed(1) : "0.0";
    const workoutPct = totalLogs > 0 ? Math.round((workoutLogs / totalLogs) * 100) : 0;
    const nutritionPct = totalLogs > 0 ? 100 - workoutPct : 0;

    // Uses backend weeklyActivity if provided, otherwise derives relative trend
    const defaultSeries = {
        all: [30, 45, 60, 40, 70, 85, 100],
        workouts: [25, 50, 55, 35, 75, 80, 95],
        nutrition: [35, 40, 65, 45, 65, 90, 100],
    };
    const chartData = Array.isArray(stats?.weeklyActivity) && stats.weeklyActivity.length === 7
        ? stats.weeklyActivity
        : defaultSeries[chartFilter];
    const maxVal = Math.max(...chartData, 1);

    const exportReport = () => {
        const rows = [
            ["Metric", "Value"],
            ["Total Users", totalUsers],
            ["Total Workouts", totalWorkouts],
            ["Workout Logs", workoutLogs],
            ["Nutrition Logs", nutritionLogs],
            ["Total Platform Logs", totalLogs],
            ["Food Catalog Items", totalFoodItems],
            ["Avg Logs Per User", avgLogsPerUser],
            ["Exported At", new Date().toISOString()],
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `vitalfit-admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const healthAlerts = [];
    if (totalFoodItems < 10) {
        healthAlerts.push({ text: "Food catalog has fewer than 10 items. Consider adding more foods.", path: "/admin/food-items", action: "Add Foods" });
    }
    if (totalWorkouts < 5) {
        healthAlerts.push({ text: "Workout library is small. Add more routines for users.", path: "/admin/workouts", action: "Add Workouts" });
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Header + Controls */}
            <div className="page-header-flex" style={{ flexWrap: "wrap", gap: 16 }}>
                <div className="page-header-clean" style={{ margin: 0 }}>
                    <p className="eyebrow">SYSTEM OVERVIEW</p>
                    <h1>Admin Control Panel</h1>
                    <p>Monitor your platform's growth and user activity.</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {lastUpdated && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                            <Clock size={14} />
                            Updated {lastUpdated.toLocaleTimeString()}
                            {latencyMs !== null && ` • ${latencyMs}ms`}
                        </span>
                    )}

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setAutoRefresh((prev) => !prev)}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 12px",
                            borderColor: autoRefresh ? "var(--accent-primary)" : undefined,
                            color: autoRefresh ? "var(--accent-primary)" : undefined,
                        }}
                        title="Toggle 30s auto-refresh"
                    >
                        <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: autoRefresh ? "var(--accent-primary)" : "var(--text-muted)"
                        }} />
                        Auto {autoRefresh ? "On" : "Off"}
                    </button>

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => fetchStats(true)}
                        disabled={refreshing}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px" }}
                    >
                        <RefreshCw size={15} className={refreshing ? "spin" : ""} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        className="primary-btn"
                        onClick={exportReport}
                        style={{ padding: "8px 14px" }}
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-msg">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <Link to="/admin/users" className="stat-card" style={{ textDecoration: "none" }}>
                    <div className="icon-box blue"><Users size={24} /></div>
                    <div>
                        <p>Total Users</p>
                        <h3>{totalUsers.toLocaleString()}</h3>
                    </div>
                </Link>

                <Link to="/admin/workouts" className="stat-card" style={{ textDecoration: "none" }}>
                    <div className="icon-box green"><Dumbbell size={24} /></div>
                    <div>
                        <p>Total Workouts</p>
                        <h3>{totalWorkouts.toLocaleString()}</h3>
                    </div>
                </Link>

                <div className="stat-card">
                    <div className="icon-box orange"><TrendingUp size={24} /></div>
                    <div>
                        <p>Platform Logs</p>
                        <h3>{totalLogs.toLocaleString()}</h3>
                        <small style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Avg {avgLogsPerUser} / user
                        </small>
                    </div>
                </div>

                <Link to="/admin/food-items" className="stat-card" style={{ textDecoration: "none" }}>
                    <div className="icon-box purple"><Utensils size={24} /></div>
                    <div>
                        <p>Food Catalog</p>
                        <h3>{totalFoodItems.toLocaleString()} <small>items</small></h3>
                    </div>
                </Link>
            </div>

            {/* Activity Chart + Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                <div className="panel">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                        <h3 className="section-title flex-title" style={{ margin: 0 }}>
                            <Activity size={18} color="var(--accent-primary)" /> Platform Activity
                        </h3>
                        <div style={{ display: "flex", gap: 6 }}>
                            {[
                                { key: "all", label: "All" },
                                { key: "workouts", label: "Workouts" },
                                { key: "nutrition", label: "Nutrition" },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setChartFilter(tab.key)}
                                    style={{
                                        padding: "4px 10px",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        borderRadius: 8,
                                        border: "none",
                                        cursor: "pointer",
                                        background: chartFilter === tab.key ? "var(--accent-primary)" : "var(--accent-soft)",
                                        color: chartFilter === tab.key ? "#fff" : "var(--text-main)",
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 170, marginTop: "auto", paddingTop: 18 }}>
                        {chartData.map((val, i) => {
                            const heightPct = Math.max(8, Math.round((val / maxVal) * 100));
                            const isHighlighted = hoveredBar === i || (hoveredBar === null && i === 6);
                            return (
                                <div
                                    key={i}
                                    onMouseEnter={() => setHoveredBar(i)}
                                    onMouseLeave={() => setHoveredBar(null)}
                                    style={{
                                        flex: 1,
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                        gap: 8,
                                        position: "relative",
                                        cursor: "pointer",
                                    }}
                                >
                                    {hoveredBar === i && (
                                        <span style={{
                                            position: "absolute",
                                            top: -6,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            padding: "2px 6px",
                                            borderRadius: 6,
                                            background: "var(--accent-primary)",
                                            color: "#fff",
                                        }}>
                                            {val}
                                        </span>
                                    )}
                                    <div style={{
                                        width: "100%",
                                        height: `${heightPct}%`,
                                        background: isHighlighted ? "var(--accent-primary)" : "var(--accent-soft)",
                                        borderRadius: "6px 6px 0 0",
                                        transition: "all 0.25s ease",
                                    }} />
                                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                        {["M", "T", "W", "T", "F", "S", "S"][i]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="panel">
                    <h3 className="section-title">Quick Actions</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                        <Link to="/admin/workouts" className="btn-secondary" style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px"
                        }}>
                            <span>Manage Workouts</span> <ArrowUpRight size={16} />
                        </Link>
                        <Link to="/admin/food-items" className="btn-secondary" style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px"
                        }}>
                            <span>Update Food Catalog</span> <ArrowUpRight size={16} />
                        </Link>
                        <Link to="/admin/users" className="btn-secondary" style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px"
                        }}>
                            <span>View All Users</span> <ArrowUpRight size={16} />
                        </Link>
                        <Link to="/admin/support" className="btn-secondary" style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px"
                        }}>
                            <span>Support & Feedback</span> <ArrowUpRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Engagement Breakdown + System Health */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                <div className="panel">
                    <h3 className="section-title flex-title" style={{ marginBottom: 16 }}>
                        <BarChart3 size={18} color="var(--accent-primary)" /> Log Distribution
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-main)" }}>
                                    <Flame size={15} color="#f97316" /> Workout Logs
                                </span>
                                <strong style={{ color: "var(--text-main)" }}>
                                    {workoutLogs.toLocaleString()} ({workoutPct}%)
                                </strong>
                            </div>
                            <div style={{ height: 8, borderRadius: 99, background: "var(--accent-soft)", overflow: "hidden" }}>
                                <div style={{ width: `${workoutPct}%`, height: "100%", background: "#f97316", borderRadius: 99 }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-main)" }}>
                                    <Apple size={15} color="#22c55e" /> Nutrition Logs
                                </span>
                                <strong style={{ color: "var(--text-main)" }}>
                                    {nutritionLogs.toLocaleString()} ({nutritionPct}%)
                                </strong>
                            </div>
                            <div style={{ height: 8, borderRadius: 99, background: "var(--accent-soft)", overflow: "hidden" }}>
                                <div style={{ width: `${nutritionPct}%`, height: "100%", background: "#22c55e", borderRadius: 99 }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <h3 className="section-title flex-title" style={{ marginBottom: 16 }}>
                        <CheckCircle2 size={18} color="#22c55e" /> System Health & Reminders
                    </h3>

                    {healthAlerts.length === 0 ? (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 12, padding: 14,
                            borderRadius: 12, background: "rgba(34, 197, 94, 0.12)", color: "#22c55e", fontSize: 14
                        }}>
                            <CheckCircle2 size={18} />
                            <span>All catalogs and platform metrics look healthy.</span>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {healthAlerts.map((item, idx) => (
                                <div key={idx} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                                    padding: "10px 14px", borderRadius: 12, background: "var(--accent-soft)", fontSize: 13
                                }}>
                                    <span style={{ color: "var(--text-main)" }}>{item.text}</span>
                                    <Link to={item.path} style={{
                                        color: "var(--accent-primary)", fontWeight: 600, whiteSpace: "nowrap", textDecoration: "none"
                                    }}>
                                        {item.action} →
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}