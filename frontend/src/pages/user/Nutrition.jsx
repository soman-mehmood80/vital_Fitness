import { useEffect, useMemo, useState } from "react";
import {
    Trash2, Flame, Drumstick, Wheat, Plus, Utensils,
    Loader2, CheckCircle2, Droplet, AlertCircle, Search, X, Check
} from "lucide-react";
import API from "../../services/api";

const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks"];

// Reusable macro card component
function MacroItem({ icon, iconClass, label, value, goal, unit, color }) {
    const safeGoal = Math.max(goal, 1);
    const percent = Math.min((value / safeGoal) * 100, 100);
    const remaining = Math.max(goal - value, 0);

    return (
        <div className="macro-item-card">
            <div className="macro-card-top">
                <div className={`icon-box ${iconClass}`}>{icon}</div>
                <span className="macro-pct-tag">{Math.round(percent)}%</span>
            </div>
            <div className="macro-card-body">
                <p>{label}</p>
                <h3>
                    {Math.round(value)}{unit} <small>/ {goal}{unit}</small>
                </h3>
                <span className="macro-rem-text">
                    {remaining > 0 ? `${Math.round(remaining)}${unit} left` : "Goal reached!"}
                </span>
            </div>
            <div className="macro-bar-bg">
                <div
                    className="macro-bar-fill"
                    style={{ width: `${percent}%`, background: color }}
                />
            </div>
        </div>
    );
}

