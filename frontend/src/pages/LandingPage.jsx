import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    Activity,
    Dumbbell,
    Droplets,
    Zap,
    CheckCircle2,
    Heart,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Flame,
    Timer,
    Moon,
    Trophy,
    ChevronDown,
    Star,
    Check,
    Watch,
    TrendingUp,
    Menu,
    X,
    Wind,
    Gauge,
    Maximize2,
    ShieldCheck,
} from "lucide-react";
import "../styles/landing.css";

const NAV_LINKS = [
    { id: "how-it-works", label: "How It Works" },
    { id: "training-motion", label: "Workouts" },
    { id: "features", label: "Features" },
    { id: "results", label: "Results" },
    { id: "pricing", label: "Pricing" },
];

// Interactive Hero 3D Device Modes (Strength / Cardio / Mobility)
const HERO_MODES = [
    {
        id: "strength",
        label: "Strength",
        workoutTitle: "Barbell Power Split",
        progressLabel: "Set 3 / 4",
        bpm: "148",
        kcal: "450",
        time: "38:12",
        videoUrl: "https://videos.pexels.com/video-files/5319856/5319856-uhd_2160_3840_25fps.mp4",
        fallbackUrl: "https://assets.mixkit.co/videos/44416/44416-720.mp4",
        poster: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop",
        accent: "#ef4444",
    },
    {
        id: "cardio",
        label: "Cardio",
        workoutTitle: "Tempo Bridge Run",
        progressLabel: "Lap 4 / 6",
        bpm: "162",
        kcal: "610",
        time: "44:05",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-jogging-across-a-narrow-footbridge-40768-large.mp4",
        fallbackUrl: "https://assets.mixkit.co/videos/41875/41875-720.mp4",
        poster: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1000&auto=format&fit=crop",
        accent: "#3b82f6",
    },
    {
        id: "mobility",
        label: "Mobility",
        workoutTitle: "Spine & Hip Flow",
        progressLabel: "Flow 2 / 3",
        bpm: "94",
        kcal: "215",
        time: "22:40",
        videoUrl: "https://assets.mixkit.co/videos/892/892-720.mp4",
        fallbackUrl: "https://assets.mixkit.co/videos/1053/1053-720.mp4",
        poster: "https://images.unsplash.com/photo-1590417154498-ec4c5d293e0e?auto=format&fit=crop&w=1000&q=80",
        accent: "#10b981",
    },
];

// 4-Discipline Studio Videos (Strength, HIIT, Cardio, Mobility)
const WORKOUT_VIDEOS = [
    {
        id: "strength",
        title: "Strength & Hypertrophy",
        tag: "4K AI Tracking",
        desc: "Automatic rep counting, rest timers, and progressive overload analytics calibrated to your compound lifts.",
        videoUrl: "https://videos.pexels.com/video-files/5319856/5319856-uhd_2160_3840_25fps.mp4",
        fallbackUrl: "https://assets.mixkit.co/videos/44416/44416-720.mp4",
        poster: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop",
        bpm: "138 BPM",
        burn: "520 kcal/hr",
        focus: "4 Sets • RPE 8.5",
        zone: "Anaerobic Zone 4",
        accent: "#ef4444",
        intensity: 86,
        iconType: "dumbbell",
    },
    {
        id: "hiit",
        title: "HIIT & Battle Conditioning",
        tag: "Live HR Zones",
        desc: "Push your VO2 max with explosive battle-rope intervals, round pacing cues, and real-time calorie velocity.",
        videoUrl: "https://assets.mixkit.co/videos/40766/40766-720.mp4",
        fallbackUrl: "https://videos.pexels.com/video-files/8471300/8471300-uhd_2160_3840_25fps.mp4",
        poster: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop",
        bpm: "168 BPM",
        burn: "740 kcal/hr",
        focus: "40s ON / 20s OFF",
        zone: "Peak Zone 5",
        accent: "#f97316",
        intensity: 95,
        iconType: "flame",
    },
    {
        id: "cardio",
        title: "Cardio & Outdoor Endurance",
        tag: "Smart Stamina",
        desc: "Track pace splits, aerobic heart-rate drift, and hydration replenishment across road runs and track intervals.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-jogging-across-a-narrow-footbridge-40768-large.mp4",
        fallbackUrl: "https://assets.mixkit.co/videos/41875/41875-720.mp4",
        poster: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1200&auto=format&fit=crop",
        bpm: "146 BPM",
        burn: "610 kcal/hr",
        focus: "Pace 4:32 / km",
        zone: "Aerobic Zone 3",
        accent: "#3b82f6",
        intensity: 78,
        iconType: "activity",
    },
    {
        id: "mobility",
        title: "Mobility & Recovery Flow",
        tag: "Joint & HRV Lab",
        desc: "Restore range of motion, decompress your spine, and accelerate HRV recovery with guided stretch & yoga flows.",
        videoUrl: "https://assets.mixkit.co/videos/892/892-720.mp4",
        fallbackUrl: "https://assets.mixkit.co/videos/1053/1053-720.mp4",
        poster: "https://images.unsplash.com/photo-1590417154498-ec4c5d293e0e?auto=format&fit=crop&w=1200&q=80",
        bpm: "92 BPM",
        burn: "210 kcal/hr",
        focus: "ROM +18% • HRV +14ms",
        zone: "Recovery Zone 1",
        accent: "#10b981",
        intensity: 48,
        iconType: "wind",
    },
];

