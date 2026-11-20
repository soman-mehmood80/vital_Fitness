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
} from "lucide-react";
import "../styles/landing.css";

const NAV_LINKS = [
    { id: "how-it-works", label: "How It Works" },
    { id: "training-motion", label: "Workouts" },
    { id: "features", label: "Features" },
    { id: "results", label: "Results" },
    { id: "pricing", label: "Pricing" },
];

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

// 100% Verified Fitness & Workout Stock Videos
const WORKOUT_VIDEOS = [
    {
        id: "strength",
        title: "Strength & Hypertrophy",
        tag: "4K AI Tracking",
        desc: "Automatic rep counting, rest timers, and progressive overload analytics calibrated to your compound lifts.",
        videoUrl: "https://videos.pexels.com/video-files/5319856/5319856-uhd_2160_3840_25fps.mp4",
        poster: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop",
        bpm: "138 BPM",
        burn: "520 kcal/hr",
        zone: "Anaerobic",
    },
    {
        id: "hiit",
        title: "HIIT & Boxing Conditioning",
        tag: "Live HR Zones",
        desc: "Push your VO2 max with round pacing cues, explosive intervals, and real-time calorie velocity telemetry.",
        videoUrl: "https://videos.pexels.com/video-files/8471300/8471300-uhd_2160_3840_25fps.mp4",
        poster: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop",
        bpm: "168 BPM",
        burn: "740 kcal/hr",
        zone: "Peak Zone 5",
    },
    {
        id: "cardio",
        title: "Cardio & Outdoor Endurance",
        tag: "Smart Stamina",
        desc: "Track pace splits, heart-rate recovery, and hydration replenishment across outdoor runs and active recovery.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-jogging-across-a-narrow-footbridge-40768-large.mp4",
        poster: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1200&auto=format&fit=crop",
        bpm: "142 BPM",
        burn: "610 kcal/hr",
        zone: "Aerobic Zone 3",
    },
];

