import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Plus,
    MessageSquare,
    Clock,
    ShieldCheck,
    X,
    Loader2,
    Inbox,
    AlertCircle,
    Calendar,
    RefreshCw,
    ArrowUpRight,
    Search,
    ChevronDown,
    HelpCircle,
    Zap,
} from "lucide-react";
import API from "../../services/api";

const CountUp = ({ end, duration = 700 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        let frame;
        const target = Number(end) || 0;

        const animate = (ts) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(target * easeOut));
            if (progress < 1) frame = requestAnimationFrame(animate);
            else setCount(target);
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [end, duration]);

    return <>{count.toLocaleString()}</>;
};

const FAQ_ITEMS = [
    {
        q: "How are workout calories calculated?",
        a: "Calories are estimated from your workout intensity, duration, and profile metrics. You can also use the Quick Session Timer on the Dashboard.",
    },
    {
        q: "Why are steps not counting on desktop?",
        a: "Live motion tracking uses your phone's accelerometer. On desktop, you can manually add steps anytime on the Movement Tracker page.",
    },
    {
        q: "How does the AI Coach daily limit work?",
        a: "Deep AI backend analyses allow up to 5 full generations per day, while live telemetry chat responses are unlimited.",
    },
    {
        q: "How do I update my water, sleep, or step goals?",
        a: "Go to Settings → Daily Goals, pick a preset or enter custom targets, and tap Save Goals to sync across your Dashboard.",
    },
];

const ISSUE_CATEGORIES = [
    { label: "Workout Bug", prefix: "Workout logging issue: " },
    { label: "Data Sync", prefix: "Dashboard sync issue: " },
    { label: "Account", prefix: "Account & login help: " },
    { label: "Feature Idea", prefix: "Feature suggestion: " },
];