export default function Nutrition() {
    const [data, setData] = useState(null);
    const [catalog, setCatalog] = useState([]);

    // Form State
    const [selected, setSelected] = useState("");
    const [amount, setAmount] = useState("100");
    const [mealType, setMealType] = useState("Breakfast");
    const [searchFood, setSearchFood] = useState("");

    // Custom Food State
    const [useCustom, setUseCustom] = useState(false);
    const [custom, setCustom] = useState({ name: "", calories: "", protein: "", carbs: "", fats: "" });

    // Log Filter & UI State
    const [logFilter, setLogFilter] = useState("All");
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [error, setError] = useState("");

    const load = async () => {
        try {
            const [todayRes, catalogRes] = await Promise.all([
                API.get("/api/nutrition/today", { params: { date: getLocalDate() } }),
                API.get("/api/food-items", { params: { limit: 200 } })
            ]);
            setData(todayRes.data);
            setCatalog(catalogRes.data.items || []);
        } catch (err) {
            console.error("Failed to load nutrition data", err);
            setError("Failed to load nutrition data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    // Selected catalog item + live macro preview
    const selectedItem = useMemo(
        () => catalog.find((c) => c._id === selected) || null,
        [catalog, selected]
    );

    const previewMacros = useMemo(() => {
        if (useCustom || !selectedItem) return null;
        const qty = Number(amount) || 0;
        const baseSize = Number(selectedItem.servingSize) || 100;
        const ratio = qty / baseSize;

        return {
            calories: Math.round((selectedItem.calories || 0) * ratio),
            protein: Math.round((selectedItem.protein || 0) * ratio),
            carbs: Math.round((selectedItem.carbs || 0) * ratio),
            fats: Math.round((selectedItem.fats || 0) * ratio)
        };
    }, [useCustom, selectedItem, amount]);

    const add = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        const qty = Number(amount);
        if (!qty || qty <= 0) {
            setError("Please enter a valid quantity greater than 0.");
            return;
        }

        if (useCustom) {
            if (!custom.name.trim() || !custom.calories) {
                setError("Custom food needs a name and calories.");
                return;
            }
        } else if (!selected) {
            setError("Please select a food item from the catalog.");
            return;
        }

        setAdding(true);
        try {
            const payload = {
                mealType,
                quantity: qty,
                date: getLocalDate()
            };

            if (useCustom) {
                payload.customFood = {
                    name: custom.name.trim(),
                    calories: Number(custom.calories) || 0,
                    protein: Number(custom.protein) || 0,
                    carbs: Number(custom.carbs) || 0,
                    fats: Number(custom.fats) || 0
                };
            } else {
                payload.foodItemId = selected;
            }

            await API.post("/api/nutrition/log", payload);

            setSelected("");
            setSearchFood("");
            setCustom({ name: "", calories: "", protein: "", carbs: "", fats: "" });
            setAmount("100");
            setSuccessMsg("Meal logged successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to add food log");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        setError("");
        try {
            await API.delete(`/api/nutrition/${id}`);
            setConfirmDeleteId(null);
            load();
        } catch (err) {
            setError("Failed to delete item");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary)" }} />
            </div>
        );
    }

    // Totals & Goals
    const calories = data?.totals?.calories || 0;
    const protein = data?.totals?.protein || 0;
    const carbs = data?.totals?.carbs || 0;
    const fats = data?.totals?.fats || 0;

    const goals = {
        calories: data?.goals?.calories || 2500,
        protein: data?.goals?.protein || 150,
        carbs: data?.goals?.carbs || 250,
        fats: data?.goals?.fats || 70
    };

    const filteredCatalog = catalog.filter((c) =>
        c.name.toLowerCase().includes(searchFood.trim().toLowerCase())
    );

    const allLogs = data?.logs || [];
    const filteredLogs =
        logFilter === "All"
            ? allLogs
            : allLogs.filter((l) => l.mealType === logFilter);

    const filteredCalories = filteredLogs.reduce((sum, l) => sum + (l.calories || 0), 0);

    return (
        <div className="nutrition-wrapper">
            {/* Header */}
            <div className="page-header-clean page-header-flex">
                <div>
                    <p className="eyebrow">DAILY FUEL</p>
                    <h1>Nutrition & Macros</h1>
                    <p>Track your meals, balance macros, and hit your daily energy targets.</p>
                </div>
                <div className="nutrition-cal-pill">
                    <Flame size={16} />
                    <span>
                        <strong>{Math.max(goals.calories - calories, 0).toLocaleString()}</strong> kcal remaining
                    </span>
                </div>
            </div>

            {error && (
                <div className="error-msg">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Macro Overview Panel */}
            <div className="panel">
                <div className="macro-panel-header">
                    <h3 className="section-title">Today's Macros</h3>
                    <span className="badge role">{allLogs.length} meals logged</span>
                </div>

                <div className="macro-cards-grid">
                    <MacroItem
                        icon={<Flame size={20} />}
                        iconClass="red"
                        label="Calories"
                        value={calories}
                        goal={goals.calories}
                        unit=""
                        color="var(--accent-gradient)"
                    />
                    <MacroItem
                        icon={<Drumstick size={20} />}
                        iconClass="blue"
                        label="Protein"
                        value={protein}
                        goal={goals.protein}
                        unit="g"
                        color="#3b82f6"
                    />
                    <MacroItem
                        icon={<Wheat size={20} />}
                        iconClass="orange"
                        label="Carbs"
                        value={carbs}
                        goal={goals.carbs}
                        unit="g"
                        color="#f97316"
                    />
                    <MacroItem
                        icon={<Droplet size={20} />}
                        iconClass="purple"
                        label="Fats"
                        value={fats}
                        goal={goals.fats}
                        unit="g"
                        color="#a78bfa"
                    />
                </div>
            </div>

            {/* 2-Column Workspace: Log Form + Today's History */}
            <div className="nutrition-workspace-grid">
                {/* LEFT: Log a Meal */}
                <div className="panel">
                    <div className="macro-panel-header" style={{ marginBottom: 16 }}>
                        <h3 className="section-title flex-title" style={{ margin: 0 }}>
                            <Plus size={19} color="var(--accent-primary)" /> Log a Meal
                        </h3>

                        <div className="tab-pill-group">
                            <button
                                type="button"
                                onClick={() => setUseCustom(false)}
                                className={`tab-pill ${!useCustom ? "active" : ""}`}
                            >
                                Catalog
                            </button>
                            <button
                                type="button"
                                onClick={() => setUseCustom(true)}
                                className={`tab-pill ${useCustom ? "active" : ""}`}
                            >
                                Custom
                            </button>
                        </div>
                    </div>

                    <form onSubmit={add}>
                        {/* Meal Type Pills */}
                        <div className="input-group">
                            <label>Meal Type</label>
                            <div className="meal-pills-row">
                                {MEAL_TYPES.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setMealType(type)}
                                        className={`meal-type-pill ${mealType === type ? "active" : ""}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!useCustom ? (
                            <>
                                <div className="input-group">
                                    <label>Search Catalog</label>
                                    <div className="search-input-wrap">
                                        <Search size={16} className="search-input-icon" />
                                        <input
                                            type="text"
                                            placeholder="Search chicken, oats, rice..."
                                            value={searchFood}
                                            onChange={(e) => setSearchFood(e.target.value)}
                                            className="premium-input with-left-icon"
                                        />
                                        {searchFood && (
                                            <button
                                                type="button"
                                                className="input-clear-btn"
                                                onClick={() => setSearchFood("")}
                                                aria-label="Clear search"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="input-group">
                                        <label>Select Food ({filteredCatalog.length})</label>
                                        <select
                                            value={selected}
                                            onChange={(e) => setSelected(e.target.value)}
                                            className="premium-input"
                                        >
                                            <option value="">Choose from catalog...</option>
                                            {filteredCatalog.map((c) => (
                                                <option key={c._id} value={c._id}>
                                                    {c.name} ({c.calories} kcal / {c.servingSize}{c.servingUnit})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label>Quantity ({selectedItem?.servingUnit || "g"})</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="any"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="premium-input"
                                            placeholder="e.g. 100"
                                        />
                                    </div>
                                </div>

                                {/* Live Macro Preview */}
                                {previewMacros && (
                                    <div className="food-preview-banner">
                                        <div className="preview-title">
                                            <span>Estimated for {amount || 0}{selectedItem?.servingUnit || "g"}</span>
                                            <strong>{previewMacros.calories} kcal</strong>
                                        </div>
                                        <div className="preview-macros">
                                            <span><b className="text-blue">{previewMacros.protein}g</b> Protein</span>
                                            <span><b className="text-orange">{previewMacros.carbs}g</b> Carbs</span>
                                            <span><b className="text-purple">{previewMacros.fats}g</b> Fats</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="custom-food-grid">
                                <div className="input-group custom-food-full">
                                    <label>Food Name *</label>
                                    <input
                                        type="text"
                                        value={custom.name}
                                        onChange={(e) => setCustom({ ...custom, name: e.target.value })}
                                        className="premium-input"
                                        placeholder="e.g. Homemade Chicken Bowl"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="any"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="premium-input"
                                        placeholder="100"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Calories (kcal) *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={custom.calories}
                                        onChange={(e) => setCustom({ ...custom, calories: e.target.value })}
                                        className="premium-input"
                                        placeholder="350"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Protein (g)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={custom.protein}
                                        onChange={(e) => setCustom({ ...custom, protein: e.target.value })}
                                        className="premium-input"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Carbs (g)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={custom.carbs}
                                        onChange={(e) => setCustom({ ...custom, carbs: e.target.value })}
                                        className="premium-input"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="input-group custom-food-full">
                                    <label>Fats (g)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={custom.fats}
                                        onChange={(e) => setCustom({ ...custom, fats: e.target.value })}
                                        className="premium-input"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        )}

                        <button className="btn-submit" type="submit" disabled={adding}>
                            {adding ? (
                                <Loader2 size={20} className="spin" />
                            ) : (
                                <>
                                    <Plus size={19} /> Add to Log
                                </>
                            )}
                        </button>
                    </form>

                    {successMsg && (
                        <div className="muted-msg" style={{ marginTop: 14, marginBottom: 0 }}>
                            <CheckCircle2 size={16} /> {successMsg}
                        </div>
                    )}
                </div>

                {/* RIGHT: Today's Log */}
                <div className="panel">
                    <div className="macro-panel-header" style={{ marginBottom: 12 }}>
                        <h3 className="section-title flex-title" style={{ margin: 0 }}>
                            <Utensils size={19} color="var(--accent-primary)" /> Today's Food Log
                        </h3>
                        <span className="log-subtotal-badge">
                            {filteredCalories.toLocaleString()} kcal
                        </span>
                    </div>

                    {/* Meal Filter Tabs */}
                    <div className="meal-filter-tabs">
                        {["All", ...MEAL_TYPES].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setLogFilter(tab)}
                                className={`meal-filter-btn ${logFilter === tab ? "active" : ""}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="history-list">
                        {filteredLogs.length === 0 ? (
                            <div className="empty-state">
                                <Utensils size={38} className="empty-icon" />
                                <h3>
                                    {logFilter === "All"
                                        ? "No meals logged yet"
                                        : `No ${logFilter.toLowerCase()} logged`}
                                </h3>
                                <p>Use the meal logger to track your intake.</p>
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div key={log._id} className="nutrition-log-item">
                                    <div className="log-left">
                                        <div className="log-icon-box">
                                            <Utensils size={20} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <strong className="log-title">{log.foodName}</strong>
                                            <div className="log-meta">
                                                <span className="badge role">{log.mealType}</span>
                                                <span>{log.quantity}g</span>
                                                {(log.protein !== undefined || log.carbs !== undefined) && (
                                                    <span className="log-macros-mini">
                                                        P:{Math.round(log.protein || 0)}g · C:{Math.round(log.carbs || 0)}g · F:{Math.round(log.fats || 0)}g
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="log-right-actions">
                                        <div className="log-cal-value">
                                            {log.calories} <small>kcal</small>
                                        </div>

                                        {confirmDeleteId === log._id ? (
                                            <div className="inline-confirm-group">
                                                <button
                                                    type="button"
                                                    className="icon-btn danger"
                                                    onClick={() => handleDelete(log._id)}
                                                    disabled={deletingId === log._id}
                                                    title="Confirm delete"
                                                >
                                                    {deletingId === log._id ? (
                                                        <Loader2 size={15} className="spin" />
                                                    ) : (
                                                        <Check size={15} />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="icon-btn"
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    title="Cancel"
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className="icon-btn danger"
                                                onClick={() => setConfirmDeleteId(log._id)}
                                                title="Delete entry"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}