// Additional Guided Video Clips (Hover to preview, click to load into 3D Studio)
const GUIDED_REELS = [
    {
        id: "reel-strength",
        tabIndex: 0,
        category: "Strength Training",
        badgeClass: "red",
        title: "Dumbbell & Kettlebell Power",
        meta: "35 min • 142 BPM • Hypertrophy",
        videoUrl: "https://assets.mixkit.co/videos/44416/44416-720.mp4",
        fallbackUrl: "https://assets.mixkit.co/videos/4506/4506-720.mp4",
        poster: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=900&auto=format&fit=crop",
        bpm: "142 BPM",
        burn: "540 kcal/hr",
        focus: "Dumbbell • 5x6 Reps",
        zone: "Anaerobic Zone 4",
        accent: "#ef4444",
    },
    {
        id: "reel-cardio",
        tabIndex: 2,
        category: "Cardio Conditioning",
        badgeClass: "blue",
        title: "Track Intervals & Stamina",
        meta: "28 min • 158 BPM • VO2 Max",
        videoUrl: "https://assets.mixkit.co/videos/41875/41875-720.mp4",
        fallbackUrl: "https://assets.mixkit.co/videos/151/151-720.mp4",
        poster: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=900&auto=format&fit=crop",
        bpm: "158 BPM",
        burn: "660 kcal/hr",
        focus: "8x400m Track Splits",
        zone: "Threshold Zone 4",
        accent: "#3b82f6",
    },
    {
        id: "reel-mobility",
        tabIndex: 3,
        category: "Mobility & Stretch",
        badgeClass: "green",
        title: "Deck Yoga & Deep Stretch",
        meta: "20 min • 88 BPM • Active Reset",
        videoUrl: "https://assets.mixkit.co/videos/1053/1053-720.mp4",
        fallbackUrl: "https://assets.mixkit.co/videos/48550/48550-720.mp4",
        poster: "https://images.unsplash.com/photo-1590417154498-ec4c5d293e0e?auto=format&fit=crop&w=900&q=80",
        bpm: "88 BPM",
        burn: "195 kcal/hr",
        focus: "Hip Flexor & Thoracic",
        zone: "Recovery Zone 1",
        accent: "#10b981",
    },
];

const TESTIMONIALS = [
    {
        badge: "-12 kg in 14 Weeks",
        quote: "Seeing my calories, protein, hydration, and lifting volume in one 3D dashboard finally made consistency effortless. Best fitness app I have ever used.",
        name: "Arjun Mehta",
        role: "Hybrid Athlete • Pro Member",
        initials: "AM",
    },
    {
        badge: "+35 kg Deadlift PR",
        quote: "The AI recovery score stopped me from overtraining. Knowing exactly when to push heavy and when to deload took my strength to another level.",
        name: "Sarah Jenkins",
        role: "Strength Coach • London",
        initials: "SJ",
    },
    {
        badge: "42-Day Active Streak",
        quote: "Syncing my watch took 10 seconds. The live heart-rate zone breakdown during HIIT and mobility sessions keeps me locked in from warm-up to cooldown.",
        name: "Zainab Tariq",
        role: "Marathon Runner • Islamabad",
        initials: "ZT",
    },
];

const FAQS = [
    {
        q: "Is VitalFit really free to start?",
        a: "Yes! Our Starter plan is 100% free forever with unlimited workout logging, hydration tracking, and daily calorie monitoring. You can upgrade to Pro anytime for AI coaching and advanced wearable analytics.",
    },
    {
        q: "Which smartwatches and fitness apps sync with VitalFit?",
        a: "VitalFit connects seamlessly with Apple Health, Google Fit, Garmin Connect, Strava, Fitbit, and WHOOP so your heart rate, steps, and sleep import automatically.",
    },
    {
        q: "How do the AI Coaching Insights work?",
        a: "Our engine analyzes your sleep duration, workout intensity, hydration consistency, and muscle fatigue to suggest optimal daily targets and warn you before burnout hits.",
    },
    {
        q: "Can I track strength, cardio, and mobility in one place?",
        a: "Absolutely. Choose from 400+ barbell, kettlebell, cardio interval, and guided mobility movements—or build custom splits with your own sets, reps, and rest timers.",
    },
];

function DisciplineIcon({ type }) {
    if (type === "flame") return <Flame size={18} color="#f97316" />;
    if (type === "activity") return <Activity size={18} color="#3b82f6" />;
    if (type === "wind") return <Wind size={18} color="#10b981" />;
    return <Dumbbell size={18} color="var(--accent-primary, #ef4444)" />;
}

// Reusable 3D Interactive Tilt Feature Card
function TiltFeatureCard({ icon, iconClass, title, description, barClass }) {
    const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50 });

    const handleMouseMove = (e) => {
        if (window.innerWidth < 1024) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setTilt({
            rx: (0.5 - y) * 14,
            ry: (x - 0.5) * 14,
            mx: x * 100,
            my: y * 100,
        });
    };

    const handleMouseLeave = () => {
        setTilt({ rx: 0, ry: 0, mx: 50, my: 50 });
    };

    return (
        <div
            className="feature-card-3d"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            }}
        >
            <div
                className="card-spotlight"
                style={{
                    background: `radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, rgba(239, 68, 68, 0.16), transparent 60%)`,
                }}
            />
            <div className={`feature-icon-3d ${iconClass}`}>{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className="feature-mini-bar">
                <div className={`feature-mini-fill ${barClass}`} />
            </div>
        </div>
    );
}

