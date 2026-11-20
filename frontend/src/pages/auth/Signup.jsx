import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    LockKeyhole,
    Eye,
    EyeOff,
    Check,
    X,
    ShieldCheck,
    Dumbbell,
    Heart,
    Zap,
    Droplets,
    Flame,
    Volume2,
    VolumeX,
    ArrowRight,
} from "lucide-react";
import API from "../../services/api";
import ThemeToggle from "../../components/Layout/ThemeToggle";

const checks = (pw) => [
    { label: "At least 8 characters", pass: pw.length >= 8 },
    { label: "Contains lowercase", pass: /[a-z]/.test(pw) },
    { label: "Contains uppercase", pass: /[A-Z]/.test(pw) },
    { label: "Contains a number", pass: /[0-9]/.test(pw) },
    { label: "Contains special char", pass: /[^A-Za-z0-9]/.test(pw) },
];

export default function Signup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [showPw, setShowPw] = useState(false);
    const [msg, setMsg] = useState("");
    const [success, setSuccess] = useState("");
    const [showVerifyNotice, setShowVerifyNotice] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    // Showcase Video & 3D Tilt State
    const [videoMuted, setVideoMuted] = useState(true);
    const [showcaseTilt, setShowcaseTilt] = useState({ rx: 0, ry: 0 });
    const videoRef = useRef(null);

    const rules = checks(form.password);
    const allPassed = rules.every((r) => r.pass);
    const passwordsMatch = !form.confirmPassword || form.password === form.confirmPassword;

    const toggleVideoSound = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !videoMuted;
        setVideoMuted(!videoMuted);
    };

    const handleShowcaseMove = (e) => {
        if (window.innerWidth < 1024) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setShowcaseTilt({ rx: -y * 8, ry: x * 10 });
    };

    const submit = async (e) => {
        e.preventDefault();
        setMsg("");
        setSuccess("");

        if (!allPassed) {
            setMsg("Please meet all password requirements.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setMsg("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const res = await API.post("/auth/signup", {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
            });
            setSuccess(res.data.message);
            setShowVerifyNotice(true);
        } catch (err) {
            setMsg(err.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    const resend = async () => {
        setResending(true);
        setMsg("");
        try {
            const res = await API.post("/auth/resend-verification", {
                email: form.email.trim(),
            });
            setSuccess(res.data.message);
        } catch (err) {
            setMsg(err.response?.data?.message || "Could not resend email");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="auth-container-split">
            <div className="auth-theme-toggle">
                <ThemeToggle />
            </div>

            {/* Left Side: Animated Glass Signup Form */}
            <div className="auth-form-side">
                <div className="auth-cyber-grid" aria-hidden="true" />

                <form className="auth-card-premium" onSubmit={submit}>
                    <Link to="/" className="auth-brand-link">
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

                    <div className="auth-eyebrow-pill">
                        <span className="pulse-dot" />
                        <span>START YOUR JOURNEY</span>
                    </div>

                    <h1>
                        Create <span>Account</span>
                    </h1>
                    <p className="auth-subtitle">
                        Set up your free athlete profile and unlock live 3D telemetry.
                    </p>

                    <div className="input-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <LockKeyhole size={18} className="input-icon" />
                            <input
                                type={showPw ? "text" : "password"}
                                required
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                placeholder="Re-enter your password"
                            />
                        </div>
                        {form.confirmPassword && !passwordsMatch && (
                            <p className="pw-mismatch">Passwords do not match</p>
                        )}
                    </div>

                    {form.password && (
                        <div className="password-rules">
                            {rules.map((r) => (
                                <div key={r.label} className={`rule-item ${r.pass ? "pass" : "fail"}`}>
                                    {r.pass ? <Check size={14} /> : <X size={14} />} {r.label}
                                </div>
                            ))}
                        </div>
                    )}

                    {msg && (
                        <div className="error-msg">
                            <X size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                            <span>{msg}</span>
                        </div>
                    )}

                    {success && (
                        <div className="muted-msg">
                            <Check size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                            <span>{success}</span>
                        </div>
                    )}

                    {showVerifyNotice && (
                        <div className="verify-notice">
                            <div className="verify-notice-icon">
                                <Mail size={19} />
                            </div>
                            <div>
                                <strong>Check your email</strong>
                                <p>
                                    We sent a verification link to <b>{form.email}</b>. Click it to
                                    activate your account.
                                </p>
                                <Link to="/login" className="link-primary">
                                    Go to Login <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    )}

                    {success && (
                        <button
                            type="button"
                            className="btn-verify"
                            onClick={resend}
                            disabled={resending}
                        >
                            {resending ? "Sending..." : "Resend Verification Email"}
                        </button>
                    )}

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? (
                            "Creating Account..."
                        ) : (
                            <>
                                <span>Sign Up</span>
                                <ArrowRight size={17} className="btn-arrow" />
                            </>
                        )}
                    </button>

                    <div className="auth-links" style={{ justifyContent: "center" }}>
                        <span>
                            Already have an account? <Link to="/login">Sign In</Link>
                        </span>
                    </div>
                </form>
            </div>

            {/* Right Side: Live 3D Workout Video Showcase */}
            <div
                className="auth-image-side"
                onMouseMove={handleShowcaseMove}
                onMouseLeave={() => setShowcaseTilt({ rx: 0, ry: 0 })}
            >
                <video
                    ref={videoRef}
                    className="auth-bg-video"
                    autoPlay
                    muted={videoMuted}
                    loop
                    playsInline
                    poster="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop"
                >
                    <source
                        src="https://videos.pexels.com/video-files/8471300/8471300-uhd_2160_3840_25fps.mp4"
                        type="video/mp4"
                    />
                </video>

                <div className="auth-image-overlay">
                    <div className="auth-showcase-top">
                        <span className="auth-live-pill">
                            <span className="pulse-dot" style={{ background: "#fff" }} />
                            HIIT &amp; PEAK ZONE 5
                        </span>
                        <button
                            type="button"
                            className="auth-sound-btn"
                            onClick={toggleVideoSound}
                            aria-label="Toggle showcase video sound"
                        >
                            {videoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                    </div>

                    {/* Floating 3D Stat Pills */}
                    <div className="auth-floating-stats">
                        <div className="auth-float-pill pill-1">
                            <div className="float-pill-icon red">
                                <Flame size={16} />
                            </div>
                            <div>
                                <strong>740 kcal/hr</strong>
                                <span>Peak HIIT Burn</span>
                            </div>
                        </div>
                        <div className="auth-float-pill pill-2">
                            <div className="float-pill-icon blue">
                                <Droplets size={16} />
                            </div>
                            <div>
                                <strong>2.5L / 3L</strong>
                                <span>Hydration Sync</span>
                            </div>
                        </div>
                    </div>

                    {/* 3D Tilting Showcase Content Card */}
                    <div
                        className="auth-image-content"
                        style={{
                            transform: `rotateX(${showcaseTilt.rx}deg) rotateY(${showcaseTilt.ry}deg)`,
                        }}
                    >
                        <span className="auth-showcase-kicker">Free Forever Starter Plan</span>
                        <h2>
                            Start Your <span>Transformation.</span>
                        </h2>
                        <p>
                            Everything you need to track workouts, nutrition, hydration, and AI
                            coaching insights in one unified dashboard.
                        </p>

                        <div className="auth-features">
                            <div className="feature-item">
                                <div className="feature-icon red">
                                    <Dumbbell size={18} />
                                </div>
                                <span>Custom Workout Splits &amp; PR Engine</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon purple">
                                    <Zap size={18} />
                                </div>
                                <span>AI Recovery &amp; Readiness Insights</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon green">
                                    <ShieldCheck size={18} />
                                </div>
                                <span>100% Secure, Encrypted &amp; Private</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}