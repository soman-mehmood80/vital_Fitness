import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
    LockKeyhole,
    Eye,
    EyeOff,
    Check,
    X,
    Heart,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
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

export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [msg, setMsg] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    const rules = checks(password);
    const allPassed = rules.every((r) => r.pass);
    const passwordsMatch = !confirm || password === confirm;

    const submit = async (e) => {
        e.preventDefault();
        setMsg("");
        setIsError(false);

        if (!allPassed) {
            setIsError(true);
            setMsg("Password must meet all requirements.");
            return;
        }
        if (password !== confirm) {
            setIsError(true);
            setMsg("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const res = await API.post("/auth/reset-password", {
                token,
                password,
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

    if (!token) {
        return (
            <div className="auth-page">
                <div className="auth-cyber-grid" aria-hidden="true" />
                <div className="auth-theme-toggle">
                    <ThemeToggle />
                </div>

                <div className="auth-card auth-card--centered">
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

                    <div className="auth-eyebrow-pill" style={{ margin: "0 auto 14px" }}>
                        <span className="pulse-dot" />
                        <span>LINK EXPIRED</span>
                    </div>

                    <h1>
                        Invalid <span>Link</span>
                    </h1>

                    <div className="error-msg" style={{ textAlign: "left", marginTop: 12 }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                        <span>Invalid or expired reset link. Please request a new one.</span>
                    </div>

                    <Link to="/forgot-password" className="btn-submit" style={{ textDecoration: "none" }}>
                        <span>Request New Link</span>
                        <ArrowRight size={17} className="btn-arrow" />
                    </Link>

                    <Link to="/login" className="back-link">
                        <ArrowLeft size={15} /> Back to Login
                    </Link>
                </div>
            </div>
        );
    }

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
                    Reset <span>Password</span>
                </h1>
                <p className="auth-subtitle" style={{ textAlign: "center" }}>
                    Choose a strong new password to regain access to your account.
                </p>

                <div className="input-group">
                    <label>New Password</label>
                    <div className="input-wrapper">
                        <LockKeyhole size={18} className="input-icon" />
                        <input
                            type={showPw ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a strong password"
                        />
                        <button
                            type="button"
                            className="pw-toggle-btn"
                            onClick={() => setShowPw(!showPw)}
                            aria-label={showPw ? "Hide password" : "Show password"}
                        >
                            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="input-group">
                    <label>Confirm Password</label>
                    <div className="input-wrapper">
                        <LockKeyhole size={18} className="input-icon" />
                        <input
                            type={showPw ? "text" : "password"}
                            required
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Re-enter your password"
                        />
                    </div>
                    {confirm && !passwordsMatch && (
                        <p className="pw-mismatch">Passwords do not match</p>
                    )}
                </div>

                {password && (
                    <div className="password-rules">
                        {rules.map((r) => (
                            <div key={r.label} className={`rule-item ${r.pass ? "pass" : "fail"}`}>
                                {r.pass ? <Check size={14} /> : <X size={14} />}
                                {r.label}
                            </div>
                        ))}
                    </div>
                )}

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
                        "Updating..."
                    ) : (
                        <>
                            <span>Reset Password</span>
                            <ArrowRight size={17} className="btn-arrow" />
                        </>
                    )}
                </button>

                <Link to="/login" className="back-link">
                    <ArrowLeft size={15} /> Back to Login
                </Link>
            </form>
        </div>
    );
}