import { Link } from "react-router-dom";
import { Home, LogIn, Heart } from "lucide-react";
import ThemeToggle from "../../components/Layout/ThemeToggle";

export default function NotFound() {
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

                <div className="auth-eyebrow-pill" style={{ margin: "0 auto 12px" }}>
                    <span className="pulse-dot" />
                    <span>SIGNAL LOST</span>
                </div>

                <div className="not-found-code">404</div>

                <h1 style={{ marginBottom: 8 }}>
                    Page Not <span>Found</span>
                </h1>
                <p className="auth-subtitle" style={{ marginBottom: 24 }}>
                    The route you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>

                <div className="not-found-actions">
                    <Link to="/dashboard" className="primary-btn">
                        <Home size={18} /> Go Home
                    </Link>
                    <Link to="/login" className="btn-secondary">
                        <LogIn size={18} /> Login
                    </Link>
                </div>
            </div>
        </div>
    );
}