import { useEffect, useState } from "react";
import { LifeBuoy, MessageSquare, Loader2, X, ShieldCheck, Clock, AlertCircle, Send } from "lucide-react";
import API from "../../services/api";

export default function ManageSupport() {
    const [tab, setTab] = useState("tickets");
    const [tickets, setTickets] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal
    const [selected, setSelected] = useState(null);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            if (tab === "tickets") {
                const r = await API.get("/api/support/admin/all");
                setTickets(r.data.tickets || []);
            } else {
                const r = await API.get("/api/feedback/admin/all");
                setFeedback(r.data.feedback || []);
            }
        } catch (err) {
            console.error("Failed to load data", err);
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [tab]);

    const sendReply = async () => {
        if (!reply.trim()) {
            setError("Please write a reply");
            return;
        }
        if (sending) return;

        setSending(true);
        setError("");
        try {
            await API.put(`/api/support/${selected._id}/reply`, {
                status: "Closed",
                adminReply: reply
            });
            setSelected(null);
            setReply("");
            await load();
        } catch (err) {
            setError("Failed to send reply");
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="page-header-clean">
                <p className="eyebrow">CUSTOMER CARE</p>
                <h1>Support & Feedback</h1>
                <p>Manage user inquiries and review app feedback.</p>
            </div>

            {error && !selected && (
                <div className="error-msg">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 12 }}>
                <button
                    className={tab === "tickets" ? "primary-btn" : "btn-secondary"}
                    onClick={() => setTab("tickets")}
                >
                    <LifeBuoy size={18} /> Support Tickets ({tickets.length})
                </button>
                <button
                    className={tab === "feedback" ? "primary-btn" : "btn-secondary"}
                    onClick={() => setTab("feedback")}
                >
                    <MessageSquare size={18} /> User Feedback ({feedback.length})
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="loader-container">
                    <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary)" }} />
                </div>
            ) : tab === "tickets" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 20 }}>
                    {tickets.length === 0 ? (
                        <div className="panel" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                            <LifeBuoy size={48} style={{ opacity: 0.2, margin: "0 auto 16px auto" }} />
                            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)" }}>No tickets found</h3>
                            <p style={{ margin: 0, fontSize: 14 }}>All clear!</p>
                        </div>
                    ) : (
                        tickets.map(t => (
                            <div key={t._id} className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                    <div>
                                        <h4 style={{ margin: "0 0 4px 0", fontSize: 16, color: "var(--text-main)" }}>
                                            {t.subject || "No Subject"}
                                        </h4>
                                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                            By: {t.userId?.name || "Unknown"}
                                        </span>
                                    </div>
                                    <span className={`badge ${t.status === "Open" ? "success" : "role"}`}>
                                        {t.status || "Open"}
                                    </span>
                                </div>

                                <div style={{
                                    padding: 12, background: "var(--bg-elevated)",
                                    borderRadius: 8, fontSize: 13, color: "var(--text-main)",
                                    borderLeft: "3px solid var(--accent-primary)"
                                }}>
                                    {t.message}
                                </div>

                                {t.adminReply ? (
                                    <div style={{
                                        padding: 12, background: "rgba(34, 197, 94, 0.05)",
                                        border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: 8
                                    }}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 700, color: "#22c55e",
                                            display: "flex", alignItems: "center", gap: 4, marginBottom: 4
                                        }}>
                                            <ShieldCheck size={12} /> YOU REPLIED
                                        </span>
                                        <p style={{ margin: 0, fontSize: 13, color: "var(--text-main)" }}>
                                            {t.adminReply}
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        className="btn-secondary"
                                        style={{ width: "100%", marginTop: "auto" }}
                                        onClick={() => { setSelected(t); setError(""); }}
                                    >
                                        Reply to Ticket
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                    {feedback.length === 0 ? (
                        <div className="panel" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                            <MessageSquare size={48} style={{ opacity: 0.2, margin: "0 auto 16px auto" }} />
                            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)" }}>No feedback yet</h3>
                            <p style={{ margin: 0, fontSize: 14 }}>Users haven't submitted any feedback.</p>
                        </div>
                    ) : (
                        feedback.map(f => (
                            <div key={f._id} className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span className="badge role">{f.type}</span>
                                    <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                                        <Clock size={12} /> {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "N/A"}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: 14, color: "var(--text-main)", lineHeight: 1.5 }}>
                                    "{f.message}"
                                </p>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    marginTop: "auto", paddingTop: 12,
                                    borderTop: "1px solid var(--border-subtle)"
                                }}>
                                    <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>
                                        {f.userId?.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                        {f.userId?.name || "Anonymous"}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Reply Modal */}
            {selected && (
                <div className="modal-overlay" onClick={() => !sending && setSelected(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close-btn" onClick={() => setSelected(null)} disabled={sending}>
                            <X size={20} />
                        </button>

                        <h2 className="modal-title">Reply to {selected.userId?.name || "User"}</h2>

                        <div style={{
                            padding: 16, background: "var(--bg-elevated)",
                            borderRadius: 10, marginBottom: 20, fontSize: 14,
                            borderLeft: "3px solid var(--accent-primary)"
                        }}>
                            <strong style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                                Original Message:
                            </strong>
                            "{selected.message}"
                        </div>

                        {error && (
                            <div className="error-msg">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="input-group">
                            <label>Your Reply</label>
                            <textarea
                                rows="4"
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                placeholder="Write your response here..."
                                className="premium-input"
                                style={{ resize: "vertical" }}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setSelected(null)} disabled={sending}>
                                Cancel
                            </button>
                            <button
                                className="btn-submit"
                                onClick={sendReply}
                                disabled={sending || !reply.trim()}
                            >
                                {sending ? (
                                    <><Loader2 size={18} className="spin" /> Sending...</>
                                ) : (
                                    <><Send size={18} /> Send Reply</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}