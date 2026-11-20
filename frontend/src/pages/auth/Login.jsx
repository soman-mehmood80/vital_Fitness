import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    LockKeyhole,
    Mail,
    Eye,
    EyeOff,
    AlertCircle,
    Dumbbell,
    Flame,
    ShieldCheck,
    Heart,
    Activity,
    Volume2,
    VolumeX,
    ArrowRight,
} from "lucide-react";
import API from "../../services/api";
import { saveSession } from "../../utils/auth";
import ThemeToggle from "../../components/Layout/ThemeToggle";

export default function Login() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [form, setForm] = useState({ email: "", password: "" });
    const [showPw, setShowPw] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [msg, setMsg] = useState("");
    const [needsVerify, setNeedsVerify] = useState(false);
    const [resending, setResending] = useState(false);
    const [loading, setLoading] = useState(false);

    // Showcase Video & 3D Tilt State
    const [videoMuted, setVideoMuted] = useState(true);
    const [showcaseTilt, setShowcaseTilt] = useState({ rx: 0, ry: 0 });
    const videoRef = useRef(null);

    useEffect(() => {
        const reason = params.get("reason");
        if (reason === "session_expired") {
            setMsg("Your session expired. Please login again.");
        } else if (reason === "auth_required") {
            setMsg("Please login to continue.");
        } else if (reason === "email_not_verified") {
            setMsg("Please verify your email before logging in.");
            setNeedsVerify(true);
        }
    }, [params]);

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
        setLoading(true);
        setMsg("");
        setNeedsVerify(false);
        try {
            const res = await API.post("/auth/login", {
                email: form.email.trim(),
                password: form.password,
            });
            saveSession(res.data.token, res.data.user, rememberMe);
            navigate(
                res.data.user.role === "admin" ? "/admin/dashboard" : "/dashboard",
                { replace: true }
            );
        } catch (err) {
            const status = err.response?.status;
            if (status === 403) {
                setNeedsVerify(true);
                setMsg(err.response?.data?.message || "Please verify your email.");
            } else if (status === 423) {
                setMsg("Account temporarily locked. Try again in 15 minutes.");
            } else if (status === 429) {
                setMsg("Too many attempts. Please wait 15 minutes.");
            } else {
                setMsg(err.response?.data?.message || "Login failed");
            }
        } finally {
            setLoading(false);
        }
    };

    const resendVerification = async () => {
        setResending(true);
        setMsg("");
        try {
            const res = await API.post("/auth/resend-verification", {
                email: form.email.trim(),
            });
            setMsg(res.data.message);
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

            {/* Left Side: Animated Glass Form */}
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
                        <span>WELCOME BACK</span>
                    </div>

                    <h1>
                        Sign <span>In</span>
                    </h1>
                    <p className="auth-subtitle">
                        Enter your credentials to sync with your 3D telemetry dashboard.
                    </p>

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
                                placeholder="Enter your password"
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

                    <label className="remember-me">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span>Remember me on this device</span>
                    </label>

                    {msg && (
                        <div className={needsVerify ? "muted-msg" : "error-msg"}>
                            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                            <span>{msg}</span>
                        </div>
                    )}

                    {needsVerify && (
                        <button
                            type="button"
                            className="btn-verify"
                            onClick={resendVerification}
                            disabled={resending}
                        >
                            {resending ? "Sending..." : "Resend Verification Email"}
                        </button>
                    )}

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? (
                            "Signing in..."
                        ) : (
                            <>
                                <LockKeyhole size={18} />
                                <span>Sign In</span>
                                <ArrowRight size={17} className="btn-arrow" />
                            </>
                        )}
                    </button>

                    <div className="auth-links">
                        <Link to="/forgot-password">Forgot password?</Link>
                        <span>
                            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
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
                    poster="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop"
                >
                    <source
                        src="https://videos.pexels.com/video-files/5319856/5319856-uhd_2160_3840_25fps.mp4"
                        type="video/mp4"
                    />
                </video>

                <div className="auth-image-overlay">
                    <div className="auth-showcase-top">
                        <span className="auth-live-pill">
                            <span className="pulse-dot" style={{ background: "#fff" }} />
                            LIVE 4K TELEMETRY
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
                                <strong>520 kcal/hr</strong>
                                <span>Active Output</span>
                            </div>
                        </div>
                        <div className="auth-float-pill pill-2">
                            <div className="float-pill-icon green">
                                <Activity size={16} />
                            </div>
                            <div>
                                <strong>94% Score</strong>
                                <span>AI Recovery</span>
                            </div>
                        </div>
                    </div>

                    {/* 3D Tilting Content Card */}
                    <div
                        className="auth-image-content"
                        style={{
                            transform: `rotateX(${showcaseTilt.rx}deg) rotateY(${showcaseTilt.ry}deg)`,
                        }}
                    >
                        <span className="auth-showcase-kicker">VitalFit Biometric Engine</span>
                        <h2>
                            Push Your <span>Limits.</span>
                        </h2>
                        <p>
                            Join 10,000+ athletes tracking workouts, macros, hydration, and AI
                            recovery curves in real time.
                        </p>

                        <div className="auth-features">
                            <div className="feature-item">
                                <div className="feature-icon red">
                                    <Flame size={18} />
                                </div>
                                <span>Track Calories, Macros &amp; Burn Velocity</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon blue">
                                    <Dumbbell size={18} />
                                </div>
                                <span>Smart Strength Splits &amp; PR Tracking</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon green">
                                    <ShieldCheck size={18} />
                                </div>
                                <span>100% Encrypted &amp; Wearable Sync Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}