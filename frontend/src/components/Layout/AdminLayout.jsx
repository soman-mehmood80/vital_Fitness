import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Users, Dumbbell, Utensils, LogOut, Menu, X,
    ArrowLeft, LifeBuoy, Shield, ChevronRight, ChevronLeft, Heart
} from "lucide-react";
import { clearSession, getStoredUser } from "../../utils/auth";

export default function AdminLayout() {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const user = getStoredUser();

    const logout = () => {
        clearSession();
        navigate("/login");
    };

    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const menu = [
        { path: "/admin/dashboard", icon: <LayoutDashboard size={19} />, label: "Overview" },
        { path: "/admin/users", icon: <Users size={19} />, label: "Manage Users" },
        { path: "/admin/workouts", icon: <Dumbbell size={19} />, label: "Manage Workouts" },
        { path: "/admin/food-items", icon: <Utensils size={19} />, label: "Food Catalog" },
        { path: "/admin/support", icon: <LifeBuoy size={19} />, label: "Support & Feedback" },
    ];

    const currentPage =
        menu.find((item) => location.pathname.startsWith(item.path))?.label || "Overview";

    const initial = user?.name?.charAt(0)?.toUpperCase() || "A";

    return (
        <div className={`admin-layout ${isCollapsed ? "sidebar-collapsed" : ""}`}>
            {isOpen && (
                <div className="mobile-overlay" onClick={() => setIsOpen(false)} />
            )}

            {/* SIDEBAR */}
            <aside className={`sidebar ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    <Link to="/admin/dashboard" className="brand">
                        <div className="brand-badge">
                            <Heart size={18} fill="currentColor" />
                        </div>
                        <div className="brand-text">
                            <div className="brand-title">
                                Vital<span>Fit.</span>
                            </div>
                            <small>Admin Console</small>
                        </div>
                    </Link>

                    {/* Desktop Collapse Button */}
                    <button
                        type="button"
                        className="sidebar-collapse-btn"
                        onClick={() => setIsCollapsed((prev) => !prev)}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        type="button"
                        className="mobile-close-btn"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                <Link to="/dashboard" className="back-to-user" title="Return to User App">
                    <ArrowLeft size={16} />
                    <span className="nav-label">User View</span>
                </Link>

                <div className="sidebar-section-label">Navigation</div>

                <nav className="sidebar-menu" aria-label="Admin navigation">
                    {menu.map((item) => {
                        const active = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={isCollapsed ? item.label : undefined}
                                aria-current={active ? "page" : undefined}
                                className={`side-link ${active ? "active" : ""}`}
                            >
                                <span className="side-link-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                                {active && !isCollapsed && (
                                    <ChevronRight size={15} className="side-link-arrow" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <button
                        type="button"
                        className="logout-btn"
                        onClick={logout}
                        title={isCollapsed ? "Logout" : undefined}
                    >
                        <LogOut size={19} />
                        <span className="nav-label">Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <main className="admin-main">
                <header className="admin-topbar">
                    <div className="admin-topbar-left">
                        <button
                            type="button"
                            className="mobile-menu-btn"
                            onClick={() => setIsOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={22} />
                        </button>

                        <div className="admin-page-heading">
                            <div className="admin-breadcrumb">
                                <span>Admin</span>
                                <ChevronRight size={13} />
                                <span className="crumb-current">{currentPage}</span>
                            </div>
                            <h1 className="admin-topbar-title">{currentPage}</h1>
                        </div>
                    </div>

                    <div className="admin-topbar-right">
                        <div className="admin-status-pill" title="All services operational">
                            <span className="status-dot" />
                            <span>Live</span>
                        </div>

                        <div className="admin-user-chip">
                            {user?.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    alt={user?.name || "Admin"}
                                    className="avatar admin-avatar"
                                    style={{ objectFit: "cover" }}
                                />
                            ) : (
                                <div className="avatar admin-avatar">{initial}</div>
                            )}
                            <div className="admin-user-meta">
                                <strong>{user?.name || "Administrator"}</strong>
                                <small>
                                    <Shield size={11} /> Super Admin
                                </small>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="admin-page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}