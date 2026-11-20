import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Clock, Dumbbell, Flame, Loader2, PlayCircle, AlertCircle } from "lucide-react";
import API from "../../services/api";

const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80",
];

export default function WorkoutLibrary() {
    const [workouts, setWorkouts] = useState([]);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    const load = async (pageNum = 1) => {
        try {
            setLoading(true);
            const res = await API.get("/api/workouts", {
                params: { page: pageNum, limit: 12 }
            });
            setWorkouts(res.data.workouts || []);
            setPagination({
                page: res.data.page || 1,
                totalPages: res.data.totalPages || 1,
                total: res.data.total || 0
            });
        } catch (err) {
            console.error(err);
            setError("Failed to load workouts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(1); }, []);

    const categories = ["All", ...new Set(workouts.map(w => w.category))];

    const filtered = workouts.filter(w => {
        const matchesSearch = w.title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === "All" || w.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary)" }} />
            </div>
        );
    }

    return (
        <div className="workouts-wrapper">
            <div className="page-header-clean">
                <p className="eyebrow">EXERCISE LIBRARY</p>
                <h1>Find Your Next Workout</h1>
                <p>Browse through our collection of expert-designed routines.</p>
            </div>

            {error && (
                <div className="error-msg">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Filters */}
            <div className="filters-wrapper">
                <div className="search-box-premium">
                    <Search size={20} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Search workouts by name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="category-pills">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`category-pill ${activeCategory === cat ? "active" : ""}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 40 }}>
                    <Search size={48} className="empty-icon" />
                    <h3>No workouts found</h3>
                    <p>Try adjusting your search or category filter.</p>
                </div>
            ) : (
                <div className="workout-grid">
                    {filtered.map((w, idx) => {
                        const imageUrl = w.thumbnail || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
                        return (
                            <div key={w._id} className="premium-workout-card">
                                <div className="workout-card-image">
                                    <img src={imageUrl} alt={w.title} />
                                    <div className="workout-badge">{w.category}</div>
                                    <div className="workout-play-overlay">
                                        <PlayCircle size={48} color="#fff" />
                                    </div>
                                </div>

                                <div className="workout-card-content">
                                    <div className="workout-meta-top">
                                        <span className="difficulty-badge">{w.difficulty}</span>
                                        <span className="calorie-badge">
                                            <Flame size={14} /> {w.caloriesEstimate || 200} kcal
                                        </span>
                                    </div>

                                    <h3 className="workout-card-title">{w.title}</h3>
                                    <p className="workout-card-desc">{w.description?.slice(0, 70)}...</p>

                                    <div className="workout-stats-row">
                                        <span><Clock size={16} /> {w.duration} min</span>
                                        <span><Dumbbell size={16} /> {w.difficulty}</span>
                                    </div>

                                    <Link to={`/workouts/${w._id}`} className="btn-workout-start">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button
                        disabled={pagination.page === 1}
                        onClick={() => load(pagination.page - 1)}
                    >
                        ← Previous
                    </button>
                    <span>Page <strong>{pagination.page}</strong> of {pagination.totalPages}</span>
                    <button
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => load(pagination.page + 1)}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}