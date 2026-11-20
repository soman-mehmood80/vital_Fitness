import { Navigate, Outlet } from "react-router-dom";
import { isTokenValid, isAdmin } from "../utils/auth";

export default function AdminRoute({ children }) {
    if (!isTokenValid()) return <Navigate to="/login" replace />;
    if (!isAdmin()) return <Navigate to="/dashboard" replace />;
    return children ? children : <Outlet />;
}