const TESTIMONIALS = [
    {
        badge: "-12 kg in 14 Weeks",
        quote: "Seeing my calories, protein, hydration, and lifting volume in one 3D dashboard finally made consistency effortless. Best fitness app I have ever used.",
        name: "Arjun Mehta",
        role: "Hybrid Athlete • Pro Member",
    },
    {
        badge: "+35 kg Deadlift PR",
        quote: "The AI recovery score stopped me from overtraining. Knowing exactly when to push heavy and when to deload took my strength to another level.",
        name: "Sarah Jenkins",
        role: "Strength Coach • London",
    },
    {
        badge: "42-Day Active Streak",
        quote: "Syncing my watch took 10 seconds. The live heart-rate zone breakdown during HIIT sessions keeps me locked in from warm-up to cooldown.",
        name: "Zainab Tariq",
        role: "Marathon Runner • Islamabad",
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
        q: "Can I track both home workouts and gym routines?",
        a: "Absolutely. Choose from 400+ strength, bodyweight, HIIT, and cardio movements—or build custom splits with your own sets, reps, and rest timers.",
    },
];

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeSection, setActiveSection] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Hero 3D Mouse Parallax State
    const [heroTilt, setHeroTilt] = useState({ rx: -4, ry: -8 });
    const [heroMuted, setHeroMuted] = useState(true);
    const heroVideoRef = useRef(null);

    // Cinema Video Showcase State
    const [activeTab, setActiveTab] = useState(0);
    const [cinemaTilt, setCinemaTilt] = useState({ rx: 0, ry: 0 });
    const [isPlaying, setIsPlaying] = useState(true);
    const [cinemaMuted, setCinemaMuted] = useState(true);
    const cinemaVideoRef = useRef(null);

    // Pricing & FAQ Interactive States
    const [yearlyBilling, setYearlyBilling] = useState(true);
    const [openFaq, setOpenFaq] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setScrolled(y > 24);

            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            setScrollProgress(docHeight > 0 ? Math.min(1, Math.max(0, y / docHeight)) : 0);

            // ScrollSpy for active nav pill
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

    useEffect(() => {
        if (cinemaVideoRef.current) {
            cinemaVideoRef.current.load();
            if (isPlaying) {
                cinemaVideoRef.current.play().catch(() => {});
            }
        }
    }, [activeTab]);

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
        setCinemaTilt({ rx: -y * 10, ry: x * 12 });
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

    const currentVideo = WORKOUT_VIDEOS[activeTab];

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
                        Track your workouts, nutrition, hydration, and recovery in real time.
                        Experience AI-powered biometric insights engineered for peak athletic performance.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/signup" className="primary-btn large">
                            Start For Free <ArrowRight size={18} />
                        </Link>
                        <a href="#training-motion" className="btn-secondary large">
                            <Play size={16} /> Watch Workouts
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
                </div>

                {/* Hero Right 3D Interactive Device */}
                <div className="hero-3d-stage">
                    <div
                        className="hero-3d-tilt-rig"
                        style={{
                            transform: `rotateX(${heroTilt.rx}deg) rotateY(${heroTilt.ry}deg)`,
                        }}
                    >
                        <div className="glow-effect" />
                        <div className="gyro-ring gyro-ring-1" />
                        <div className="gyro-ring gyro-ring-2" />

                        <div className="device-3d-frame">
                            <div className="device-3d-screen">
                                <video
                                    ref={heroVideoRef}
                                    className="device-video"
                                    autoPlay
                                    muted={heroMuted}
                                    loop
                                    playsInline
                                    poster="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop"
                                >
                                    <source
                                        src="https://videos.pexels.com/video-files/5319856/5319856-uhd_2160_3840_25fps.mp4"
                                        type="video/mp4"
                                    />
                                </video>

                                <div className="device-hud-overlay">
                                    <div className="hud-top-bar">
                                        <span className="hud-live-pill">
                                            <span className="pulse-dot" style={{ background: "#fff" }} />
                                            Live Session
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
                                        <div className="hud-workout-title">
                                            <strong>Full Body Power</strong>
                                            <span>Set 3 / 4</span>
                                        </div>
                                        <div className="hud-metrics-row">
                                            <div className="hud-metric">
                                                <b>148</b>
                                                <small>BPM</small>
                                            </div>
                                            <div className="hud-metric">
                                                <b>450</b>
                                                <small>KCAL</small>
                                            </div>
                                            <div className="hud-metric">
                                                <b>38:12</b>
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
                                <strong>450 kcal</strong>
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
            <section id="how-it-works" className="steps-section">
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
                            Log sets, reps, cardio splits, and water intake with an ultra-fast interface built for between-set speed at the gym.
                        </p>
                    </div>
                    <div className="step-card-3d">
                        <div className="step-number">03</div>
                        <h3>Unlock AI Progression</h3>
                        <p>
                            Watch your recovery curves, strength PRs, and consistency streaks compound with smart AI recommendations every morning.
                        </p>
                    </div>
                </div>
            </section>

            {/* Interactive 3D Video Showcase Section */}
            <section id="training-motion" className="video-showcase-section">
                <div className="section-header">
                    <span className="section-kicker">Training In Motion</span>
                    <h2>
                        See VitalFit <span>in action</span>
                    </h2>
                    <p>
                        Switch training disciplines below to preview how our real-time HUD tracks intensity, heart-rate zones, and calorie velocity.
                    </p>
                </div>

                <div className="video-studio-grid">
                    <div className="video-tabs-list">
                        {WORKOUT_VIDEOS.map((item, idx) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`video-tab-card ${activeTab === idx ? "active" : ""}`}
                                onClick={() => setActiveTab(idx)}
                            >
                                <div className="video-tab-header">
                                    <h3>
                                        <Dumbbell size={18} color="var(--accent-primary, #ef4444)" />
                                        {item.title}
                                    </h3>
                                    <span className="video-tab-tag">{item.tag}</span>
                                </div>
                                <p>{item.desc}</p>
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
                        <div className="cinema-screen">
                            <video
                                ref={cinemaVideoRef}
                                className="cinema-video"
                                autoPlay
                                muted={cinemaMuted}
                                loop
                                playsInline
                                poster={currentVideo.poster}
                            >
                                <source src={currentVideo.videoUrl} type="video/mp4" />
                            </video>

                            <div className="cinema-overlay">
                                <div className="cinema-top-badges">
                                    <span className="cinema-telemetry-pill">
                                        <span className="pulse-dot" />
                                        {currentVideo.title}
                                    </span>
                                    <span className="cinema-telemetry-pill">
                                        <Timer size={14} /> {currentVideo.zone}
                                    </span>
                                </div>

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
                                    </div>

                                    <div className="cinema-controls">
                                        <button
                                            type="button"
                                            className="cinema-ctrl-btn"
                                            onClick={toggleCinemaPlay}
                                            aria-label="Play or pause workout preview"
                                        >
                                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                                        </button>
                                        <button
                                            type="button"
                                            className="cinema-ctrl-btn"
                                            onClick={toggleCinemaSound}
                                            aria-label="Mute or unmute workout preview"
                                        >
                                            {cinemaMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3D Features Bento (6 Cards) */}
            <section id="features" className="features-section">
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
            <section id="results" className="results-section">
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
                                <p className="result-quote" style={{ marginTop: "16px" }}>
                                    “{t.quote}”
                                </p>
                            </div>
                            <div className="result-author">
                                <div>
                                    <strong>{t.name}</strong>
                                    <span>{t.role}</span>
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
            <section id="pricing" className="pricing-section">
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
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            className={`billing-btn ${yearlyBilling ? "active" : ""}`}
                            onClick={() => setYearlyBilling(true)}
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
                                <li><Check size={16} color="#22c55e" /> Unlimited workout & set logging</li>
                                <li><Check size={16} color="#22c55e" /> Daily hydration & sleep tracking</li>
                                <li><Check size={16} color="#22c55e" /> Calorie & basic macro counter</li>
                                <li><Check size={16} color="#22c55e" /> Streak & PR milestone badges</li>
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
                                <li><Check size={16} color="#ef4444" /> AI Coaching & daily readiness score</li>
                                <li><Check size={16} color="#ef4444" /> Apple Health, Garmin & Strava sync</li>
                                <li><Check size={16} color="#ef4444" /> Unlimited custom split templates</li>
                            </ul>
                        </div>
                        <Link to="/signup" className="primary-btn large full-w">
                            Start 14-Day Pro Trial <ArrowRight size={17} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ Accordion */}
            <section id="faq" className="faq-section">
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
                                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                                >
                                    {item.q}
                                    <ChevronDown size={18} className="faq-chevron" />
                                </button>
                                {isOpen && <div className="faq-answer">{item.a}</div>}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 3D Portal CTA Section */}
            <section id="cta" className="cta-section">
                <div className="cta-3d-card">
                    <h2>Ready to transform your routine?</h2>
                    <p>
                        Join over 10,000+ athletes tracking every rep, calorie, and milestone with VitalFit.
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
                        <h4>Start Today</h4>
                        <ul>
                            <li><Link to="/signup">Create Account</Link></li>
                            <li><a href="#training-motion">Strength Tracking</a></li>
                            <li><a href="#features">Hydration Monitor</a></li>
                            <li><a href="#features">AI Insights</a></li>
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