// Interactive Guided Reel Card (hover to preview video, click to load into 3D Studio)
function GuidedReelCard({ reel, isSelected, onSelectReel }) {
    const videoRef = useRef(null);
    const [hoverPlaying, setHoverPlaying] = useState(false);

    const handleMouseEnter = () => {
        if (!videoRef.current) return;
        videoRef.current.play().then(() => setHoverPlaying(true)).catch(() => {});
    };

    const handleMouseLeave = () => {
        if (!videoRef.current) return;
        videoRef.current.pause();
        setHoverPlaying(false);
    };

    const toggleMobilePreview = (e) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().then(() => setHoverPlaying(true)).catch(() => {});
        } else {
            videoRef.current.pause();
            setHoverPlaying(false);
        }
    };

    return (
        <article
            className={`video-reel-card ${isSelected ? "active" : ""}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => onSelectReel(reel)}
        >
            <div className="video-reel-media">
                <video
                    ref={videoRef}
                    className="video-reel-video"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={reel.poster}
                >
                    <source src={reel.videoUrl} type="video/mp4" />
                    <source src={reel.fallbackUrl} type="video/mp4" />
                </video>
                <div className="video-reel-gradient" />

                <div className="video-reel-top">
                    <span className={`reel-cat-pill ${reel.badgeClass}`}>{reel.category}</span>
                    <button
                        type="button"
                        className="reel-play-mini"
                        onClick={toggleMobilePreview}
                        aria-label={`Preview ${reel.title}`}
                    >
                        {hoverPlaying ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                </div>

                <div className="video-reel-bottom">
                    <h4>{reel.title}</h4>
                    <p>{reel.meta}</p>
                </div>
            </div>

            <div className="video-reel-footer">
                <span>{reel.focus}</span>
                <span className="reel-studio-link">
                    {isSelected ? "Now Playing" : "Open in 3D Studio"} <ArrowRight size={14} />
                </span>
            </div>
        </article>
    );
}

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeSection, setActiveSection] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Hero 3D Mouse Parallax & Mode State
    const [heroTilt, setHeroTilt] = useState({ rx: -4, ry: -8 });
    const [heroModeIndex, setHeroModeIndex] = useState(0);
    const [heroMuted, setHeroMuted] = useState(true);
    const heroVideoRef = useRef(null);

    // Cinema Video Showcase State
    const [activeTab, setActiveTab] = useState(0);
    const [selectedClipOverride, setSelectedClipOverride] = useState(null);
    const [cinemaTilt, setCinemaTilt] = useState({ rx: 0, ry: 0 });
    const [isPlaying, setIsPlaying] = useState(true);
    const [cinemaMuted, setCinemaMuted] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [videoProgress, setVideoProgress] = useState(0);
    const cinemaVideoRef = useRef(null);
    const cinemaScreenRef = useRef(null);
    const cinemaStageRef = useRef(null);

    // Pricing & FAQ Interactive States
    const [yearlyBilling, setYearlyBilling] = useState(true);
    const [openFaq, setOpenFaq] = useState(0);

    // Scroll tracking + ScrollSpy
    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setScrolled(y > 24);

            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            setScrollProgress(docHeight > 0 ? Math.min(1, Math.max(0, y / docHeight)) : 0);

            const offset = 160;
            let current = "";
            for (const item of NAV_LINKS) {
                const el = document.getElementById(item.id);
                if (el && y >= el.offsetTop - offset) {
                    current = item.id;
                }
            }
            setActiveSection(current);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Lightweight Scroll-Reveal Observer
    useEffect(() => {
        const elements = document.querySelectorAll(".reveal-on-scroll");
        if (!elements.length) return;

        const reveal = (el) => el.classList.add("is-visible");

        if (!("IntersectionObserver" in window)) {
            elements.forEach(reveal);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        reveal(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
        );

        elements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.95) {
                reveal(el);
            } else {
                observer.observe(el);
            }
        });

        // Safety fallback so nothing ever stays hidden
        const safetyTimer = setTimeout(() => {
            elements.forEach(reveal);
        }, 2500);

        return () => {
            clearTimeout(safetyTimer);
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") setMobileMenuOpen(false);
        };
        const onResize = () => {
            if (window.innerWidth > 960) setMobileMenuOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("resize", onResize);
        };
    }, []);

    const currentHeroMode = HERO_MODES[heroModeIndex];
    const currentVideo = selectedClipOverride || WORKOUT_VIDEOS[activeTab];

    // Sync Cinema playback state & speed when active clip changes
    useEffect(() => {
        setVideoProgress(0);
        if (cinemaVideoRef.current) {
            cinemaVideoRef.current.playbackRate = playbackRate;
            cinemaVideoRef.current.muted = cinemaMuted;
            if (isPlaying) {
                cinemaVideoRef.current.play().catch(() => {});
            } else {
                cinemaVideoRef.current.pause();
            }
        }
    }, [currentVideo.videoUrl]);

    const handleSelectTab = (idx) => {
        setSelectedClipOverride(null);
        setActiveTab(idx);
        setIsPlaying(true);
    };

    const handleSelectReel = (reel) => {
        setActiveTab(reel.tabIndex);
        setSelectedClipOverride({
            ...WORKOUT_VIDEOS[reel.tabIndex],
            id: reel.id,
            title: reel.title,
            videoUrl: reel.videoUrl,
            fallbackUrl: reel.fallbackUrl,
            poster: reel.poster,
            bpm: reel.bpm,
            burn: reel.burn,
            focus: reel.focus,
            zone: reel.zone,
            accent: reel.accent,
        });
        setIsPlaying(true);
        cinemaStageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const handleHeroMouseMove = (e) => {
        if (window.innerWidth < 1024) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setHeroTilt({ rx: -y * 18, ry: x * 20 });
    };

    const handleCinemaMouseMove = (e) => {
        if (window.innerWidth < 1024) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setCinemaTilt({ rx: -y * 9, ry: x * 11 });
    };

    const toggleHeroSound = () => {
        if (!heroVideoRef.current) return;
        heroVideoRef.current.muted = !heroMuted;
        setHeroMuted(!heroMuted);
    };

    const toggleCinemaPlay = () => {
        if (!cinemaVideoRef.current) return;
        if (isPlaying) {
            cinemaVideoRef.current.pause();
        } else {
            cinemaVideoRef.current.play().catch(() => {});
        }
        setIsPlaying(!isPlaying);
    };

    const toggleCinemaSound = () => {
        if (!cinemaVideoRef.current) return;
        cinemaVideoRef.current.muted = !cinemaMuted;
        setCinemaMuted(!cinemaMuted);
    };

    const togglePlaybackSpeed = () => {
        const nextRate = playbackRate === 1 ? 0.5 : 1;
        setPlaybackRate(nextRate);
        if (cinemaVideoRef.current) {
            cinemaVideoRef.current.playbackRate = nextRate;
        }
    };

    const handleCinemaFullscreen = () => {
        const target = cinemaScreenRef.current || cinemaVideoRef.current;
        if (!target) return;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        } else if (target.requestFullscreen) {
            target.requestFullscreen().catch(() => {});
        }
    };

    const handleVideoTimeUpdate = () => {
        const el = cinemaVideoRef.current;
        if (!el || !el.duration) return;
        setVideoProgress((el.currentTime / el.duration) * 100);
    };

    const handleSeekBarClick = (e) => {
        const el = cinemaVideoRef.current;
        if (!el || !el.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        el.currentTime = ratio * el.duration;
        setVideoProgress(ratio * 100);
    };

    return (
        <div className="landing-container">
            {/* Floating Glassmorphic Navbar */}
            <div className={`landing-nav-shell ${scrolled ? "scrolled" : ""}`}>
                <nav className="landing-nav" aria-label="Main navigation">
                    <Link
                        to="/"
                        className="landing-brand"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <div className="brand-pulse-icon">
                            <Heart
                                size={18}
                                fill="var(--accent-primary, #ef4444)"
                                color="var(--accent-primary, #ef4444)"
                            />
                        </div>
                        <span className="brand-wordmark">
                            Vital<em>Fit.</em>
                        </span>
                    </Link>

                    <div className="landing-nav-pill">
                        {NAV_LINKS.map((item) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                className={`nav-pill-link ${activeSection === item.id ? "active" : ""}`}
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>

                    <div className="landing-nav-actions">
                        <Link to="/login" className="nav-login-btn">
                            Log In
                        </Link>
                        <Link to="/signup" className="primary-btn nav-cta-btn">
                            Get Started <ArrowRight size={15} />
                        </Link>
                        <button
                            type="button"
                            className="nav-mobile-toggle"
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    <div
                        className="nav-scroll-progress"
                        style={{ transform: `scaleX(${scrollProgress})` }}
                        aria-hidden="true"
                    />
                </nav>

                {/* Mobile Navigation Drawer */}
                <div className={`nav-mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
                    <div className="nav-mobile-links">
                        {NAV_LINKS.map((item) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                className={`nav-mobile-link ${activeSection === item.id ? "active" : ""}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span>{item.label}</span>
                                <ArrowRight size={15} className="nav-mobile-arrow" />
                            </a>
                        ))}
                    </div>
                    <div className="nav-mobile-actions">
                        <Link
                            to="/login"
                            className="btn-secondary full-w"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Log In
                        </Link>
                        <Link
                            to="/signup"
                            className="primary-btn full-w"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Get Started Free <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <header
                className="hero-section"
                onMouseMove={handleHeroMouseMove}
                onMouseLeave={() => setHeroTilt({ rx: -4, ry: -8 })}
            >
                {/* Ambient Gym Backdrop Video */}
                <div className="hero-bg-video-wrap">
                    <video
                        className="hero-bg-video"
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop"
                    >
                        <source
                            src="https://videos.pexels.com/video-files/5319856/5319856-uhd_2160_3840_25fps.mp4"
                            type="video/mp4"
                        />
                        <source
                            src="https://assets.mixkit.co/videos/40766/40766-720.mp4"
                            type="video/mp4"
                        />
                    </video>
                    <div className="hero-bg-overlay" />
                    <div className="cyber-grid-3d" />
                </div>

                {/* Hero Left Copy */}
                <div className="hero-content">
                    <div className="badge-wrapper">
                        <span className="ai-badge">
                            <span className="pulse-dot" />
                            Next-Gen 3D Fitness Telemetry
                        </span>
                    </div>
                    <h1>
                        Transform Your Body. <br />
                        <span>Elevate Your Life.</span>
                    </h1>
                    <p>
                        Track strength sets, cardio intervals, mobility flows, nutrition, and recovery in real time.
                        Experience AI-powered biometric insights engineered for peak athletic performance.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/signup" className="primary-btn large">
                            Start For Free <ArrowRight size={18} />
                        </Link>
                        <a href="#training-motion" className="btn-secondary large">
                            <Play size={16} /> Watch Training Videos
                        </a>
                    </div>

                    <div className="hero-stats">
                        <div className="stat-item">
                            <strong>10K+</strong>
                            <span>Active Athletes</span>
                        </div>
                        <div className="stat-item">
                            <strong>50K+</strong>
                            <span>Workouts Logged</span>
                        </div>
                        <div className="stat-item">
                            <strong>4.9 / 5</strong>
                            <span>User Rating</span>
                        </div>
                    </div>

                    <div className="hero-trust-row">
                        <div className="hero-avatar-stack" aria-hidden="true">
                            <span>AM</span>
                            <span>SJ</span>
                            <span>ZT</span>
                            <span>+</span>
                        </div>
                        <span className="hero-trust-text">
                            <ShieldCheck size={15} color="#22c55e" />
                            Trusted by lifters, runners & mobility coaches worldwide
                        </span>
                    </div>
                </div>

                {/* Hero Right 3D Interactive Device */}
                <div className="hero-3d-stage">
                    <div
                        className="hero-3d-tilt-rig"
                        style={{
                            transform: `rotateX(${heroTilt.rx}deg) rotateY(${heroTilt.ry}deg)`,
                        }}
                    >
                        <div
                            className="glow-effect"
                            style={{ background: currentHeroMode.accent }}
                        />
                        <div className="gyro-ring gyro-ring-1" />
                        <div className="gyro-ring gyro-ring-2" />

                        <div className="device-3d-frame">
                            <div className="device-3d-screen">
                                <video
                                    key={currentHeroMode.videoUrl}
                                    ref={heroVideoRef}
                                    className="device-video"
                                    autoPlay
                                    muted={heroMuted}
                                    loop
                                    playsInline
                                    poster={currentHeroMode.poster}
                                >
                                    <source src={currentHeroMode.videoUrl} type="video/mp4" />
                                    <source src={currentHeroMode.fallbackUrl} type="video/mp4" />
                                </video>

                                <div className="device-hud-overlay">
                                    <div className="hud-top-bar">
                                        <span
                                            className="hud-live-pill"
                                            style={{ background: currentHeroMode.accent }}
                                        >
                                            <span className="pulse-dot" style={{ background: "#fff" }} />
                                            Live {currentHeroMode.label}
                                        </span>
                                        <button
                                            type="button"
                                            className="hud-sound-btn"
                                            onClick={toggleHeroSound}
                                            aria-label="Toggle hero video sound"
                                        >
                                            {heroMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                        </button>
                                    </div>

                                    <div className="hud-bottom-panel">
                                        {/* Quick Hero Mode Switcher */}
                                        <div className="hud-mode-pills" role="tablist" aria-label="Hero workout preview mode">
                                            {HERO_MODES.map((mode, idx) => (
                                                <button
                                                    key={mode.id}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={heroModeIndex === idx}
                                                    className={`hud-mode-pill ${heroModeIndex === idx ? "active" : ""}`}
                                                    onClick={() => setHeroModeIndex(idx)}
                                                >
                                                    {mode.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="hud-workout-title">
                                            <strong>{currentHeroMode.workoutTitle}</strong>
                                            <span style={{ color: currentHeroMode.accent }}>
                                                {currentHeroMode.progressLabel}
                                            </span>
                                        </div>

                                        {/* Animated Biometric Sparkline */}
                                        <svg className="hud-ecg-wave" viewBox="0 0 220 28" aria-hidden="true">
                                            <path
                                                d="M0 16 L32 16 L40 12 L46 20 L54 4 L62 24 L70 16 L108 16 L116 11 L122 19 L130 5 L138 23 L146 16 L184 16 L192 12 L198 20 L204 8 L210 16 L220 16"
                                                fill="none"
                                                stroke={currentHeroMode.accent}
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>

                                        <div className="hud-metrics-row">
                                            <div className="hud-metric">
                                                <b>{currentHeroMode.bpm}</b>
                                                <small>BPM</small>
                                            </div>
                                            <div className="hud-metric">
                                                <b>{currentHeroMode.kcal}</b>
                                                <small>KCAL</small>
                                            </div>
                                            <div className="hud-metric">
                                                <b>{currentHeroMode.time}</b>
                                                <small>TIME</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Z-Depth Cards */}
                        <div className="floating-card-3d card-1">
                            <div className="floating-icon-box blue">
                                <Droplets size={18} />
                            </div>
                            <div>
                                <strong>2.5L / 3L</strong>
                                <span>Hydration Goal</span>
                            </div>
                        </div>

                        <div className="floating-card-3d card-3">
                            <div className="floating-icon-box green">
                                <Activity size={18} />
                            </div>
                            <div>
                                <strong>94%</strong>
                                <span>Recovery Score</span>
                            </div>
                        </div>

                        <div className="floating-card-3d card-2">
                            <div className="floating-icon-box red">
                                <Flame size={18} />
                            </div>
                            <div>
                                <strong>{currentHeroMode.kcal} kcal</strong>
                                <span>Active Burn</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Wearable Ecosystem Sync Strip */}
            <section className="ecosystem-strip" aria-label="Supported integrations">
                <span className="ecosystem-label">
                    <Watch size={16} color="var(--accent-primary, #ef4444)" />
                    Seamless Biometric Sync With
                </span>
                <div className="ecosystem-logos">
                    <span className="eco-pill">Apple Health</span>
                    <span className="eco-pill">Garmin Connect</span>
                    <span className="eco-pill">Strava</span>
                    <span className="eco-pill">WHOOP</span>
                    <span className="eco-pill">Fitbit</span>
                    <span className="eco-pill">Google Fit</span>
                </div>
            </section>

            {/* How It Works — 3D 3-Step Pipeline */}
            <section id="how-it-works" className="steps-section reveal-on-scroll">
                <div className="section-header">
                    <span className="section-kicker">How VitalFit Works</span>
                    <h2>
                        From day one to <span>peak form</span>
                    </h2>
                    <p>Three streamlined steps designed to eliminate guesswork and keep you progressing every single week.</p>
                </div>

                <div className="steps-grid">
                    <div className="step-card-3d">
                        <div className="step-number">01</div>
                        <h3>Calibrate Your Baseline</h3>
                        <p>
                            Set your body goals, daily hydration target, and macro split in under 60 seconds—or link your smartwatch for instant sync.
                        </p>
                    </div>
                    <div className="step-card-3d">
                        <div className="step-number">02</div>
                        <h3>Train With Live Telemetry</h3>
                        <p>
                            Log strength sets, cardio splits, and mobility sessions with an ultra-fast interface built for between-set speed.
                        </p>
                    </div>
                    <div className="step-card-3d">
                        <div className="step-number">03</div>
                        <h3>Unlock AI Progression</h3>
                        <p>
                            Watch your recovery curves, strength PRs, and joint mobility streaks compound with smart AI recommendations every morning.
                        </p>
                    </div>
                </div>
            </section>

            {/* Interactive 3D Video Showcase Section */}
            <section id="training-motion" className="video-showcase-section reveal-on-scroll">
                <div className="section-header">
                    <span className="section-kicker">Training In Motion</span>
                    <h2>
                        Strength, cardio & <span>mobility in action</span>
                    </h2>
                    <p>
                        Switch disciplines below or pick a guided reel to preview real-time heart-rate zones, calorie velocity, and 0.5x form-check playback.
                    </p>
                </div>

                <div
                    className="video-studio-grid"
                    ref={cinemaStageRef}
                    style={{ "--studio-accent": currentVideo.accent }}
                >
                    <div className="video-tabs-list" role="tablist" aria-label="Workout training disciplines">
                        {WORKOUT_VIDEOS.map((item, idx) => (
                            <button
                                key={item.id}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === idx}
                                className={`video-tab-card ${activeTab === idx ? "active" : ""}`}
                                style={{ "--tab-accent": item.accent }}
                                onClick={() => handleSelectTab(idx)}
                            >
                                <div className="video-tab-header">
                                    <h3>
                                        <DisciplineIcon type={item.iconType} />
                                        {item.title}
                                    </h3>
                                    <span className="video-tab-tag">{item.tag}</span>
                                </div>
                                <p>{item.desc}</p>
                                <div className="video-tab-meta">
                                    <span>{item.bpm}</span>
                                    <span>•</span>
                                    <span>{item.focus}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div
                        className="cinema-3d-frame"
                        onMouseMove={handleCinemaMouseMove}
                        onMouseLeave={() => setCinemaTilt({ rx: 0, ry: 0 })}
                        style={{
                            transform: `rotateX(${cinemaTilt.rx}deg) rotateY(${cinemaTilt.ry}deg)`,
                        }}
                    >
                        <div className="cinema-screen" ref={cinemaScreenRef}>
                            <video
                                key={currentVideo.videoUrl}
                                ref={cinemaVideoRef}
                                className="cinema-video"
                                autoPlay
                                muted={cinemaMuted}
                                loop
                                playsInline
                                onTimeUpdate={handleVideoTimeUpdate}
                                poster={currentVideo.poster}
                            >
                                <source src={currentVideo.videoUrl} type="video/mp4" />
                                <source src={currentVideo.fallbackUrl} type="video/mp4" />
                            </video>

                            <div className="cinema-overlay">
                                <div className="cinema-top-badges">
                                    <span className="cinema-telemetry-pill">
                                        <span
                                            className="pulse-dot"
                                            style={{ background: currentVideo.accent }}
                                        />
                                        {currentVideo.title}
                                    </span>
                                    <span className="cinema-telemetry-pill">
                                        <Timer size={14} /> {currentVideo.zone}
                                    </span>
                                </div>

                                <div className="cinema-bottom-stack">
                                    <div className="cinema-bottom-bar">
                                        <div className="cinema-stats-strip">
                                            <div className="cinema-stat">
                                                <strong>{currentVideo.bpm}</strong>
                                                <span>Avg Heart Rate</span>
                                            </div>
                                            <div className="cinema-stat">
                                                <strong>{currentVideo.burn}</strong>
                                                <span>Energy Output</span>
                                            </div>
                                            <div className="cinema-stat hide-xs">
                                                <strong>{currentVideo.focus}</strong>
                                                <span>Session Target</span>
                                            </div>
                                        </div>

                                        <div className="cinema-controls">
                                            <button
                                                type="button"
                                                className={`cinema-ctrl-btn speed-btn ${playbackRate === 0.5 ? "active" : ""}`}
                                                onClick={togglePlaybackSpeed}
                                                aria-label="Toggle 0.5x form-check slow motion"
                                                title="Toggle 0.5x form-check speed"
                                            >
                                                <Gauge size={14} />
                                                <span>{playbackRate}x</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="cinema-ctrl-btn"
                                                onClick={toggleCinemaPlay}
                                                aria-label={isPlaying ? "Pause workout preview" : "Play workout preview"}
                                            >
                                                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                                            </button>
                                            <button
                                                type="button"
                                                className="cinema-ctrl-btn"
                                                onClick={toggleCinemaSound}
                                                aria-label={cinemaMuted ? "Unmute workout preview" : "Mute workout preview"}
                                            >
                                                {cinemaMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                            </button>
                                            <button
                                                type="button"
                                                className="cinema-ctrl-btn"
                                                onClick={handleCinemaFullscreen}
                                                aria-label="Toggle fullscreen video"
                                            >
                                                <Maximize2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Interactive Seekable Progress Timeline */}
                                    <div
                                        className="cinema-progress-track"
                                        onClick={handleSeekBarClick}
                                        role="progressbar"
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={Math.round(videoProgress)}
                                    >
                                        <div
                                            className="cinema-progress-fill"
                                            style={{
                                                width: `${videoProgress}%`,
                                                background: currentVideo.accent,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guided Video Reels Grid: Strength, Cardio & Mobility */}
                <div className="video-reels-header">
                    <div>
                        <span className="section-kicker">Guided Video Library</span>
                        <h3>Explore strength, cardio &amp; mobility reels</h3>
                    </div>
                    <p>Hover any session to preview motion, or click to launch inside the 3D Cinema Studio.</p>
                </div>

                <div className="video-reels-grid">
                    {GUIDED_REELS.map((reel) => (
                        <GuidedReelCard
                            key={reel.id}
                            reel={reel}
                            isSelected={currentVideo.id === reel.id}
                            onSelectReel={handleSelectReel}
                        />
                    ))}
                </div>
            </section>

            {/* 3D Features Bento (6 Cards) */}
            <section id="features" className="features-section reveal-on-scroll">
                <div className="section-header">
                    <span className="section-kicker">Precision Tools</span>
                    <h2>
                        Everything you need to <span>succeed</span>
                    </h2>
                    <p>Six integrated modules engineered to turn daily effort into measurable, lasting transformation.</p>
                </div>

                <div className="features-grid">
                    <TiltFeatureCard
                        icon={<Dumbbell size={24} />}
                        iconClass="red"
                        barClass="red"
                        title="Workout Tracking"
                        description="Log exercises, sets, reps, and PRs in seconds. Visualize strength progression and weekly volume effortlessly."
                    />
                    <TiltFeatureCard
                        icon={<Droplets size={24} />}
                        iconClass="blue"
                        barClass="blue"
                        title="Hydration Monitor"
                        description="Stay locked onto your daily water intake with adaptive targets adjusted for sweat loss and workout intensity."
                    />
                    <TiltFeatureCard
                        icon={<Zap size={24} />}
                        iconClass="purple"
                        barClass="purple"
                        title="AI Coaching Insights"
                        description="Receive smart recovery alerts, optimal training windows, and personalized habit nudges tailored to your data."
                    />
                    <TiltFeatureCard
                        icon={<CheckCircle2 size={24} />}
                        iconClass="green"
                        barClass="green"
                        title="Nutrition & Macros"
                        description="Track calories, protein, carbs, and fats cleanly with instant daily macro balance and meal-prep breakdowns."
                    />
                    <TiltFeatureCard
                        icon={<Moon size={24} />}
                        iconClass="cyan"
                        barClass="cyan"
                        title="Sleep & Recovery Lab"
                        description="Analyze deep sleep cycles, resting heart rate trends, and daily readiness scores before you hit the gym."
                    />
                    <TiltFeatureCard
                        icon={<Trophy size={24} />}
                        iconClass="amber"
                        barClass="amber"
                        title="Streaks & PR Engine"
                        description="Celebrate personal records, maintain unstoppable daily streaks, and climb community consistency milestones."
                    />
                </div>
            </section>

            {/* Athlete Results & Testimonials */}
            <section id="results" className="results-section reveal-on-scroll">
                <div className="section-header">
                    <span className="section-kicker">Real Transformations</span>
                    <h2>
                        Trusted by <span>10,000+ athletes</span>
                    </h2>
                    <p>See how everyday lifters, runners, and coaches hit new milestones with VitalFit.</p>
                </div>

                <div className="results-grid">
                    {TESTIMONIALS.map((t) => (
                        <div className="result-card" key={t.name}>
                            <div>
                                <div className="result-badge">
                                    <TrendingUp size={14} /> {t.badge}
                                </div>
                                <p className="result-quote">“{t.quote}”</p>
                            </div>
                            <div className="result-author">
                                <div className="result-author-info">
                                    <div className="result-avatar" aria-hidden="true">
                                        {t.initials}
                                    </div>
                                    <div>
                                        <strong>{t.name}</strong>
                                        <span>{t.role}</span>
                                    </div>
                                </div>
                                <div className="result-stars" aria-label="5 out of 5 stars">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill="#f59e0b" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Interactive Pricing Section */}
            <section id="pricing" className="pricing-section reveal-on-scroll">
                <div className="section-header">
                    <span className="section-kicker">Simple Pricing</span>
                    <h2>
                        Start free, upgrade <span>when ready</span>
                    </h2>
                    <p>No hidden fees or lock-in contracts. Build your routine free forever.</p>
                </div>

                <div className="billing-toggle-wrap">
                    <div className="billing-toggle">
                        <button
                            type="button"
                            className={`billing-btn ${!yearlyBilling ? "active" : ""}`}
                            onClick={() => setYearlyBilling(false)}
                            aria-pressed={!yearlyBilling}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            className={`billing-btn ${yearlyBilling ? "active" : ""}`}
                            onClick={() => setYearlyBilling(true)}
                            aria-pressed={yearlyBilling}
                        >
                            Yearly
                        </button>
                    </div>
                    <span className="save-badge">Save 35%</span>
                </div>

                <div className="pricing-grid">
                    <div className="pricing-card">
                        <div>
                            <h3>Starter</h3>
                            <p className="pricing-desc">Everything you need to track daily habits and workouts.</p>
                            <div className="pricing-price">
                                <strong>$0</strong>
                                <span>/ forever</span>
                            </div>
                            <ul className="pricing-features">
                                <li><Check size={16} color="#22c55e" /> Unlimited workout &amp; set logging</li>
                                <li><Check size={16} color="#22c55e" /> Daily hydration &amp; sleep tracking</li>
                                <li><Check size={16} color="#22c55e" /> Calorie &amp; basic macro counter</li>
                                <li><Check size={16} color="#22c55e" /> Streak &amp; PR milestone badges</li>
                            </ul>
                        </div>
                        <Link to="/signup" className="btn-secondary large full-w">
                            Get Started Free
                        </Link>
                    </div>

                    <div className="pricing-card featured">
                        <span className="popular-pill">Most Popular</span>
                        <div>
                            <h3>VitalFit Pro</h3>
                            <p className="pricing-desc">Full AI coaching, biometric sync, and advanced analytics.</p>
                            <div className="pricing-price">
                                <strong>${yearlyBilling ? "6" : "9"}</strong>
                                <span>/ month {yearlyBilling ? "(billed yearly)" : ""}</span>
                            </div>
                            <ul className="pricing-features">
                                <li><Check size={16} color="#ef4444" /> Everything in Starter</li>
                                <li><Check size={16} color="#ef4444" /> AI Coaching &amp; daily readiness score</li>
                                <li><Check size={16} color="#ef4444" /> Apple Health, Garmin &amp; Strava sync</li>
                                <li><Check size={16} color="#ef4444" /> Unlimited custom split &amp; mobility plans</li>
                            </ul>
                        </div>
                        <Link to="/signup" className="primary-btn large full-w">
                            Start 14-Day Pro Trial <ArrowRight size={17} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ Accordion */}
            <section id="faq" className="faq-section reveal-on-scroll">
                <div className="section-header">
                    <span className="section-kicker">Got Questions?</span>
                    <h2>
                        Frequently asked <span>questions</span>
                    </h2>
                </div>

                <div className="faq-list">
                    {FAQS.map((item, idx) => {
                        const isOpen = openFaq === idx;
                        return (
                            <div className={`faq-item ${isOpen ? "open" : ""}`} key={item.q}>
                                <button
                                    type="button"
                                    className="faq-question"
                                    aria-expanded={isOpen}
                                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                                >
                                    {item.q}
                                    <ChevronDown size={18} className="faq-chevron" />
                                </button>
                                <div className="faq-answer-wrap">
                                    <div className="faq-answer-inner">
                                        <div className="faq-answer">{item.a}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 3D Portal CTA Section */}
            <section id="cta" className="cta-section reveal-on-scroll">
                <div className="cta-3d-card">
                    <h2>Ready to transform your routine?</h2>
                    <p>
                        Join over 10,000+ athletes tracking every rep, calorie, cardio split, and mobility session with VitalFit.
                    </p>
                    <Link to="/signup" className="primary-btn large">
                        Create Free Account <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Multi-Column Footer */}
            <footer className="landing-footer">
                <div className="footer-top-grid">
                    <div className="footer-brand-col">
                        <Link to="/" className="landing-brand">
                            <div className="brand-pulse-icon">
                                <Heart size={18} fill="var(--accent-primary, #ef4444)" color="var(--accent-primary, #ef4444)" />
                            </div>
                            <span className="brand-wordmark">
                                Vital<em>Fit.</em>
                            </span>
                        </Link>
                        <p>
                            AI-powered workout, nutrition, hydration, and recovery telemetry built for everyday athletes.
                        </p>
                    </div>

                    <div className="footer-col">
                        <h4>Platform</h4>
                        <ul>
                            <li><a href="#how-it-works">How It Works</a></li>
                            <li><a href="#training-motion">Live Workouts</a></li>
                            <li><a href="#features">Features</a></li>
                            <li><a href="#pricing">Pricing</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Community</h4>
                        <ul>
                            <li><a href="#results">Athlete Results</a></li>
                            <li><a href="#faq">FAQ</a></li>
                            <li><Link to="/signup">Join Free</Link></li>
                            <li><Link to="/login">Member Login</Link></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Training Modes</h4>
                        <ul>
                            <li><a href="#training-motion" onClick={() => handleSelectTab(0)}>Strength Training</a></li>
                            <li><a href="#training-motion" onClick={() => handleSelectTab(1)}>HIIT Conditioning</a></li>
                            <li><a href="#training-motion" onClick={() => handleSelectTab(2)}>Cardio &amp; Endurance</a></li>
                            <li><a href="#training-motion" onClick={() => handleSelectTab(3)}>Mobility &amp; Recovery</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom-bar">
                    <span>© 2026 VitalFit. All rights reserved.</span>
                    <span>Built for peak performance.</span>
                </div>
            </footer>
        </div>
    );
}