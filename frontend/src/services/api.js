import axios from "axios";
import { getToken } from "../utils/auth";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const API = axios.create({
    baseURL: BASE,
    timeout: 30000
});

// REQUEST
API.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
    }
    return config;
});

// RESPONSE
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            error.isNetworkError = true;
            error.userMessage = "Network error. Please check your internet connection.";
            return Promise.reject(error);
        }

        const status = error.response.status;
        const message = error.response.data?.message || "";
        const url = error.config?.url || "";

        const publicAuthRoutes = [
            "/auth/login", "/auth/signup", "/auth/forgot-password",
            "/auth/reset-password", "/auth/verify-email", "/auth/resend-verification"
        ];
        const isPublicRoute = publicAuthRoutes.some((r) => url.includes(r));

        // 401
        if (status === 401 && !isPublicRoute) {
            localStorage.clear();
            sessionStorage.clear();
            if (!window.location.pathname.startsWith("/login")) {
                const reason = /session expired/i.test(message) ? "session_expired" : "auth_required";
                window.location.href = `/login?reason=${reason}`;
            }
        }

        // 403 — Email not verified
        if (status === 403 && /verify your email/i.test(message)) {
            localStorage.clear();
            sessionStorage.clear();
            if (!window.location.pathname.startsWith("/login")) {
                window.location.href = `/login?reason=email_not_verified`;
            }
        }

        // 423 — Account locked
        if (status === 423) {
            error.userMessage = message || "Account temporarily locked.";
        }

        // 429 — Rate limit
        if (status === 429) {
            error.userMessage = message || "Too many requests. Try again later.";
        }

        return Promise.reject(error);
    }
);

export default API;