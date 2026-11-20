import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft, Image as ImageIcon, Type, AlignLeft, PlayCircle, Loader2, X, AlertCircle
} from "lucide-react";
import API from "../../services/api";

export default function AddWorkout() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        title: "", description: "", category: "Strength", difficulty: "Beginner",
        duration: 30, caloriesEstimate: 200, videoType: "none", videoUrl: "",
        targetMuscles: "", instructions: "", safetyGuidance: "", isPublished: true
    });

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be under 5MB");
            return;
        }
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 100 * 1024 * 1024) {
            setError("Video must be under 100MB");
            return;
        }
        setVideo(file);
        setForm({ ...form, videoType: "cloudinary" });
    };

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Validation
        if (form.videoType === "youtube" && !form.videoUrl.trim()) {
            setError("YouTube URL required");
            setLoading(false);
            return;
        }
        if (form.videoType === "cloudinary" && !video) {
            setError("Video file required");
            setLoading(false);
            return;
        }

        const fd = new FormData();
        Object.keys(form).forEach(k => {
            if (k === "instructions") {
                const arr = form[k].split("\n").map(s => s.trim()).filter(Boolean);
                arr.forEach((inst) => fd.append("instructions[]", inst));
            } else if (k === "targetMuscles") {
                const arr = form[k].split(",").map(s => s.trim()).filter(Boolean);
                arr.forEach((m) => fd.append("targetMuscles[]", m));
            } else {
                fd.append(k, form[k]);
            }
        });

        if (image) fd.append("image", image);
        if (video) fd.append("video", video);

        try {
            await API.post("/api/workouts", fd);
            navigate("/admin/workouts");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create workout");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900, margin: "0 auto" }}>
            <div>
                <Link to="/admin/workouts" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    color: "var(--text-muted)", fontSize: 13, fontWeight: 600, marginBottom: 12,
                    textDecoration: "none"
                }}>
                    <ArrowLeft size={16} /> Back to Workouts
                </Link>
                <p className="eyebrow">CONTENT MANAGEMENT</p>
                <h1>Create New Workout</h1>
            </div>

            {error && (
                <div className="error-msg">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={submit} className="panel" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Cover Image */}
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-main)" }}>
                        Cover Image
                    </label>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: "100%", height: 220, borderRadius: 16,
                            border: "2px dashed var(--border-default)",
                            background: "var(--bg-elevated)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", overflow: "hidden", position: "relative"
                        }}
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                                <ImageIcon size={40} style={{ opacity: 0.5, margin: "0 auto 12px auto" }} />
                                <p style={{ margin: 0, fontSize: 14 }}>Click to upload image</p>
                                <p style={{ margin: "4px 0 0 0", fontSize: 12, opacity: 0.7 }}>JPG, PNG, WEBP • Max 5MB</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: "none" }} />
                    </div>
                </div>

                {/* Title */}
                <div className="input-group">
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Type size={14} /> Title *
                    </label>
                    <input
                        type="text" required value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        className="premium-input"
                        placeholder="e.g. Full Body HIIT"
                    />
                </div>

                {/* Description */}
                <div className="input-group">
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <AlignLeft size={14} /> Description *
                    </label>
                    <textarea
                        required rows="3" value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        className="premium-input"
                        placeholder="Describe the workout..."
                    />
                </div>

                {/* Category / Duration / Calories */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    <div className="input-group">
                        <label>Category</label>
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="premium-input">
                            <option>Strength</option>
                            <option>Cardio</option>
                            <option>Yoga</option>
                            <option>Flexibility</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Duration (min) *</label>
                        <input type="number" required min="1" max="600" value={form.duration}
                            onChange={e => setForm({ ...form, duration: +e.target.value })}
                            className="premium-input" />
                    </div>
                    <div className="input-group">
                        <label>Calories (kcal)</label>
                        <input type="number" min="0" value={form.caloriesEstimate}
                            onChange={e => setForm({ ...form, caloriesEstimate: +e.target.value })}
                            className="premium-input" />
                    </div>
                </div>

                {/* Difficulty */}
                <div className="input-group">
                    <label>Difficulty</label>
                    <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="premium-input">
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                    </select>
                </div>

                {/* Target Muscles */}
                <div className="input-group">
                    <label>Target Muscles (comma separated)</label>
                    <input type="text" value={form.targetMuscles}
                        onChange={e => setForm({ ...form, targetMuscles: e.target.value })}
                        className="premium-input"
                        placeholder="e.g. Chest, Triceps, Shoulders" />
                </div>

                {/* Instructions */}
                <div className="input-group">
                    <label>Instructions (one per line)</label>
                    <textarea rows="4" value={form.instructions}
                        onChange={e => setForm({ ...form, instructions: e.target.value })}
                        className="premium-input"
                        placeholder="Step 1: Warm up&#10;Step 2: Do 3 sets of push-ups&#10;Step 3: ..." />
                </div>

                {/* Safety */}
                <div className="input-group">
                    <label>Safety Guidance</label>
                    <textarea rows="2" value={form.safetyGuidance}
                        onChange={e => setForm({ ...form, safetyGuidance: e.target.value })}
                        className="premium-input"
                        placeholder="Any safety notes..." />
                </div>

                {/* Video Section */}
                <div style={{
                    padding: 20, background: "var(--bg-elevated)",
                    borderRadius: 12, border: "1px solid var(--border-subtle)"
                }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text-main)" }}>
                        <PlayCircle size={18} color="var(--accent-primary)" /> Video Source
                    </label>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div className="input-group">
                            <label>Option 1: YouTube URL</label>
                            <input
                                type="url"
                                placeholder="https://youtube.com/watch?v=..."
                                value={form.videoType === "youtube" ? form.videoUrl : ""}
                                onChange={e => setForm({ ...form, videoType: "youtube", videoUrl: e.target.value })}
                                className="premium-input"
                            />
                        </div>
                        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>— OR —</div>
                        <div className="input-group">
                            <label>Option 2: Upload Video</label>
                            <input
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime"
                                onChange={handleVideoChange}
                                className="premium-input"
                                style={{ cursor: "pointer", padding: 10 }}
                            />
                            {video && (
                                <p style={{ fontSize: 12, color: "#22c55e", margin: "4px 0 0 0" }}>
                                    ✓ {video.name} selected
                                </p>
                            )}
                        </div>
                        {form.videoType !== "none" && (
                            <button
                                type="button"
                                onClick={() => {
                                    setForm({ ...form, videoType: "none", videoUrl: "" });
                                    setVideo(null);
                                }}
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: "8px 12px" }}
                            >
                                <X size={14} /> Remove Video
                            </button>
                        )}
                    </div>
                </div>

                {/* Publish Toggle */}
                <div className="input-group">
                    <label>Status</label>
                    <select
                        value={String(form.isPublished)}
                        onChange={e => setForm({ ...form, isPublished: e.target.value === "true" })}
                        className="premium-input"
                    >
                        <option value="true">Published (visible to users)</option>
                        <option value="false">Draft (hidden)</option>
                    </select>
                </div>

                <button className="btn-submit" type="submit" disabled={loading}>
                    {loading ? <><Loader2 size={18} className="spin" /> Creating...</> : "Create Workout"}
                </button>
            </form>
        </div>
    );
}