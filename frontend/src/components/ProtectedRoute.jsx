import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isTokenValid } from "../utils/auth";

export default function ProtectedRoute({ children }) {
    const location = useLocation();
    const isAuthenticated = isTokenValid();

    // Agar user logged in hai aur woh Login/Signup page par aane ki koshish kare,
    // toh use direct Dashboard par bhej do (Landing page pe nahi).
    if (isAuthenticated && (location.pathname === "/login" || location.pathname === "/signup")) {
        return <Navigate to="/dashboard" replace />;
    }

    // Agar user logged in nahi hai, toh Login page par bhej do
    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Agar user logged in hai, toh jo page mangna hai wo render karo
    return children ? children : <Outlet />;
}