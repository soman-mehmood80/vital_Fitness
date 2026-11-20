import { useCallback, useEffect, useState } from "react";
import {
    Plus,
    Trash2,
    TrendingDown,
    TrendingUp,
    Scale,
    Loader2,
    X,
    Activity,
    Download,
    LineChart as ChartIcon,
    AlertCircle,
    Ruler,
    Sparkles,
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

const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
};

const TIMEFRAME_OPTIONS = [
    { label: "7D", days: 7 },
    { label: "30D", days: 30 },
    { label: "90D", days: 90 },
    { label: "1Y", days: 365 },
];

export default function Progress() {
    const [data, setData] = useState(null);
    const [daysRange, setDaysRange] = useState(30);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({
        weight: "",
        bodyFat: "",
        chest: "",
        waist: "",
        hips: "",
        arms: "",
        thighs: "",
    });

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const res = await API.get("/api/progress", {
                params: { days: daysRange },
            });
            setData(res.data);
        } catch (err) {
            console.error("Failed to load progress", err);
            setError("Failed to load progress data");
        } finally {
            setLoading(false);
        }
    }, [daysRange]);

    useEffect(() => {
        load();
    }, [load]);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const payload = {
                weight: Number(form.weight),
                date: getLocalDate(),
            };
            if (form.bodyFat) payload.bodyFat = Number(form.bodyFat);

            const measurements = {};
            ["chest", "waist", "hips", "arms", "thighs"].forEach((k) => {
                if (form[k]) measurements[k] = Number(form[k]);
            });
            if (Object.keys(measurements).length > 0) payload.measurements = measurements;

            await API.post("/api/progress", payload);
            setModal(false);
            setForm({
                weight: "",
                bodyFat: "",
                chest: "",
                waist: "",
                hips: "",
                arms: "",
                thighs: "",
            });
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save progress");
        } finally {
            setSaving(false);
        }
    };

    const del = async (id) => {
        if (!window.confirm("Delete this entry?")) return;
        try {
            await API.delete(`/api/progress/${id}`);
            load();
        } catch (err) {
            setError("Failed to delete entry");
        }
    };

    const exportToCSV = () => {
        if (!data?.history || data.history.length === 0) {
            setError("No data to export");
            return;
        }

        const headers = [
            "Date",
            "Weight (kg)",
            "Body Fat (%)",
            "Chest",
            "Waist",
            "Hips",
            "Arms",
            "Thighs",
        ];
        const rows = data.history.map((h) => [
            new Date(h.date).toLocaleDateString(),
            h.weight,
            h.bodyFat || "",
            h.measurements?.chest || "",
            h.measurements?.waist || "",
            h.measurements?.hips || "",
            h.measurements?.arms || "",
            h.measurements?.thighs || "",
        ]);

        let csvContent = headers.join(",") + "\n";
        rows.forEach((row) => {
            csvContent += row.join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `VitalFit_Progress_${getLocalDate()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2
                    size={40}
                    className="spin"
                    style={{ color: "var(--accent-primary, #ef4444)" }}
                />
            </div>
        );
    }

    const currentWeight = data?.stats?.currentWeight || "--";
    const bmiVal = Number(data?.stats?.bmi);
    const bmi = data?.stats?.bmi || "--";
    const change = data?.stats?.change || 0;
    const isPositiveChange = change > 0;
    const chartData = data?.chartData || [];
    const latestEntry = data?.history?.[0] || null;
    const latestMeasures = latestEntry?.measurements || {};

    const getBmiInfo = (val) => {
        if (!val || Number.isNaN(val)) return { label: "Add height in Profile", cls: "neutral" };
        if (val < 18.5) return { label: "Underweight", cls: "blue" };
        if (val < 25) return { label: "Optimal Range", cls: "green" };
        if (val < 30) return { label: "Overweight", cls: "orange" };
        return { label: "Obese Range", cls: "red" };
    };
    const bmiInfo = getBmiInfo(bmiVal);

    return (
        <div className="progress-wrapper">
            {/* Header */}
            <div className="page-header-clean page-header-flex">
                <div>
                    <div className="eyebrow-pill">
                        <span className="pulse-dot" />
                        <span>BODY METRICS &amp; TELEMETRY</span>
                    </div>
                    <h1>
                        Your <span>Progress</span>
                    </h1>
                    <p>Track body weight, BMI readiness, and tape measurements over time.</p>
                </div>

                <div className="progress-header-actions">
                    <button type="button" className="btn-secondary" onClick={exportToCSV}>
                        <Download size={17} /> Export CSV
                    </button>
                    <button type="button" className="primary-btn" onClick={() => setModal(true)}>
                        <Plus size={17} /> Log New Entry
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-msg">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="icon-box blue">
                        <Scale size={24} />
                    </div>
                    <div>
                        <p>Current Weight</p>
                        <h3>
                            {currentWeight} <small>kg</small>
                        </h3>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="icon-box green">
                        <Activity size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p>Body Mass Index (BMI)</p>
                        <div className="bmi-inline-row">
                            <h3>{bmi}</h3>
                            <span className={`bmi-badge ${bmiInfo.cls}`}>{bmiInfo.label}</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className={`icon-box ${isPositiveChange ? "red" : "green"}`}>
                        {isPositiveChange ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div>
                        <p>{daysRange}-Day Change</p>
                        <h3 className={isPositiveChange ? "text-danger" : "text-success"}>
                            {isPositiveChange ? "+" : ""}
                            {change} <small>kg</small>
                        </h3>
                    </div>
                </div>
            </div>

            {/* Weight Trend Chart */}
            <div className="panel">
                <div className="panel-top-row">
                    <h3 className="section-title flex-title">
                        <ChartIcon size={19} color="var(--accent-primary, #ef4444)" /> Weight Trend
                    </h3>

                    <div className="timeframe-pills" role="tablist" aria-label="Timeframe filter">
                        {TIMEFRAME_OPTIONS.map((opt) => (
                            <button
                                key={opt.days}
                                type="button"
                                role="tab"
                                aria-selected={daysRange === opt.days}
                                className={`timeframe-btn ${daysRange === opt.days ? "active" : ""}`}
                                onClick={() => setDaysRange(opt.days)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {chartData.length > 0 ? (
                    <div className="progress-chart-wrap">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{ top: 10, right: 16, left: -18, bottom: 5 }}
                            >
                                <defs>
                                    <linearGradient id="progressWeightGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.42} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(255,255,255,0.06)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(val) =>
                                        new Date(val).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                        })
                                    }
                                    stroke="var(--text-muted, #a1a1aa)"
                                    tick={{ fill: "var(--text-muted, #a1a1aa)", fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    domain={["dataMin - 2", "dataMax + 2"]}
                                    stroke="var(--text-muted, #a1a1aa)"
                                    tick={{ fill: "var(--text-muted, #a1a1aa)", fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "var(--bg-elevated, #18181c)",
                                        border: "1px solid rgba(239, 68, 68, 0.35)",
                                        borderRadius: "12px",
                                        color: "var(--text-main, #fafafa)",
                                        boxShadow: "0 14px 35px rgba(0,0,0,0.45)",
                                    }}
                                    labelFormatter={(val) =>
                                        new Date(val).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                    }
                                    formatter={(value) => [`${value} kg`, "Weight"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#progressWeightGrad)"
                                    dot={{
                                        r: 4,
                                        fill: "var(--bg-surface, #111114)",
                                        strokeWidth: 2,
                                        stroke: "#ef4444",
                                    }}
                                    activeDot={{
                                        r: 6,
                                        fill: "#ef4444",
                                        stroke: "#fff",
                                        strokeWidth: 2,
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="empty-state" style={{ padding: "32px 16px" }}>
                        <ChartIcon size={36} className="empty-icon" style={{ marginBottom: 10 }} />
                        <h3>Not enough chart data</h3>
                        <p>Log at least 2 entries within this range to plot your curve.</p>
                    </div>
                )}
            </div>

            {/* Latest Body Measurements Strip */}
            <div className="panel">
                <div className="panel-top-row" style={{ marginBottom: 14 }}>
                    <h3 className="section-title flex-title">
                        <Ruler size={18} color="#a855f7" /> Latest Measurements
                    </h3>
                    {latestEntry?.bodyFat && (
                        <span className="purple-badge">
                            <Sparkles size={13} /> Body Fat: {latestEntry.bodyFat}%
                        </span>
                    )}
                </div>

                <div className="measurements-grid">
                    {[
                        { key: "chest", label: "Chest" },
                        { key: "waist", label: "Waist" },
                        { key: "hips", label: "Hips" },
                        { key: "arms", label: "Arms" },
                        { key: "thighs", label: "Thighs" },
                    ].map((m) => (
                        <div key={m.key} className="measurement-tile">
                            <span>{m.label}</span>
                            <strong>
                                {latestMeasures[m.key] ? (
                                    <>
                                        {latestMeasures[m.key]} <small>cm</small>
                                    </>
                                ) : (
                                    "--"
                                )}
                            </strong>
                        </div>
                    ))}
                </div>
            </div>

            {/* History List */}
            <div className="panel">
                <div className="panel-top-row">
                    <h3 className="section-title flex-title">
                        <Scale size={18} color="var(--accent-primary, #ef4444)" /> Recent Entries
                        <span className="count-pill">{data?.history?.length || 0}</span>
                    </h3>
                </div>

                <div className="history-list">
                    {!data?.history || data.history.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon-ring">
                                <Scale size={36} className="empty-icon" />
                            </div>
                            <h3>No progress logged yet</h3>
                            <p>Click &quot;Log New Entry&quot; to start tracking your body metrics.</p>
                        </div>
                    ) : (
                        data.history.map((h) => (
                            <div key={h._id} className="progress-history-item">
                                <div className="progress-info">
                                    <div className="progress-icon-box">
                                        <Scale size={20} />
                                    </div>
                                    <div>
                                        <strong className="progress-weight">{h.weight} kg</strong>
                                        <div className="progress-meta">
                                            <span>
                                                {new Date(h.date).toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </span>
                                            {h.bodyFat && (
                                                <span className="progress-chip purple">{h.bodyFat}% fat</span>
                                            )}
                                            {h.measurements?.waist && (
                                                <span className="progress-chip">
                                                    Waist: {h.measurements.waist}cm
                                                </span>
                                            )}
                                            {h.measurements?.chest && (
                                                <span className="progress-chip">
                                                    Chest: {h.measurements.chest}cm
                                                </span>
                                            )}
                                            {h.measurements?.arms && (
                                                <span className="progress-chip">
                                                    Arms: {h.measurements.arms}cm
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="icon-btn danger"
                                    onClick={() => del(h._id)}
                                    title="Delete"
                                    aria-label="Delete entry"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Log Entry Modal */}
            {modal && (
                <div className="modal-overlay" onClick={() => setModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="modal-close-btn"
                            onClick={() => setModal(false)}
                            aria-label="Close modal"
                        >
                            <X size={19} />
                        </button>

                        <div className="eyebrow-pill" style={{ marginBottom: 10 }}>
                            <span className="pulse-dot" />
                            <span>NEW CHECK-IN</span>
                        </div>
                        <h2 className="modal-title">Log Progress</h2>
                        <p className="modal-subtitle">
                            Record your current body weight and optional measurements.
                        </p>

                        <form onSubmit={save}>
                            <div className="form-grid-2">
                                <div className="input-group">
                                    <label>Weight (kg) *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        placeholder="e.g. 75.5"
                                        value={form.weight}
                                        onChange={(e) => setForm({ ...form, weight: e.target.value })}
                                        className="premium-input"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Body Fat (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Optional"
                                        value={form.bodyFat}
                                        onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
                                        className="premium-input"
                                    />
                                </div>
                            </div>

                            <h4 className="modal-section-heading">
                                Measurements (cm) — Optional
                            </h4>

                            <div className="form-grid-2">
                                <div className="input-group">
                                    <label>Chest</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="cm"
                                        value={form.chest}
                                        onChange={(e) => setForm({ ...form, chest: e.target.value })}
                                        className="premium-input"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Waist</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="cm"
                                        value={form.waist}
                                        onChange={(e) => setForm({ ...form, waist: e.target.value })}
                                        className="premium-input"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Hips</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="cm"
                                        value={form.hips}
                                        onChange={(e) => setForm({ ...form, hips: e.target.value })}
                                        className="premium-input"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Arms</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="cm"
                                        value={form.arms}
                                        onChange={(e) => setForm({ ...form, arms: e.target.value })}
                                        className="premium-input"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Thighs</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="cm"
                                        value={form.thighs}
                                        onChange={(e) => setForm({ ...form, thighs: e.target.value })}
                                        className="premium-input"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={saving}>
                                    {saving ? (
                                        <Loader2 size={18} className="spin" />
                                    ) : (
                                        "Save Entry"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}