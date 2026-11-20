import { useEffect, useState } from "react";
import { Plus, Trash2, Search, Loader2, X, Utensils, RotateCcw, AlertCircle } from "lucide-react";
import API from "../../services/api";

export default function ManageFoodItems() {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // Modal
    const [modal, setModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "", category: "Protein", servingSize: 100, servingUnit: "g",
        calories: 0, protein: 0, carbs: 0, fats: 0
    });

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await API.get("/api/food-items", { params: { all: "true", limit: 200 } });
            setItems(res.data.items || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load food items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const save = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        setError("");

        try {
            await API.post("/api/food-items", form);
            setModal(false);
            setForm({
                name: "", category: "Protein", servingSize: 100, servingUnit: "g",
                calories: 0, protein: 0, carbs: 0, fats: 0
            });
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save food item");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this food item? It will be marked as Inactive.")) return;
        try {
            setError("");
            await API.delete(`/api/food-items/${id}`);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete item");
        }
    };

    const restore = async (id) => {
        try {
            setError("");
            await API.put(`/api/food-items/${id}/restore`);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to restore item");
        }
    };

    const filteredItems = items.filter(i =>
        (i.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (i.category?.toLowerCase() || "").includes(search.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
    const paginatedItems = filteredItems.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary)" }} />
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="page-header-flex">
                <div className="page-header-clean" style={{ margin: 0 }}>
                    <p className="eyebrow">DATABASE MANAGEMENT</p>
                    <h1>Food Catalog</h1>
                    <p>Manage the nutritional database for users.</p>
                </div>
                <button className="primary-btn" onClick={() => { setError(""); setModal(true); }}>
                    <Plus size={18} /> Add Food Item
                </button>
            </div>

            {error && !modal && (
                <div className="error-msg">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="data-table-container">
                <div className="table-header">
                    <div>
                        <h3 style={{ fontSize: 18, margin: 0, color: "var(--text-main)" }}>All Food Items</h3>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Total: {items.length} items</span>
                    </div>
                    <div className="search-box">
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Food Name</th>
                                <th>Category</th>
                                <th>Macros (P/C/F)</th>
                                <th>Calories</th>
                                <th>Status</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                                        No food items found
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map(item => (
                                    <tr key={item._id} style={{ opacity: item.isActive ? 1 : 0.6 }}>
                                        <td data-label="Food Name">
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 10,
                                                    background: "var(--accent-soft)", color: "var(--accent-primary)",
                                                    display: "flex", alignItems: "center", justifyContent: "center"
                                                }}>
                                                    <Utensils size={16} />
                                                </div>
                                                <strong style={{ fontSize: 14, color: "var(--text-main)" }}>{item.name}</strong>
                                            </div>
                                        </td>
                                        <td data-label="Category">
                                            <span className="badge role">{item.category}</span>
                                        </td>
                                        <td data-label="Macros">
                                            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                                <strong style={{ color: "#3b82f6" }}>{item.protein}g</strong> /
                                                <strong style={{ color: "#f97316" }}> {item.carbs}g</strong> /
                                                <strong style={{ color: "var(--accent-primary)" }}> {item.fats}g</strong>
                                            </span>
                                        </td>
                                        <td data-label="Calories">
                                            <strong style={{ fontSize: 14, color: "var(--text-main)" }}>
                                                {item.calories} <small style={{ color: "var(--text-muted)" }}>kcal</small>
                                            </strong>
                                        </td>
                                        <td data-label="Status">
                                            <span className={`badge ${item.isActive ? "success" : "danger"}`}
                                                style={!item.isActive ? { background: "rgba(239, 68, 68, 0.15)", color: "var(--accent-primary)" } : {}}>
                                                {item.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td data-label="Actions" style={{ textAlign: "right" }}>
                                            {item.isActive ? (
                                                <button className="icon-btn danger" onClick={() => remove(item._id)} title="Mark Inactive">
                                                    <Trash2 size={16} />
                                                </button>
                                            ) : (
                                                <button className="icon-btn" onClick={() => restore(item._id)} title="Restore">
                                                    <RotateCcw size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>← Previous</button>
                        <span>Page <strong>{page}</strong> of {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next →</button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal && (
                <div className="modal-overlay" onClick={() => !saving && setModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close-btn" onClick={() => setModal(false)} disabled={saving}>
                            <X size={20} />
                        </button>

                        <h2 className="modal-title">Add New Food</h2>
                        <p className="modal-subtitle">Enter nutritional information per serving.</p>

                        {error && (
                            <div className="error-msg">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={save}>
                            <div className="input-group">
                                <label>Food Name *</label>
                                <input
                                    type="text" required
                                    placeholder="e.g. Grilled Chicken Breast"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="premium-input"
                                />
                            </div>

                            <div className="form-grid-2">
                                <div className="input-group">
                                    <label>Category</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="premium-input">
                                        <option>Protein</option>
                                        <option>Carbs</option>
                                        <option>Fats</option>
                                        <option>Vegetable</option>
                                        <option>Fruit</option>
                                        <option>Dairy</option>
                                        <option>Beverage</option>
                                        <option>Snack</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Calories (kcal) *</label>
                                    <input type="number" min="0" required value={form.calories}
                                        onChange={e => setForm({ ...form, calories: +e.target.value })}
                                        className="premium-input" />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="input-group">
                                    <label>Serving Size</label>
                                    <input type="number" min="1" value={form.servingSize}
                                        onChange={e => setForm({ ...form, servingSize: +e.target.value })}
                                        className="premium-input" />
                                </div>
                                <div className="input-group">
                                    <label>Serving Unit</label>
                                    <select value={form.servingUnit} onChange={e => setForm({ ...form, servingUnit: e.target.value })} className="premium-input">
                                        <option value="g">g</option>
                                        <option value="ml">ml</option>
                                        <option value="piece">piece</option>
                                        <option value="cup">cup</option>
                                        <option value="tbsp">tbsp</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                <div className="input-group">
                                    <label>Protein (g)</label>
                                    <input type="number" min="0" value={form.protein}
                                        onChange={e => setForm({ ...form, protein: +e.target.value })}
                                        className="premium-input" />
                                </div>
                                <div className="input-group">
                                    <label>Carbs (g)</label>
                                    <input type="number" min="0" value={form.carbs}
                                        onChange={e => setForm({ ...form, carbs: +e.target.value })}
                                        className="premium-input" />
                                </div>
                                <div className="input-group">
                                    <label>Fats (g)</label>
                                    <input type="number" min="0" value={form.fats}
                                        onChange={e => setForm({ ...form, fats: +e.target.value })}
                                        className="premium-input" />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setModal(false)} disabled={saving}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={saving}>
                                    {saving ? <><Loader2 size={18} className="spin" /> Saving...</> : "Save Food Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}