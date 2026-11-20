import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Heart, ArrowRight } from "lucide-react";
import API from "../../services/api";
import ThemeToggle from "../../components/Layout/ThemeToggle";

export default function VerifyEmail() {
    const [params] = useSearchParams();
    const fired = useRef(false);
    const [msg, setMsg] = useState("Verifying your email...");
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (fired.current) return;
        fired.current = true;

        const token = params.get("token");
        if (!token) {
            setMsg("Invalid verification link. No token found.");
            setError(true);
            return;
        }

        API.post("/auth/verify-email", { token })
            .then((res) => {
                setMsg(res.data.message);
                setSuccess(true);
            })
            .catch((err) => {
                setMsg(err.response?.data?.message || "Verification failed");
                setError(true);
            });
    }, [params]);

    return (
        <div className="auth-page">
            <div className="auth-cyber-grid" aria-hidden="true" />
            <div className="auth-theme-toggle">
                <ThemeToggle />
            </div>

            <div className="auth-card auth-card--centered">
                <Link to="/" className="auth-brand-link" style={{ margin: "0 auto 18px" }}>
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

                <div
                    className={`verify-status-ring ${
                        success ? "success" : error ? "error" : "loading"
                    }`}
                >
                    {!success && !error && (
                        <Loader2
                            size={44}
                            className="spin"
                            style={{ color: "var(--accent-primary, #ef4444)" }}
                        />
                    )}
                    {success && <CheckCircle2 size={46} style={{ color: "#22c55e" }} />}
                    {error && <XCircle size={46} style={{ color: "#ef4444" }} />}
                </div>

                <div className="auth-eyebrow-pill" style={{ margin: "0 auto 12px" }}>
                    <span className="pulse-dot" />
                    <span>EMAIL VERIFICATION</span>
                </div>

                <h1>
                    {success ? (
                        <>
                            Email <span>Verified!</span>
                        </>
                    ) : error ? (
                        <>
                            Verification <span>Failed</span>
                        </>
                    ) : (
                        <>
                            Verifying <span>Account...</span>
                        </>
                    )}
                </h1>

                <div
                    className={success ? "muted-msg" : error ? "error-msg" : ""}
                    style={{
                        justifyContent: "center",
                        textAlign: "center",
                        marginTop: 14,
                        color: !success && !error ? "var(--text-muted, #a1a1aa)" : undefined,
                        fontSize: 14,
                    }}
                >
                    <span>{msg}</span>
                </div>

                {success && (
                    <Link
                        to="/login"
                        className="btn-submit"
                        style={{ textDecoration: "none", marginTop: 16 }}
                    >
                        <span>Continue to Login</span>
                        <ArrowRight size={17} className="btn-arrow" />
                    </Link>
                )}

                {error && (
                    <Link to="/login" className="back-link" style={{ marginTop: 18 }}>
                        Go to Login &amp; Resend Verification <ArrowRight size={15} />
                    </Link>
                )}
            </div>
        </div>
    );
}