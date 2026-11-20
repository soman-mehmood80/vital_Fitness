import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Dumbbell,
    Sparkles,
    Play,
    Check,
    Flame,
    Clock,
    ArrowUpRight,
    RotateCw,
    Loader2,
    Target,
    AlertCircle,
} from "lucide-react";
import API from "../services/api";
import "./BodySkeletonSelector.css";

const MUSCLE_GROUPS = {
    chest: {
        id: "chest",
        label: "Chest",
        anatomy: "Pectoralis Major & Minor",
        view: "front",
        modeId: "strength",
        defaultMinutes: 35,
        estCalories: 240,
        focus: "Upper, Mid & Lower Pec Hypertrophy",
        exercises: [
            { name: "Barbell / Dumbbell Bench Press", sets: "4 × 8–10", tag: "Compound" },
            { name: "Incline Dumbbell Press", sets: "3 × 10–12", tag: "Upper Chest" },
            { name: "Cable Fly / Pec Deck", sets: "3 × 12–15", tag: "Isolation" },
            { name: "Weighted / Standard Push-Ups", sets: "3 × Failure", tag: "Bodyweight" },
        ],
    },
    shoulders: {
        id: "shoulders",
        label: "Shoulders",
        anatomy: "Anterior, Lateral & Rear Deltoids",
        view: "front",
        modeId: "strength",
        defaultMinutes: 30,
        estCalories: 205,
        focus: "3D Delt Width & Overhead Stability",
        exercises: [
            { name: "Overhead Dumbbell Press", sets: "4 × 8–10", tag: "Compound" },
            { name: "Lateral Raises", sets: "4 × 12–15", tag: "Side Delts" },
            { name: "Front Plate / DB Raise", sets: "3 × 12", tag: "Front Delts" },
            { name: "Face Pulls", sets: "3 × 15", tag: "Rear Delts" },
        ],
    },
    biceps: {
        id: "biceps",
        label: "Biceps",
        anatomy: "Biceps Brachii & Brachialis",
        view: "front",
        modeId: "strength",
        defaultMinutes: 25,
        estCalories: 165,
        focus: "Peak Contraction & Arm Thickness",
        exercises: [
            { name: "EZ-Bar / Barbell Curls", sets: "4 × 10", tag: "Mass" },
            { name: "Incline Dumbbell Curls", sets: "3 × 12", tag: "Long Head" },
            { name: "Hammer Curls", sets: "3 × 12", tag: "Brachialis" },
            { name: "Preacher / Concentration Curls", sets: "3 × 12–15", tag: "Peak" },
        ],
    },
    forearms: {
        id: "forearms",
        label: "Forearms",
        anatomy: "Brachioradialis & Wrist Flexors",
        view: "front",
        modeId: "strength",
        defaultMinutes: 20,
        estCalories: 120,
        focus: "Grip Strength & Forearm Density",
        exercises: [
            { name: "Farmer's Walk", sets: "4 × 40m", tag: "Grip" },
            { name: "Reverse Barbell Curls", sets: "3 × 12", tag: "Extensors" },
            { name: "Wrist Curls", sets: "3 × 15–20", tag: "Flexors" },
            { name: "Dead Hang", sets: "3 × 45s", tag: "Endurance" },
        ],
    },
    abs: {
        id: "abs",
        label: "Abs & Core",
        anatomy: "Rectus Abdominis & Obliques",
        view: "front",
        modeId: "hiit",
        defaultMinutes: 20,
        estCalories: 190,
        focus: "Core Bracing, Stability & Definition",
        exercises: [
            { name: "Hanging Leg Raises", sets: "4 × 12–15", tag: "Lower Abs" },
            { name: "Cable / Weighted Crunches", sets: "3 × 15", tag: "Upper Abs" },
            { name: "Russian Twists", sets: "3 × 20", tag: "Obliques" },
            { name: "Plank Hold", sets: "3 × 60s", tag: "Core Brace" },
        ],
    },
    quads: {
        id: "quads",
        label: "Quads",
        anatomy: "Quadriceps Femoris",
        view: "front",
        modeId: "strength",
        defaultMinutes: 40,
        estCalories: 310,
        focus: "Lower-Body Power & Leg Sweep",
        exercises: [
            { name: "Barbell / Goblet Squats", sets: "4 × 8–10", tag: "Compound" },
            { name: "Leg Press", sets: "3 × 12", tag: "Strength" },
            { name: "Walking Lunges", sets: "3 × 12/leg", tag: "Unilateral" },
            { name: "Leg Extensions", sets: "3 × 15", tag: "Isolation" },
        ],
    },
    calves: {
        id: "calves",
        label: "Calves",
        anatomy: "Gastrocnemius & Soleus",
        view: "front",
        modeId: "strength",
        defaultMinutes: 20,
        estCalories: 130,
        focus: "Ankle Power & Lower-Leg Symmetry",
        exercises: [
            { name: "Standing Calf Raises", sets: "4 × 15–20", tag: "Gastroc" },
            { name: "Seated Calf Raises", sets: "3 × 15–20", tag: "Soleus" },
            { name: "Single-Leg Step Raises", sets: "3 × 15/leg", tag: "Balance" },
            { name: "Jump Rope Intervals", sets: "4 × 60s", tag: "Explosive" },
        ],
    },
    back: {
        id: "back",
        label: "Upper & Mid Back",
        anatomy: "Latissimus Dorsi, Rhomboids & Traps",
        view: "back",
        modeId: "strength",
        defaultMinutes: 40,
        estCalories: 280,
        focus: "V-Taper Width & Postural Thickness",
        exercises: [
            { name: "Pull-Ups / Lat Pulldown", sets: "4 × 8–12", tag: "Width" },
            { name: "Barbell / Chest-Supported Row", sets: "4 × 10", tag: "Thickness" },
            { name: "Seated Cable Row", sets: "3 × 12", tag: "Mid-Back" },
            { name: "Dumbbell Shrugs", sets: "3 × 15", tag: "Traps" },
        ],
    },
    triceps: {
        id: "triceps",
        label: "Triceps",
        anatomy: "Triceps Brachii (3 Heads)",
        view: "back",
        modeId: "strength",
        defaultMinutes: 25,
        estCalories: 165,
        focus: "Lockout Power & Arm Size",
        exercises: [
            { name: "Tricep Rope Pushdowns", sets: "4 × 12", tag: "Lateral Head" },
            { name: "Overhead Dumbbell Extension", sets: "3 × 12", tag: "Long Head" },
            { name: "Close-Grip Bench / Dips", sets: "3 × 10", tag: "Compound" },
            { name: "Skull Crushers", sets: "3 × 10–12", tag: "Mass" },
        ],
    },
    lowerback: {
        id: "lowerback",
        label: "Lower Back",
        anatomy: "Erector Spinae",
        view: "back",
        modeId: "mobility",
        defaultMinutes: 25,
        estCalories: 145,
        focus: "Spinal Stability & Posterior Chain",
        exercises: [
            { name: "Back Extensions", sets: "3 × 12–15", tag: "Strength" },
            { name: "Bird-Dog Hold", sets: "3 × 10/side", tag: "Stability" },
            { name: "Superman Holds", sets: "3 × 30s", tag: "Endurance" },
            { name: "Cat-Cow & Lumbar Mobility", sets: "3 × 10", tag: "Recovery" },
        ],
    },
    glutes: {
        id: "glutes",
        label: "Glutes",
        anatomy: "Gluteus Maximus & Medius",
        view: "back",
        modeId: "strength",
        defaultMinutes: 35,
        estCalories: 260,
        focus: "Hip Drive, Power & Shape",
        exercises: [
            { name: "Barbell Hip Thrusts", sets: "4 × 10", tag: "Primary" },
            { name: "Bulgarian Split Squats", sets: "3 × 10/leg", tag: "Unilateral" },
            { name: "Cable Glute Kickbacks", sets: "3 × 15/leg", tag: "Isolation" },
            { name: "Banded Abductions", sets: "3 × 20", tag: "Medius" },
        ],
    },
    hamstrings: {
        id: "hamstrings",
        label: "Hamstrings",
        anatomy: "Biceps Femoris & Semitendinosus",
        view: "back",
        modeId: "strength",
        defaultMinutes: 35,
        estCalories: 250,
        focus: "Hip Hinge Strength & Knee Health",
        exercises: [
            { name: "Romanian Deadlifts (RDL)", sets: "4 × 8–10", tag: "Hinge" },
            { name: "Seated / Lying Leg Curls", sets: "4 × 12", tag: "Isolation" },
            { name: "Good Mornings", sets: "3 × 10", tag: "Posterior" },
            { name: "Swiss Ball Leg Curls", sets: "3 × 10", tag: "Eccentric" },
        ],
    },
};

