import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    Mail,
    ArrowLeft,
    ArrowRight,
    Check,
    X,
    Key,
    ShieldCheck,
    Heart,
    Volume2,
    VolumeX,
    Activity,
} from "lucide-react";
import API from "../../services/api";
import ThemeToggle from "../../components/Layout/ThemeToggle";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    // Showcase Video & 3D Tilt State
    const [videoMuted, setVideoMuted] = useState(true);
    const [showcaseTilt, setShowcaseTilt] = useState({ rx: 0, ry: 0 });
    const videoRef = useRef(null);

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
        setIsError(false);

        try {
            const res = await API.post("/auth/forgot-password", { email: email.trim() });
            setIsError(false);
            setMsg(res.data.message);
        } catch (err) {
            setIsError(true);
            setMsg(err.response?.data?.message || "Failed to send reset link");
        } finally {
            setLoading(false);
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
                        <span>ACCOUNT RECOVERY</span>
                    </div>

                    <h1>
                        Forgot <span>Password?</span>
                    </h1>
                    <p className="auth-subtitle">
                        No worries. Enter your registered email and we&apos;ll send a secure link to
                        reset your password.
                    </p>

                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                            />
                        </div>
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
                            "Sending Link..."
                        ) : (
                            <>
                                <Key size={17} />
                                <span>Send Reset Link</span>
                                <ArrowRight size={17} className="btn-arrow" />
                            </>
                        )}
                    </button>

                    <div className="auth-links" style={{ justifyContent: "center" }}>
                        <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </form>
            </div>

            {/* Right Side: Live Endurance Workout Video Showcase */}
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
                    poster="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1200&auto=format&fit=crop"
                >
                    <source
                        src="https://assets.mixkit.co/videos/preview/mixkit-woman-jogging-across-a-narrow-footbridge-40768-large.mp4"
                        type="video/mp4"
                    />
                </video>

                <div className="auth-image-overlay">
                    <div className="auth-showcase-top">
                        <span className="auth-live-pill">
                            <span className="pulse-dot" style={{ background: "#fff" }} />
                            SECURE RECOVERY
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

                    <div className="auth-floating-stats">
                        <div className="auth-float-pill pill-1">
                            <div className="float-pill-icon amber">
                                <Key size={16} />
                            </div>
                            <div>
                                <strong>Instant Token</strong>
                                <span>15-Min Secure Expiry</span>
                            </div>
                        </div>
                        <div className="auth-float-pill pill-2">
                            <div className="float-pill-icon green">
                                <Activity size={16} />
                            </div>
                            <div>
                                <strong>Streak Saved</strong>
                                <span>Data Stays Intact</span>
                            </div>
                        </div>
                    </div>

                    <div
                        className="auth-image-content"
                        style={{
                            transform: `rotateX(${showcaseTilt.rx}deg) rotateY(${showcaseTilt.ry}deg)`,
                        }}
                    >
                        <span className="auth-showcase-kicker">VitalFit Identity Shield</span>
                        <h2>
                            We&apos;ve Got <span>Your Back.</span>
                        </h2>
                        <p>
                            Account recovery is fast, encrypted, and hassle-free so you can get
                            right back to crushing your training streak.
                        </p>

                        <div className="auth-features">
                            <div className="feature-item">
                                <div className="feature-icon amber">
                                    <Key size={18} />
                                </div>
                                <span>One-Click Encrypted Password Reset</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon green">
                                    <ShieldCheck size={18} />
                                </div>
                                <span>Your Workouts &amp; PR History Stay Safe</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}