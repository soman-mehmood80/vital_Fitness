import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import API from "../../services/api";

export default function ManageWorkouts() {
    const [workouts, setWorkouts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await API.get("/api/workouts/admin/all");
            setWorkouts(res.data.workouts || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load workouts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const remove = async (id) => {
        if (!window.confirm("Delete this workout?")) return;
        try {
            await API.delete(`/api/workouts/${id}`);
            load();
        } catch (err) {
            setError("Failed to delete workout");
        }
    };

    const filteredWorkouts = workouts.filter(w =>
        (w.title?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (w.category?.toLowerCase() || "").includes(search.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredWorkouts.length / rowsPerPage));
    const paginatedWorkouts = filteredWorkouts.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
                    <p className="eyebrow">CONTENT MANAGEMENT</p>
                    <h1>Manage Workouts</h1>
                    <p>Create, edit, and manage workout content.</p>
                </div>
                <Link to="/admin/workouts/new" className="primary-btn">
                    <Plus size={16} /> Add Workout
                </Link>
            </div>

            {error && (
                <div className="error-msg">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="data-table-container">
                <div className="table-header">
                    <div>
                        <h3 style={{ fontSize: 18, margin: 0, color: "var(--text-main)" }}>All Workouts</h3>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Total: {workouts.length} workouts</span>
                    </div>
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search by title or category..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Level</th>
                                <th>Duration</th>
                                <th>Status</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedWorkouts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                                        No workouts found
                                    </td>
                                </tr>
                            ) : (
                                paginatedWorkouts.map((w) => (
                                    <tr key={w._id}>
                                        <td data-label="Title">
                                            <strong style={{ fontSize: 14, color: "var(--text-main)" }}>{w.title}</strong>
                                        </td>
                                        <td data-label="Category">
                                            <span className="badge role">{w.category}</span>
                                        </td>
                                        <td data-label="Level">
                                            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{w.difficulty}</span>
                                        </td>
                                        <td data-label="Duration">
                                            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{w.duration} min</span>
                                        </td>
                                        <td data-label="Status">
                                            <span className={`badge ${w.isPublished ? "success" : "danger"}`}
                                                style={!w.isPublished ? { background: "rgba(239, 68, 68, 0.15)", color: "var(--accent-primary)" } : {}}>
                                                {w.isPublished ? "Published" : "Draft"}
                                            </span>
                                        </td>
                                        <td data-label="Actions" style={{ textAlign: "right" }}>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                                <Link to={`/admin/workouts/${w._id}`} className="icon-btn" title="Edit">
                                                    <Pencil size={16} />
                                                </Link>
                                                <button className="icon-btn danger" onClick={() => remove(w._id)} title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
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
        </div>
    );
}