
export const saveSession = (token, user, rememberMe) => {
    clearSession();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("token", token);
    storage.setItem("user", JSON.stringify(user));
};

export const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
};

export const getToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
};

export const getStoredUser = () => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    try {
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const updateStoredUser = (user) => {
    const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(user));
};

export const isTokenValid = () => {
    const token = getToken();
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
};

export const isAdmin = () => {
    const user = getStoredUser();
    return user?.role === "admin";
};