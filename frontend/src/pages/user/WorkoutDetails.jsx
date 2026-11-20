import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft,
    PlayCircle,
    Clock,
    Flame,
    Loader2,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    AlertCircle,
    ShieldAlert,
    ListChecks,
    Zap,
} from "lucide-react";
import API from "../../services/api";

// Extract YouTube ID
const extractYouTubeId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

export default function WorkoutDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [workout, setWorkout] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchWorkout = async () => {
            try {
                const res = await API.get(`/api/workouts/${id}`);
                setWorkout(res.data.workout);
            } catch (err) {
                console.error("Failed to load workout", err);
                setError(err.response?.data?.message || "Workout not found");
            } finally {
                setLoading(false);
            }
        };
        fetchWorkout();
    }, [id]);

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="spin" style={{ color: "var(--accent-primary, #ef4444)" }} />
            </div>
        );
    }

    if (error || !workout) {
        return (
            <div className="workouts-wrapper">
                <div className="panel empty-state" style={{ marginTop: 40 }}>
                    <AlertCircle size={48} className="empty-icon" />
                    <h3>{error || "Workout not found"}</h3>
                    <Link to="/workouts" className="primary-btn" style={{ marginTop: 16 }}>
                        Back to Workouts
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="details-wrapper">
            <Link to="/workouts" className="back-pill-link">
                <ArrowLeft size={15} /> Back to Workouts
            </Link>

            {/* Cinema 3D Video Stage (Matching Landing Page Showcase) */}
            <div className="cinema-stage-frame">
                <div className="cinema-stage-screen">
                    {workout.videoType === "youtube" && workout.videoUrl ? (
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${extractYouTubeId(workout.videoUrl)}`}
                            title="Workout Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="cinema-iframe"
                        />
                    ) : workout.videoUrl ? (
                        <CustomVideoPlayer url={workout.videoUrl} />
                    ) : (
                        <div className="video-empty-stage">
                            <div className="empty-icon-ring">
                                <PlayCircle size={40} color="#ef4444" />
                            </div>
                            <p>No preview video uploaded for this routine—jump straight into the live tracker!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Workout Hero Details Panel */}
            <div className="panel details-hero-panel">
                <div className="details-info-col">
                    <div className="eyebrow-pill">
                        <span className="pulse-dot" />
                        <span>{workout.category || "WORKOUT"}</span>
                    </div>

                    <h1>{workout.title}</h1>
                    <p className="details-desc">{workout.description}</p>

                    <div className="details-stats-pills">
                        <div className="detail-stat-box">
                            <span>Duration</span>
                            <strong>
                                <Clock size={15} color="#3b82f6" /> {workout.duration} min
                            </strong>
                        </div>
                        <div className="detail-stat-box">
                            <span>Est. Calories</span>
                            <strong>
                                <Flame size={15} color="#ef4444" /> {workout.caloriesEstimate} kcal
                            </strong>
                        </div>
                        <div className="detail-stat-box">
                            <span>Difficulty</span>
                            <strong>
                                <Zap size={15} color="#f59e0b" /> {workout.difficulty}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="details-cta-col">
                    <button
                        type="button"
                        onClick={() => navigate(`/workouts/${id}/track`)}
                        className="primary-btn start-workout-btn"
                    >
                        <PlayCircle size={20} /> Start Workout
                    </button>
                </div>
            </div>

            {/* Step-by-Step Instructions */}
            {workout.instructions?.length > 0 && (
                <div className="panel">
                    <h3 className="section-title flex-title" style={{ marginBottom: 18 }}>
                        <ListChecks size={19} color="var(--accent-primary, #ef4444)" /> Workout Instructions
                    </h3>
                    <ol className="instructions-list">
                        {workout.instructions.map((inst, i) => (
                            <li key={i} className="instruction-step">
                                <span className="step-badge">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="step-text">{inst}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {/* Safety Guidance */}
            {workout.safetyGuidance && (
                <div className="panel safety-panel">
                    <h3 className="section-title flex-title safety-title">
                        <ShieldAlert size={19} color="#f59e0b" /> Safety Guidance
                    </h3>
                    <p className="safety-text">{workout.safetyGuidance}</p>
                </div>
            )}
        </div>
    );
}

// Upgraded Custom Video Player
function CustomVideoPlayer({ url }) {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [timeDisplay, setTimeDisplay] = useState("00:00 / 00:00");

    const formatSecs = (s) => {
        if (!s || Number.isNaN(s)) return "00:00";
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const current = videoRef.current.currentTime;
        const total = videoRef.current.duration;
        if (total) {
            setProgress((current / total) * 100);
            setTimeDisplay(`${formatSecs(current)} / ${formatSecs(total)}`);
        }
    };

    const handleSeek = (e) => {
        if (!videoRef.current || !videoRef.current.duration) return;
        const seekTime = (e.target.value / 100) * videoRef.current.duration;
        videoRef.current.currentTime = seekTime;
        setProgress(e.target.value);
    };

    return (
        <div className="custom-player-wrap">
            <video
                ref={videoRef}
                src={url}
                className="custom-player-video"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onClick={togglePlay}
                onEnded={() => setIsPlaying(false)}
                playsInline
            />

            {!isPlaying && (
                <button
                    type="button"
                    className="center-play-overlay"
                    onClick={togglePlay}
                    aria-label="Play workout video"
                >
                    <Play size={30} fill="#fff" />
                </button>
            )}

            <div className="custom-player-controls">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={handleSeek}
                    className="player-seek-bar"
                />
                <div className="player-bottom-row">
                    <div className="player-left-btns">
                        <button type="button" onClick={togglePlay} aria-label="Play or pause">
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button type="button" onClick={toggleMute} aria-label="Mute or unmute">
                            {isMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
                        </button>
                        <span className="player-time-readout">{timeDisplay}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => videoRef.current?.requestFullscreen?.()}
                        aria-label="Fullscreen"
                    >
                        <Maximize size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}