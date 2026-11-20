import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    Heart, LogOut, Bell, CheckCircle2, Droplets,
    Dumbbell, Settings, Sparkles, Shield, Trash2
} from "lucide-react";
import { clearSession, getStoredUser } from "../../utils/auth";
import API from "../../services/api";

export default function UserLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getStoredUser();

    const logout = () => {
        clearSession();
        navigate("/login");
    };

    const [isScrolled, setIsScrolled] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const notifRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await API.get("/api/notifications");
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (error) {
            console.error("Failed to load notifications", error);
        }
    };

    // ✅ Empty array [] taake infinite loop na bane
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []); 

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 12);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // ✅ Jab route change ho toh dropdown band karo
    useEffect(() => {
        setShowNotif(false);
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [location.pathname]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotif(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAllRead = async () => {
        try {
            await API.put("/api/notifications/read-all");
            setUnreadCount(0);
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error(error);
        }
    };

    const deleteNotif = async (e, id) => {
        e.stopPropagation();
        try {
            await API.delete(`/api/notifications/${id}`);
            setNotifications(notifications.filter(n => n._id !== id));
            if (unreadCount > 0) setUnreadCount(prev => prev - 1);
        } catch (error) {
            console.error(error);
        }
    };

    const getNotifIcon = (type) => {
        switch(type) {
            case 'water': return { icon: Droplets, color: '#38bdf8' };
            case 'workout': return { icon: Dumbbell, color: '#06b6d4' };
            case 'sleep': return { icon: CheckCircle2, color: '#a855f7' };
            default: return { icon: Bell, color: '#f59e0b' };
        }
    };

    const mainNav = [
        { path: "/dashboard", label: "Dashboard" },
        { path: "/nutrition", label: "Nutrition" },
        { path: "/workouts", label: "Workouts" },
        { path: "/progress", label: "Progress" },
        { path: "/water", label: "Water" },
        { path: "/sleep", label: "Sleep" },
        { path: "/steps", label: "Steps" },
        { path: "/ai-coach", label: "AI Coach", isAI: true },
    ];

    const initial = user?.name?.charAt(0)?.toUpperCase() || "U";
    const isAdmin = user?.role?.toLowerCase() === "admin";

    return (
        <div className="layout-container new-topbar-layout">
            <header className={`topbar-floating ${isScrolled ? "scrolled" : ""}`}>
                <Link to="/dashboard" className="topbar-brand">
                    <span className="brand-heart-badge">
                        <Heart size={16} fill="currentColor" />
                    </span>
                    Vital<span>Fit.</span>
                </Link>

                <nav className="topbar-nav">
                    {mainNav.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname.startsWith(item.path) ? "active" : ""} ${item.isAI ? "nav-link-ai" : ""}`}
                        >
                            {item.isAI && <Sparkles size={13} />}
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="topbar-actions">
                    {isAdmin && (
                        <Link to="/admin/dashboard" className="icon-btn-topbar">
                            <Shield size={17} />
                        </Link>
                    )}

                    <div className="notification-wrapper" ref={notifRef}>
                        <button
                            type="button"
                            className={`icon-btn-topbar ${showNotif ? "active" : ""}`}
                            onClick={() => setShowNotif((prev) => !prev)}
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                        </button>

                        {showNotif && (
                            <div className="notif-dropdown">
                                <div className="notif-header">
                                    <h4>Notifications</h4>
                                    {unreadCount > 0 && (
                                        <button type="button" onClick={markAllRead}>Mark all read</button>
                                    )}
                                </div>
                                <div className="notif-list">
                                    {notifications.length === 0 ? (
                                        <div className="notif-empty">
                                            <CheckCircle2 size={32} />
                                            <p>You're all caught up!</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => {
                                            const { icon: Icon, color } = getNotifIcon(n.type);
                                            return (
                                                <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                                                    <div className="notif-icon" style={{ background: `${color}22`, color: color }}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="notif-content">
                                                        <strong>{n.title}</strong>
                                                        <p>{n.message}</p>
                                                    </div>
                                                    <button className="notif-delete-btn" onClick={(e) => deleteNotif(e, n._id)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <Link to="/settings" className="icon-btn-topbar"><Settings size={17} /></Link>

                    <Link to="/profile" className="user-profile-pill icon-only">
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt="Profile" className="avatar" style={{ objectFit: "cover" }} />
                        ) : (
                            <div className="avatar">{initial}</div>
                        )}
                    </Link>

                    <button type="button" className="icon-btn-topbar logout-icon" onClick={logout}>
                        <LogOut size={17} />
                    </button>
                </div>
            </header>

            <nav className="mobile-nav-scroll">
                {mainNav.map((item) => (
                    <Link key={item.path} to={item.path} className={`mobile-nav-link ${location.pathname.startsWith(item.path) ? "active" : ""}`}>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <main className="main-content-full">
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}