const QUICK_CHIPS = [
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "abs",
    "quads",
    "glutes",
    "hamstrings",
    "calves",
];

export default function BodySkeletonSelector({
    onStartMuscleTimer,
    onQuickLogMuscle,
    savingWorkout = false,
}) {
    const [view, setView] = useState("front");
    const [selectedId, setSelectedId] = useState("chest");
    const [hoveredId, setHoveredId] = useState(null);
    const [checkedExercises, setCheckedExercises] = useState([]);
    const [loggedToast, setLoggedToast] = useState("");
    const [aiPlan, setAiPlan] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    const selected = MUSCLE_GROUPS[selectedId] || MUSCLE_GROUPS.chest;
    const activePreview = hoveredId ? MUSCLE_GROUPS[hoveredId] : selected;

    const handleSelectMuscle = (id) => {
        const group = MUSCLE_GROUPS[id];
        if (!group) return;
        setSelectedId(id);
        setView(group.view);
        setCheckedExercises([]);
        setAiPlan("");
        setAiError("");
    };

    const toggleExercise = (exName) => {
        setCheckedExercises((prev) =>
            prev.includes(exName)
                ? prev.filter((item) => item !== exName)
                : [...prev, exName]
        );
    };

    const handleQuickLog = async () => {
        if (!onQuickLogMuscle || savingWorkout) return;
        const chosen =
            checkedExercises.length > 0
                ? checkedExercises
                : selected.exercises.map((e) => e.name);

        const ok = await onQuickLogMuscle(selected, chosen);
        if (ok) {
            setLoggedToast(`Saved ${selected.label} (${selected.estCalories} kcal)`);
            setTimeout(() => setLoggedToast(""), 2600);
        }
    };

    const handleGenerateAIPlan = async () => {
        if (aiLoading) return;
        setAiLoading(true);
        setAiError("");
        try {
            const res = await API.post("/api/ai/workout-plan", {
                goal: `${selected.label} workout targeting ${selected.anatomy} (${selected.focus})`,
                minutes: selected.defaultMinutes,
            });
            if (!res.data?.plan) {
                throw new Error("AI could not generate a plan. Please try again.");
            }
            setAiPlan(res.data.plan);
        } catch (err) {
            setAiError(
                err.response?.data?.message ||
                    err.message ||
                    "Failed to generate AI routine."
            );
        } finally {
            setAiLoading(false);
        }
    };

    const getMuscleProps = (id) => {
        const isSelected = selectedId === id;
        const isHovered = hoveredId === id;
        return {
            className: `skeleton-muscle ${isSelected ? "selected" : ""} ${
                isHovered ? "hovered" : ""
            }`,
            role: "button",
            tabIndex: 0,
            "aria-label": `Select ${MUSCLE_GROUPS[id].label}`,
            onClick: () => handleSelectMuscle(id),
            onMouseEnter: () => setHoveredId(id),
            onMouseLeave: () => setHoveredId(null),
            onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectMuscle(id);
                }
            },
        };
    };

    return (
        <div className="bento-item body-skeleton-card">
            <div className="bento-header skeleton-topbar">
                <div className="bento-title-stack">
                    <h3>
                        <Target size={17} color="var(--accent-primary, #ef4444)" />{" "}
                        Interactive Body Skeleton Workout Picker
                    </h3>
                    <span className="skeleton-subtitle">
                        Click any muscle on the skeleton (e.g. Chest, Back, Quads) to pick exercises, start your timer, or save directly to your workout logs.
                    </span>
                </div>

                <div className="skeleton-view-toggle" role="tablist" aria-label="Body view">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={view === "front"}
                        className={`chart-toggle-btn ${view === "front" ? "active" : ""}`}
                        onClick={() => setView("front")}
                    >
                        Front
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={view === "back"}
                        className={`chart-toggle-btn ${view === "back" ? "active" : ""}`}
                        onClick={() => setView("back")}
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        className="skeleton-flip-btn"
                        onClick={() => setView((v) => (v === "front" ? "back" : "front"))}
                        title="Flip skeleton view"
                        aria-label="Flip skeleton view"
                    >
                        <RotateCw size={14} />
                    </button>
                </div>
            </div>

            <div className="skeleton-layout">
                {/* Left: Interactive Anatomical Body SVG */}
                <div className="skeleton-stage">
                    <div className="skeleton-hover-pill">
                        <span>{view === "front" ? "Anterior View" : "Posterior View"}</span>
                        <strong>{activePreview.label}</strong>
                    </div>

                    <svg
                        viewBox="0 0 220 420"
                        className="skeleton-svg"
                        aria-label="Interactive human body muscle skeleton"
                    >
                        <defs>
                            <filter id="muscleGlow" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="3.5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        <g className="skeleton-base-silhouette">
                            <ellipse cx="110" cy="34" rx="16" ry="20" />
                            <path d="M 101 52 L 119 52 L 122 66 L 98 66 Z" />
                            <path d="M 74 68 Q 110 62 146 68 L 138 196 Q 110 206 82 196 Z" />
                            <path d="M 82 194 L 138 194 L 146 218 L 110 224 L 74 218 Z" />
                            <path d="M 74 70 L 54 80 L 46 144 L 36 198 L 48 202 L 62 148 L 72 96 Z" />
                            <path d="M 146 70 L 166 80 L 174 144 L 184 198 L 172 202 L 158 148 L 148 96 Z" />
                            <path d="M 76 214 L 106 218 L 102 300 L 98 378 L 78 378 L 74 300 Z" />
                            <path d="M 144 214 L 114 218 L 118 300 L 122 378 L 142 378 L 146 300 Z" />
                        </g>

                        <g className="skeleton-bone-guides">
                            {view === "front" ? (
                                <>
                                    <path d="M 80 68 Q 110 76 140 68" />
                                    <line x1="110" y1="73" x2="110" y2="112" />
                                    <path d="M 84 202 L 110 214 L 136 202" />
                                </>
                            ) : (
                                <>
                                    <line x1="110" y1="56" x2="110" y2="196" strokeDasharray="3 3" />
                                    <path d="M 82 76 L 110 88 L 138 76" />
                                </>
                            )}
                            <circle cx="64" cy="80" r="2.5" />
                            <circle cx="156" cy="80" r="2.5" />
                            <circle cx="54" cy="145" r="2.5" />
                            <circle cx="166" cy="145" r="2.5" />
                            <circle cx="88" cy="298" r="3" />
                            <circle cx="132" cy="298" r="3" />
                        </g>

                        {view === "front" && (
                            <g>
                                <g {...getMuscleProps("shoulders")}>
                                    <path d="M 55 84 C 55 68, 72 64, 80 72 L 75 96 C 65 96, 56 92, 55 84 Z" />
                                    <path d="M 165 84 C 165 68, 148 64, 140 72 L 145 96 C 155 96, 164 92, 165 84 Z" />
                                </g>
                                <g {...getMuscleProps("chest")}>
                                    <path d="M 79 75 C 84 71, 102 73, 108 79 L 108 109 C 95 113, 81 108, 77 98 Z" />
                                    <path d="M 141 75 C 136 71, 118 73, 112 79 L 112 109 C 125 113, 139 108, 143 98 Z" />
                                </g>
                                <g {...getMuscleProps("biceps")}>
                                    <path d="M 54 98 L 71 98 L 66 142 L 49 138 Z" />
                                    <path d="M 166 98 L 149 98 L 154 142 L 171 138 Z" />
                                </g>
                                <g {...getMuscleProps("forearms")}>
                                    <path d="M 48 147 L 63 150 L 52 195 L 39 191 Z" />
                                    <path d="M 172 147 L 157 150 L 168 195 L 181 191 Z" />
                                </g>
                                <g {...getMuscleProps("abs")}>
                                    <rect x="90" y="114" width="18" height="16" rx="4" />
                                    <rect x="112" y="114" width="18" height="16" rx="4" />
                                    <rect x="90" y="133" width="18" height="16" rx="4" />
                                    <rect x="112" y="133" width="18" height="16" rx="4" />
                                    <rect x="91" y="152" width="17" height="16" rx="4" />
                                    <rect x="112" y="152" width="17" height="16" rx="4" />
                                    <path d="M 92 171 L 108 171 L 108 194 Q 98 192 92 184 Z" />
                                    <path d="M 128 171 L 112 171 L 112 194 Q 122 192 128 184 Z" />
                                </g>
                                <g {...getMuscleProps("quads")}>
                                    <path d="M 75 206 L 106 212 L 102 292 L 77 288 Z" />
                                    <path d="M 145 206 L 114 212 L 118 292 L 143 288 Z" />
                                </g>
                                <g {...getMuscleProps("calves")}>
                                    <path d="M 76 308 L 99 308 L 95 372 L 79 370 Z" />
                                    <path d="M 144 308 L 121 308 L 125 372 L 141 370 Z" />
                                </g>
                            </g>
                        )}

                        {view === "back" && (
                            <g>
                                <g {...getMuscleProps("shoulders")}>
                                    <path d="M 55 84 C 55 68, 72 64, 80 72 L 75 96 C 65 96, 56 92, 55 84 Z" />
                                    <path d="M 165 84 C 165 68, 148 64, 140 72 L 145 96 C 155 96, 164 92, 165 84 Z" />
                                </g>
                                <g {...getMuscleProps("back")}>
                                    <path d="M 96 58 L 110 54 L 124 58 L 140 78 L 132 146 L 112 140 L 112 66 L 108 66 L 108 140 L 88 146 L 80 78 Z" />
                                </g>
                                <g {...getMuscleProps("triceps")}>
                                    <path d="M 54 98 L 71 98 L 66 142 L 49 138 Z" />
                                    <path d="M 166 98 L 149 98 L 154 142 L 171 138 Z" />
                                </g>
                                <g {...getMuscleProps("forearms")}>
                                    <path d="M 48 147 L 63 150 L 52 195 L 39 191 Z" />
                                    <path d="M 172 147 L 157 150 L 168 195 L 181 191 Z" />
                                </g>
                                <g {...getMuscleProps("lowerback")}>
                                    <path d="M 90 148 L 108 143 L 108 182 L 88 182 Z" />
                                    <path d="M 130 148 L 112 143 L 112 182 L 132 182 Z" />
                                </g>
                                <g {...getMuscleProps("glutes")}>
                                    <path d="M 78 186 Q 94 182 108 190 L 108 228 Q 90 232 76 218 Z" />
                                    <path d="M 142 186 Q 126 182 112 190 L 112 228 Q 130 232 144 218 Z" />
                                </g>
                                <g {...getMuscleProps("hamstrings")}>
                                    <path d="M 77 234 L 106 234 L 102 294 L 78 292 Z" />
                                    <path d="M 143 234 L 114 234 L 118 294 L 142 292 Z" />
                                </g>
                                <g {...getMuscleProps("calves")}>
                                    <path d="M 76 306 L 100 306 L 96 368 L 79 366 Z" />
                                    <path d="M 144 306 L 120 306 L 124 368 L 141 366 Z" />
                                </g>
                            </g>
                        )}
                    </svg>

                    <div className="skeleton-quick-pills">
                        {QUICK_CHIPS.map((id) => (
                            <button
                                key={id}
                                type="button"
                                className={`skeleton-chip ${selectedId === id ? "active" : ""}`}
                                onClick={() => handleSelectMuscle(id)}
                            >
                                {MUSCLE_GROUPS[id].label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Muscle Exercises & Actions */}
                <div className="skeleton-details-panel">
                    <div className="skeleton-selected-header">
                        <div>
                            <span className="skeleton-anatomy-tag">{selected.anatomy}</span>
                            <h4>{selected.label} Workout</h4>
                            <p>{selected.focus}</p>
                        </div>
                        <div className="skeleton-est-badges">
                            <span>
                                <Clock size={13} /> {selected.defaultMinutes} min
                            </span>
                            <span>
                                <Flame size={13} color="#ef4444" /> ~{selected.estCalories} kcal
                            </span>
                        </div>
                    </div>

                    <div className="skeleton-exercise-list">
                        {selected.exercises.map((ex) => {
                            const isChecked = checkedExercises.includes(ex.name);
                            return (
                                <button
                                    key={ex.name}
                                    type="button"
                                    className={`skeleton-ex-row ${isChecked ? "selected" : ""}`}
                                    onClick={() => toggleExercise(ex.name)}
                                >
                                    <div className="skeleton-ex-left">
                                        <span className="skeleton-ex-check">
                                            {isChecked ? <Check size={14} /> : <Dumbbell size={14} />}
                                        </span>
                                        <div>
                                            <strong>{ex.name}</strong>
                                            <small>{ex.sets}</small>
                                        </div>
                                    </div>
                                    <span className="skeleton-ex-tag">{ex.tag}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="skeleton-actions-bar">
                        <button
                            type="button"
                            className="skeleton-btn primary"
                            onClick={() => onStartMuscleTimer && onStartMuscleTimer(selected)}
                        >
                            <Play size={15} /> Start {selected.label} Timer
                        </button>

                        <button
                            type="button"
                            className="skeleton-btn secondary"
                            onClick={handleQuickLog}
                            disabled={savingWorkout}
                        >
                            {savingWorkout ? (
                                <Loader2 size={15} className="spin" />
                            ) : (
                                <Check size={15} />
                            )}{" "}
                            Quick Log
                        </button>

                        <button
                            type="button"
                            className="skeleton-btn ai"
                            onClick={handleGenerateAIPlan}
                            disabled={aiLoading}
                        >
                            {aiLoading ? (
                                <Loader2 size={15} className="spin" />
                            ) : (
                                <Sparkles size={15} />
                            )}
                            AI {selected.label} Plan
                        </button>

                        <Link
                            to={`/workouts?muscle=${selected.id}`}
                            state={{ muscle: selected.id, muscleLabel: selected.label }}
                            className="skeleton-btn ghost"
                        >
                            All Workouts <ArrowUpRight size={14} />
                        </Link>
                    </div>

                    {loggedToast && <div className="mini-toast">{loggedToast}</div>}

                    {aiError && (
                        <div className="dash-error-banner" style={{ marginTop: 8, marginBottom: 0 }}>
                            <AlertCircle size={15} />
                            <span>{aiError}</span>
                        </div>
                    )}

                    {aiPlan && (
                        <div className="skeleton-ai-plan-box">
                            <div className="skeleton-ai-plan-head">
                                <span>
                                    <Sparkles size={14} color="#ef4444" /> AI Generated{" "}
                                    {selected.label} Routine
                                </span>
                                <button type="button" onClick={() => setAiPlan("")}>
                                    Close
                                </button>
                            </div>
                            <pre className="skeleton-ai-plan-text">{aiPlan}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}