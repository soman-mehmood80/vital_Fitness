import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    LockKeyhole,
    Eye,
    EyeOff,
    Check,
    X,
    Heart,
    ArrowRight,
    ArrowLeft,
} from "lucide-react";
import API from "../../services/api";
import { clearSession } from "../../utils/auth";
import ThemeToggle from "../../components/Layout/ThemeToggle";

const checks = (pw) => [
    { label: "At least 8 characters", pass: pw.length >= 8 },
    { label: "Contains lowercase", pass: /[a-z]/.test(pw) },
    { label: "Contains uppercase", pass: /[A-Z]/.test(pw) },
    { label: "Contains a number", pass: /[0-9]/.test(pw) },
    { label: "Contains special char", pass: /[^A-Za-z0-9]/.test(pw) },
];

export default function ChangePassword() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirm: "",
    });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [msg, setMsg] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    const rules = checks(form.newPassword);
    const allPassed = rules.every((r) => r.pass);
    const passwordsMatch = !form.confirm || form.newPassword === form.confirm;

    const submit = async (e) => {
        e.preventDefault();
        setMsg("");
        setIsError(false);

        if (!allPassed) {
            setIsError(true);
            setMsg("New password must meet all requirements.");
            return;
        }
        if (form.newPassword !== form.confirm) {
            setIsError(true);
            setMsg("Passwords do not match.");
            return;
        }
        if (form.newPassword === form.currentPassword) {
            setIsError(true);
            setMsg("New password must be different from current.");
            return;
        }

        setLoading(true);
        try {
            const res = await API.post("/auth/change-password", {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            clearSession();
            setIsError(false);
            setMsg(res.data.message);
            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            setIsError(true);
            setMsg(err.response?.data?.message || "Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-cyber-grid" aria-hidden="true" />
            <div className="auth-theme-toggle">
                <ThemeToggle />
            </div>

            <form className="auth-card" onSubmit={submit}>
                <Link to="/" className="auth-brand-link" style={{ margin: "0 auto 20px" }}>
                    <div className="brand-pulse-icon">
                        <Heart
                            size={19}
                            fill="var(--accent-primary, #ef4444)"
                            color="var(--accent-primary, #ef4444)"
                        />
                    </div>
                    <span className="brand-wordmark">
                        Vital<em>Fit.</em>
                    </span>
                </Link>

                <div style={{ display: "flex", justifyContent: "center" }}>
                    <div className="auth-eyebrow-pill">
                        <span className="pulse-dot" />
                        <span>SECURITY</span>
                    </div>
                </div>

                <h1>
                    Change <span>Password</span>
                </h1>
                <p className="auth-subtitle" style={{ textAlign: "center" }}>
                    Update your credentials to keep your VitalFit telemetry secure.
                </p>

                <div className="input-group">
                    <label>Current Password</label>
                    <div className="input-wrapper">
                        <LockKeyhole size={18} className="input-icon" />
                        <input
                            type={showCurrent ? "text" : "password"}
                            required
                            value={form.currentPassword}
                            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                            placeholder="Enter current password"
                        />
                        <button
                            type="button"
                            className="pw-toggle-btn"
                            onClick={() => setShowCurrent(!showCurrent)}
                            aria-label={showCurrent ? "Hide current password" : "Show current password"}
                        >
                            {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="input-group">
                    <label>New Password</label>
                    <div className="input-wrapper">
                        <LockKeyhole size={18} className="input-icon" />
                        <input
                            type={showNew ? "text" : "password"}
                            required
                            value={form.newPassword}
                            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                            placeholder="Create new strong password"
                        />
                        <button
                            type="button"
                            className="pw-toggle-btn"
                            onClick={() => setShowNew(!showNew)}
                            aria-label={showNew ? "Hide new password" : "Show new password"}
                        >
                            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {form.newPassword && (
                    <div className="password-rules">
                        {rules.map((r) => (
                            <div key={r.label} className={`rule-item ${r.pass ? "pass" : "fail"}`}>
                                {r.pass ? <Check size={14} /> : <X size={14} />}
                                {r.label}
                            </div>
                        ))}
                    </div>
                )}

                <div className="input-group">
                    <label>Confirm New Password</label>
                    <div className="input-wrapper">
                        <LockKeyhole size={18} className="input-icon" />
                        <input
                            type={showNew ? "text" : "password"}
                            required
                            value={form.confirm}
                            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                            placeholder="Re-enter new password"
                        />
                    </div>
                    {form.confirm && !passwordsMatch && (
                        <p className="pw-mismatch">Passwords do not match</p>
                    )}
                </div>

                {msg && (
                    <div className={isError ? "error-msg" : "muted-msg"}>
                        {isError ? (
                            <X size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                        ) : (
                            <Check size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                        )}
                        <span>{msg}</span>
                    </div>
                )}

                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? (
                        "Saving..."
                    ) : (
                        <>
                            <span>Change Password</span>
                            <ArrowRight size={17} className="btn-arrow" />
                        </>
                    )}
                </button>

                <Link to="/dashboard" className="back-link">
                    <ArrowLeft size={15} /> Back to Dashboard
                </Link>
            </form>
        </div>
    );
}