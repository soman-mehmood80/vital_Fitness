import { useEffect, useRef, useState } from "react";
import {
    User, Mail, Activity, Target, Camera, Save,
    Shield, LogOut, AlertCircle, CheckCircle2, Loader2,
    Droplets, Moon, Footprints, KeyRound
} from "lucide-react";
import API from "../../services/api";
import { getStoredUser, updateStoredUser } from "../../utils/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Profile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [user, setUser] = useState(getStoredUser());
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [msg, setMsg] = useState("");
    const [isError, setIsError] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        dateOfBirth: "",
        gender: "Prefer not to say",
        height: "",
        fitnessGoal: "General Fitness",
        activityLevel: "Beginner",
        waterGoal: 2500,
        sleepGoal: 8,
        stepGoal: 10000,
    });

    const [imageFile, setImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState("");

    // Safe DOB format
    const formatDOB = (dob) => {
        if (!dob) return "";
        try {
            const d = new Date(dob);
            if (isNaN(d.getTime())) return "";
            return d.toISOString().split("T")[0];
        } catch {
            return "";
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await API.get("/auth/profile");
                const profile = res.data.user || res.data;

                setUser(profile);
                updateStoredUser(profile);

                setForm({
                    name: profile.name || "",
                    email: profile.email || "",
                    dateOfBirth: formatDOB(profile.dateOfBirth),
                    gender: profile.gender || "Prefer not to say",
                    height: profile.height || "",
                    fitnessGoal: profile.fitnessGoal || "General Fitness",
                    activityLevel: profile.activityLevel || "Beginner",
                    waterGoal: profile.waterGoal || 2500,
                    sleepGoal: profile.sleepGoal || 8,
                    stepGoal: profile.stepGoal || 10000,
                });

                if (profile.profileImage) setPreviewImage(profile.profileImage);
            } catch (err) {
                console.error("Failed to load profile", err);
                setMsg("Failed to load profile");
                setIsError(true);
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setMsg("Image must be under 5MB");
            setIsError(true);
            return;
        }

        setImageFile(file);
        setPreviewImage(URL.createObjectURL(file));
    };

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg("");
        setIsError(false);

        try {
            const emailChanged = form.email.trim().toLowerCase() !== user?.email;

            const formData = new FormData();
            Object.keys(form).forEach((key) => {
                formData.append(key, form[key] ?? "");
            });
            if (imageFile) formData.append("profileImage", imageFile);

            const res = await API.put("/auth/profile", formData);
            const updatedUser = res.data.user || res.data;

            setUser(updatedUser);
            updateStoredUser(updatedUser);
            setImageFile(null);

            setIsError(false);
            setMsg(
                emailChanged
                    ? "Profile updated! Please verify your new email before next login."
                    : "Profile updated successfully!"
            );
        } catch (err) {
            setIsError(true);
            setMsg(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const logoutAll = async () => {
        if (!window.confirm("Logout from all devices? You'll be signed out everywhere.")) return;
        try {
            await API.post("/auth/logout-all");
            localStorage.clear();
            sessionStorage.clear();
            navigate("/login");
        } catch (err) {
            setMsg("Failed to logout from all devices");
            setIsError(true);
        }
    };

    if (fetching) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary)" }} />
            </div>
        );
    }

    const initial = user?.name?.charAt(0).toUpperCase() || "U";
    const emailChanged = form.email.trim().toLowerCase() !== user?.email;

    return (
        <div className="profile-page">
            {/* Header */}
            <div className="page-header-clean">
                <p className="eyebrow">ACCOUNT SETTINGS</p>
                <h1>My Profile</h1>
                <p>Manage your personal information and fitness preferences.</p>
            </div>

            {msg && (
                <div className={isError ? "error-msg" : "muted-msg"}>
                    {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    <span>{msg}</span>
                </div>
            )}

            <div className="profile-grid">
                {/* LEFT — Avatar & Meta */}
                <div className="panel profile-avatar-panel">
                    <div className="profile-avatar-wrapper">
                        {previewImage ? (
                            <img src={previewImage} alt="Profile" className="profile-avatar-img" />
                        ) : (
                            <div className="profile-avatar-placeholder">{initial}</div>
                        )}

                        <button
                            type="button"
                            className="profile-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Change Photo"
                        >
                            <Camera size={16} />
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            style={{ display: "none" }}
                        />
                    </div>

                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px 0" }}>{user?.name}</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>{user?.email}</p>

                    <div className={`badge ${user?.emailVerified ? "success" : "role"}`} style={{ marginBottom: 24 }}>
                        {user?.emailVerified ? "✓ Verified Account" : "Unverified"}
                    </div>

                    {user?.streak > 0 && (
                        <div className="streak-card" style={{ width: "100%" }}>
                            <span style={{ fontSize: 24 }}>🔥</span>
                            <div style={{ textAlign: "left" }}>
                                <strong>{user.streak}-Day Streak</strong>
                                <span>Keep it going!</span>
                            </div>
                        </div>
                    )}

                    <hr style={{ width: "100%", border: "none", borderTop: "1px solid var(--border-subtle)", margin: "20px 0" }} />

                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, textAlign: "left", fontSize: 13 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>Member Since</span>
                            <strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>Role</span>
                            <strong style={{ textTransform: "capitalize" }}>{user?.role}</strong>
                        </div>
                    </div>
                </div>

                {/* RIGHT — Edit Form */}
                <div className="panel">
                    <h3 className="section-title flex-title">
                        <User size={18} color="var(--accent-primary)" /> Personal Details
                    </h3>

                    <form onSubmit={submit}>
                        {/* Name & Email */}
                        <div className="profile-form-row">
                            <div className="profile-field">
                                <label>Full Name</label>
                                <input
                                    type="text" name="name" value={form.name} onChange={handleChange}
                                />
                            </div>
                            <div className="profile-field">
                                <label>Email Address</label>
                                <input
                                    type="email" name="email" value={form.email} onChange={handleChange}
                                />
                            </div>
                        </div>

                        {emailChanged && (
                            <div className="warning-box">
                                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                                <span>
                                    <strong>Email change requires verification.</strong> After saving, check your new email for a verification link.
                                </span>
                            </div>
                        )}

                        {/* DOB & Gender */}
                        <div className="profile-form-row" style={{ marginTop: 16 }}>
                            <div className="profile-field">
                                <label>Date of Birth</label>
                                <input
                                    type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange}
                                />
                            </div>
                            <div className="profile-field">
                                <label>Gender</label>
                                <select name="gender" value={form.gender} onChange={handleChange}>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                    <option>Prefer not to say</option>
                                </select>
                            </div>
                        </div>

                        <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "24px 0 16px 0" }} />

                        {/* Fitness Profile */}
                        <h3 className="section-title flex-title">
                            <Activity size={18} color="var(--accent-primary)" /> Fitness Profile
                        </h3>

                        <div className="profile-form-row three-col" style={{ marginTop: 16 }}>
                            <div className="profile-field">
                                <label>Height (cm)</label>
                                <input
                                    type="number" name="height" value={form.height} onChange={handleChange}
                                    placeholder="e.g. 175"
                                />
                            </div>
                            <div className="profile-field">
                                <label>Fitness Goal</label>
                                <select name="fitnessGoal" value={form.fitnessGoal} onChange={handleChange}>
                                    <option>Weight Loss</option>
                                    <option>Muscle Gain</option>
                                    <option>General Fitness</option>
                                    <option>Endurance</option>
                                </select>
                            </div>
                            <div className="profile-field">
                                <label>Activity Level</label>
                                <select name="activityLevel" value={form.activityLevel} onChange={handleChange}>
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                    <option>Athlete</option>
                                </select>
                            </div>
                        </div>

                        <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "24px 0 16px 0" }} />

                        {/* Daily Goals */}
                        <h3 className="section-title flex-title">
                            <Target size={18} color="var(--accent-primary)" /> Daily Goals
                        </h3>

                        <div className="profile-form-row three-col" style={{ marginTop: 16 }}>
                            <div className="profile-field">
                                <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <Droplets size={12} /> Water (ml)
                                </label>
                                <input
                                    type="number" name="waterGoal" value={form.waterGoal}
                                    onChange={handleChange}
                                    min="500" max="10000" step="100"
                                />
                            </div>
                            <div className="profile-field">
                                <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <Moon size={12} /> Sleep (hrs)
                                </label>
                                <input
                                    type="number" name="sleepGoal" value={form.sleepGoal}
                                    onChange={handleChange}
                                    min="4" max="12" step="0.5"
                                />
                            </div>
                            <div className="profile-field">
                                <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <Footprints size={12} /> Steps
                                </label>
                                <input
                                    type="number" name="stepGoal" value={form.stepGoal}
                                    onChange={handleChange}
                                    min="1000" max="50000" step="500"
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                            <button type="submit" className="primary-btn" disabled={loading}>
                                {loading ? (
                                    <><Loader2 size={18} className="spin" /> Saving...</>
                                ) : (
                                    <><Save size={18} /> Save Changes</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Account & Security Section */}
            <div className="panel">
                <h3 className="section-title flex-title">
                    <Shield size={18} color="var(--accent-primary)" /> Account & Security
                </h3>

                <div className="account-actions" style={{ marginTop: 16 }}>
                    <Link to="/change-password" style={{ textDecoration: "none" }}>
                        <button type="button" className="account-action-btn" style={{ width: "100%" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <KeyRound size={16} /> Change Password
                            </span>
                            <span style={{ color: "var(--text-muted)", fontSize: 18 }}>→</span>
                        </button>
                    </Link>

                    <button type="button" className="account-action-btn danger" onClick={logoutAll}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <LogOut size={16} /> Logout from All Devices
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}