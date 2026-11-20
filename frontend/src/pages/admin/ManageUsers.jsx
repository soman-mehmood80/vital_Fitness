import { useEffect, useState } from "react";
import { Search, Loader2, Trash2, Edit, UserPlus, X, AlertCircle } from "lucide-react";
import API from "../../services/api";

export default function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [currentId, setCurrentId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "", email: "", password: "", role: "user", emailVerified: true
    });

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await API.get("/api/admin/users");
            setUsers(res.data.users || []);
        } catch (err) {
            console.error("Failed to load users", err);
            setError("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setModalMode("create");
        setForm({ name: "", email: "", password: "", role: "user", emailVerified: true });
        setModalOpen(true);
    };

    const openEdit = (user) => {
        setModalMode("edit");
        setCurrentId(user._id);
        setForm({
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
            password: ""
        });
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        setError("");

        try {
            if (modalMode === "create") {
                if (!form.password || form.password.length < 8) {
                    setError("Password must be at least 8 characters");
                    return;
                }
                await API.post("/api/admin/users", form);
            } else {
                const payload = { ...form };
                if (!payload.password) delete payload.password;
                await API.put(`/api/admin/users/${currentId}`, payload);
            }
            setModalOpen(false);
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Operation failed");
        } finally {
            setSaving(false);
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm("Are you sure? This will permanently delete the user and all their data.")) return;
        try {
            await API.delete(`/api/admin/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete user");
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (u.email?.toLowerCase() || "").includes(search.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
    const paginatedUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
                    <p className="eyebrow">USER MANAGEMENT</p>
                    <h1>Manage Users</h1>
                    <p>Create, edit, and manage all users.</p>
                </div>
                <button className="primary-btn" onClick={openCreate}>
                    <UserPlus size={18} /> Add New User
                </button>
            </div>

            {error && !modalOpen && (
                <div className="error-msg">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="data-table-container">
                <div className="table-header">
                    <div>
                        <h3 style={{ fontSize: 18, margin: 0, color: "var(--text-main)" }}>All Users</h3>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Total: {users.length} users</span>
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
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "60px 20px" }}>
                                        <p style={{ color: "var(--text-muted)" }}>No users found</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user._id}>
                                        <td data-label="User">
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div className="avatar" style={{ width: 36, height: 36 }}>
                                                    {user.profileImage ? (
                                                        <img src={user.profileImage} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                                    ) : (
                                                        user.name?.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <strong style={{ display: "block", fontSize: 14, color: "var(--text-main)" }}>{user.name}</strong>
                                                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Role">
                                            <span className={`badge ${user.role === "admin" ? "danger" : "role"}`}
                                                style={user.role === "admin" ? { background: "rgba(239, 68, 68, 0.15)", color: "var(--accent-primary)" } : {}}>
                                                {user.role === "admin" ? "Admin" : "User"}
                                            </span>
                                        </td>
                                        <td data-label="Status">
                                            <span className={`badge ${user.emailVerified ? "success" : "danger"}`}
                                                style={!user.emailVerified ? { background: "rgba(239, 68, 68, 0.15)", color: "var(--accent-primary)" } : {}}>
                                                {user.emailVerified ? "Verified" : "Unverified"}
                                            </span>
                                        </td>
                                        <td data-label="Joined">
                                            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td data-label="Actions" style={{ textAlign: "right" }}>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                                <button className="icon-btn" onClick={() => openEdit(user)} title="Edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="icon-btn danger" onClick={() => deleteUser(user._id)} title="Delete">
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

            {/* Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => !saving && setModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="modal-close-btn"
                            onClick={() => setModalOpen(false)}
                            disabled={saving}
                        >
                            <X size={20} />
                        </button>

                        <h2 className="modal-title">
                            {modalMode === "create" ? "Add New User" : "Edit User"}
                        </h2>
                        <p className="modal-subtitle">
                            {modalMode === "create"
                                ? "Create a new user account with verified email."
                                : "Update user details. Leave password empty to keep current."}
                        </p>

                        {error && (
                            <div className="error-msg">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div className="input-group">
                                <label>Name *</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="premium-input"
                                />
                            </div>
                            <div className="input-group">
                                <label>Email *</label>
                                <input
                                    required
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="premium-input"
                                />
                            </div>

                            {modalMode === "create" && (
                                <div className="input-group">
                                    <label>Password *</label>
                                    <input
                                        required
                                        type="password"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        className="premium-input"
                                        placeholder="Min 8 characters"
                                        minLength="8"
                                    />
                                </div>
                            )}

                            <div className="form-grid-2">
                                <div className="input-group">
                                    <label>Role</label>
                                    <select
                                        value={form.role}
                                        onChange={e => setForm({ ...form, role: e.target.value })}
                                        className="premium-input"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Email Verified</label>
                                    <select
                                        value={String(form.emailVerified)}
                                        onChange={e => setForm({ ...form, emailVerified: e.target.value === "true" })}
                                        className="premium-input"
                                    >
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={saving}>
                                    {saving ? <><Loader2 size={18} className="spin" /> Saving...</> : "Save User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}