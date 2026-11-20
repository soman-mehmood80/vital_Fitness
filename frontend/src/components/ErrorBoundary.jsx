import { Component } from "react";

export default class ErrorBoundary extends Component {
    state = { hasError: false, error: null };
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, info) {
        console.error("App crash:", error, info);
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0a0a0a",
                    color: "#fff",
                    padding: 20
                }}>
                    <div style={{ textAlign: "center", maxWidth: 400 }}>
                        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Something went wrong</h1>
                        <p style={{ color: "#a3a3a3", marginBottom: 24, fontSize: 14 }}>
                            {this.state.error?.message || "An unexpected error occurred"}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: "12px 24px",
                                background: "#ef4444",
                                border: "none",
                                borderRadius: 10,
                                color: "#fff",
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: "pointer"
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}