export default function Support() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Search & Status Filter
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [openFaq, setOpenFaq] = useState(0);

    // Modal
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ subject: "", message: "" });
    const [selectedCat, setSelectedCat] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const res = await API.get("/api/support/my");
            setTickets(res.data.tickets || []);
        } catch (err) {
            console.error("Failed to load tickets", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load(false);
    }, [load]);

    const openNewTicket = (presetSubject = "") => {
        setError("");
        setSelectedCat("");
        setForm({ subject: presetSubject, message: "" });
        setModal(true);
    };

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        if (form.subject.trim().length < 5) {
            setError("Subject must be at least 5 characters");
            return;
        }
        if (form.message.trim().length < 10) {
            setError("Message must be at least 10 characters");
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await API.post("/api/support", {
                subject: form.subject.trim(),
                message: form.message.trim(),
            });
            setModal(false);
            setForm({ subject: "", message: "" });
            setSelectedCat("");
            await load(true);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "open":
                return <span className="pct-badge green">Open</span>;
            case "in progress":
                return <span className="pct-badge amber">In Progress</span>;
            case "closed":
                return (
                    <span
                        className="pct-badge"
                        style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)" }}
                    >
                        Closed
                    </span>
                );
            default:
                return <span className="pct-badge red">{status || "Pending"}</span>;
        }
    };

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary, #ef4444)" }} />
            </div>
        );
    }

    const openCount = tickets.filter((t) => t.status?.toLowerCase() === "open").length;
    const inProgressCount = tickets.filter((t) => t.status?.toLowerCase() === "in progress").length;
    const repliedCount = tickets.filter((t) => Boolean(t.adminReply)).length;

    const filteredTickets = tickets.filter((t) => {
        const matchesStatus =
            statusFilter === "All" ||
            (t.status || "Pending").toLowerCase() === statusFilter.toLowerCase();

        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !q ||
            t.subject?.toLowerCase().includes(q) ||
            t.message?.toLowerCase().includes(q) ||
            t._id?.toLowerCase().includes(q);

        return matchesStatus && matchesSearch;
    });

    const todayFormatted = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    return (
        <div className="bento-page-wrapper">
            {/* ===== TOP COMMAND HEADER (DASHBOARD THEME) ===== */}
            <section className="dashboard-header-bento">
                <div className="header-left-col">
                    <div className="header-meta-row">
                        <span className="date-pill">
                            <Calendar size={12} /> {todayFormatted}
                        </span>
                        <span className="readiness-pill">
                            <span className="pulse-dot" />
                            <ShieldCheck size={12} /> Support Desk: <strong>Active</strong>
                        </span>
                        <button
                            type="button"
                            className="refresh-mini-btn"
                            onClick={() => load(true)}
                            disabled={refreshing}
                            title="Refresh tickets"
                            aria-label="Refresh tickets"
                        >
                            <RefreshCw size={13} className={refreshing ? "spin" : ""} />
                        </button>
                    </div>

                    <div className="greeting-section">
                        <h1>
                            Support <span>Center</span>
                        </h1>
                        <p>
                            Browse quick answers, track your active inquiries, or open a direct ticket with our team.
                        </p>
                    </div>

                    <div className="quick-actions-row">
                        <button
                            type="button"
                            className="quick-action-chip primary"
                            onClick={() => openNewTicket("")}
                        >
                            <Plus size={14} /> New Ticket
                        </button>
                        <button
                            type="button"
                            className="quick-action-chip"
                            onClick={() => setStatusFilter("Open")}
                        >
                            Open Only ({openCount})
                        </button>
                        <button
                            type="button"
                            className="quick-action-chip"
                            onClick={() => setStatusFilter("All")}
                        >
                            All Tickets
                        </button>
                        <Link to="/dashboard" className="quick-action-chip">
                            Dashboard <ArrowUpRight size={13} />
                        </Link>
                    </div>
                </div>

                {/* Top 4 KPI Tiles */}
                <div className="top-stats-row">
                    <div className="mini-stat">
                        <div className="mini-icon-box red">
                            <Inbox size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={tickets.length} />
                            </strong>
                            <span>Total Tickets</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box green">
                            <Clock size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={openCount} />
                            </strong>
                            <span>Open</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box orange">
                            <Zap size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={inProgressCount} />
                            </strong>
                            <span>In Progress</span>
                        </div>
                    </div>

                    <div className="mini-stat">
                        <div className="mini-icon-box blue">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <strong>
                                <CountUp end={repliedCount} />
                            </strong>
                            <span>Team Replies</span>
                        </div>
                    </div>
                </div>
            </section>

            {error && !modal && (
                <div className="bento-error-banner">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* ===== 12-COLUMN BENTO GRID ===== */}
            <div className="bento-grid">
                {/* LEFT (4 cols): Quick FAQ Help & Tips */}
                <div className="bento-item col-span-4">
                    <div className="bento-header">
                        <h3>
                            <HelpCircle size={17} color="var(--accent-primary, #ef4444)" /> Quick Answers
                        </h3>
                        <span className="pct-badge red">FAQ</span>
                    </div>

                    <div className="faq-accordion-list">
                        {FAQ_ITEMS.map((item, idx) => {
                            const isOpen = openFaq === idx;
                            return (
                                <div key={idx} className={`faq-item ${isOpen ? "open" : ""}`}>
                                    <button
                                        type="button"
                                        className="faq-question-btn"
                                        onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                                    >
                                        <span>{item.q}</span>
                                        <ChevronDown size={15} />
                                    </button>
                                    {isOpen && <div className="faq-answer-body">{item.a}</div>}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        className="vf-bento-submit"
                        style={{ marginTop: 16 }}
                        onClick={() => openNewTicket("")}
                    >
                        <Plus size={16} /> Still Need Help? Open Ticket
                    </button>
                </div>

                {/* RIGHT (8 cols): Support Tickets Feed */}
                <div className="bento-item col-span-8">
                    <div className="bento-header">
                        <h3>
                            <MessageSquare size={17} color="var(--accent-primary, #ef4444)" /> Your Support Tickets
                        </h3>
                        <span className="pct-badge red">{filteredTickets.length} Showing</span>
                    </div>

                    {/* Search & Status Filters */}
                    <div className="support-filter-bar">
                        <div className="search-input-box">
                            <Search size={15} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search subject, message, or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="category-pills">
                            {["All", "Open", "In Progress", "Closed"].map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    className={`category-pill ${statusFilter === st ? "active" : ""}`}
                                    style={{ padding: "6px 13px", fontSize: 12 }}
                                    onClick={() => setStatusFilter(st)}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredTickets.length === 0 ? (
                        <div className="empty-state" style={{ padding: "40px 20px" }}>
                            <div className="empty-icon-ring">
                                <Inbox size={34} className="empty-icon" />
                            </div>
                            <h3>
                                {tickets.length === 0 ? "No tickets found" : "No matching tickets"}
                            </h3>
                            <p style={{ marginBottom: 18 }}>
                                {tickets.length === 0
                                    ? "You haven't created any support tickets yet."
                                    : "Try clearing your search or selecting All tickets."}
                            </p>
                            {tickets.length === 0 ? (
                                <button
                                    type="button"
                                    className="vf-bento-submit"
                                    style={{ width: "auto" }}
                                    onClick={() => openNewTicket("")}
                                >
                                    <Plus size={16} /> Create your first ticket
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="settings-bento-btn-ghost"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("All");
                                    }}
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="support-tickets-stack">
                            {filteredTickets.map((t) => (
                                <div key={t._id} className="support-ticket-card">
                                    <div className="support-ticket-top">
                                        <div>
                                            <h4>
                                                <MessageSquare size={15} color="var(--accent-primary, #ef4444)" />{" "}
                                                {t.subject}
                                            </h4>
                                            <div className="support-ticket-meta">
                                                <span>
                                                    <Clock size={12} />{" "}
                                                    {new Date(t.createdAt || Date.now()).toLocaleDateString(undefined, {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                                <span>Ticket #{t._id.slice(-6)}</span>
                                            </div>
                                        </div>
                                        {getStatusBadge(t.status)}
                                    </div>

                                    <div className="support-ticket-msg">{t.message}</div>

                                    {t.adminReply && (
                                        <div className="support-admin-reply">
                                            <strong>
                                                <ShieldCheck size={15} /> Support Team Reply
                                            </strong>
                                            <p>{t.adminReply}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ===== NEW TICKET MODAL ===== */}
            {modal && (
                <div className="modal-overlay" onClick={() => !isSubmitting && setModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="modal-close-btn"
                            onClick={() => setModal(false)}
                            disabled={isSubmitting}
                        >
                            <X size={20} />
                        </button>

                        <h2 className="modal-title">Open a New Ticket</h2>
                        <p className="modal-subtitle">
                            Pick a quick topic or describe your issue and our team will reply shortly.
                        </p>

                        <div className="ticket-category-chips">
                            {ISSUE_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.label}
                                    type="button"
                                    className={`ticket-cat-chip ${selectedCat === cat.label ? "active" : ""}`}
                                    onClick={() => {
                                        setSelectedCat(cat.label);
                                        setForm((prev) => ({ ...prev, subject: cat.prefix }));
                                    }}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={submit}>
                            <div className="input-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Issue with workout logging"
                                    required
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    className="premium-input"
                                    style={{ cursor: "text" }}
                                />
                                <div className="char-counter-row">
                                    <span>Minimum 5 characters</span>
                                    <span>{form.subject.trim().length} chars</span>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Message</label>
                                <textarea
                                    rows="5"
                                    placeholder="Please provide as much detail as possible..."
                                    required
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    className="premium-input"
                                    style={{ resize: "vertical", cursor: "text" }}
                                />
                                <div className="char-counter-row">
                                    <span>Minimum 10 characters</span>
                                    <span>{form.message.trim().length} chars</span>
                                </div>
                            </div>

                            {error && (
                                <div className="bento-error-banner" style={{ marginBottom: 14 }}>
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="settings-bento-btn-ghost"
                                    style={{ justifyContent: "center" }}
                                    onClick={() => setModal(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="vf-bento-submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="spin" /> Sending...
                                        </>
                                    ) : (
                                        "Submit Ticket"
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