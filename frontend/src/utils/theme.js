// ============================================
// VITALFIT — THEME UTILITIES
// ============================================

const THEME_KEY = "vitalfit-theme";

export function getInitialTheme() {
    if (typeof window === "undefined") return "dark";

    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;

    // Respect OS preference
    if (window.matchMedia?.("(prefers-color-scheme: light)")?.matches) {
        return "light";
    }
    return "dark";
}

export function applyTheme(theme) {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
}

export function getCurrentTheme() {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.getAttribute("data-theme") || "dark";
}

export function toggleTheme() {
    const next = getCurrentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    return next;
}