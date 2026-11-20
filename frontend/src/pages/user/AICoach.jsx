import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    Sparkles, BrainCircuit, Bot, RefreshCw, AlertCircle, Loader2,
    Lock, Send, Trash2, Calendar, Flame, Activity, Moon, Heart, 
    User, Zap, Droplets, Utensils, Footprints, ArrowUpRight,
} from "lucide-react";
import API from "../../services/api";
import { getStoredUser } from "../../utils/auth";

const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
};

const CountUp = ({ end, duration = 800, decimals = 0, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        let frame;
        const target = Number(end) || 0;

        const animate = (ts) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = target * easeOut;

            setCount(decimals > 0 ? Number(current.toFixed(decimals)) : Math.floor(current));
            if (progress < 1) frame = requestAnimationFrame(animate);
            else setCount(target);
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [end, duration, decimals]);

    const formatted =
        decimals > 0
            ? count.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals })
            : count.toLocaleString();

    return <>{formatted}{suffix}</>;
};

// Render **bold** segments safely in React
const renderInlineBold = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

// Render AI message with bullets & headings
const renderMessageContent = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    const blocks = [];
    let bulletBuffer = [];

    const flushBullets = (keyPrefix) => {
        if (bulletBuffer.length > 0) {
            blocks.push(
                <ul key={`ul-${keyPrefix}`}>
                    {bulletBuffer.map((item, idx) => (
                        <li key={idx}>{renderInlineBold(item)}</li>
                    ))}
                </ul>
            );
            bulletBuffer = [];
        }
    };

    lines.forEach((rawLine, idx) => {
        const trimmed = rawLine.trim();
        if (!trimmed) {
            flushBullets(idx);
            return;
        }
        if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•")) {
            bulletBuffer.push(trimmed.replace(/^[-*•]\s*/, ""));
        } else {
            flushBullets(idx);
            const cleanHeading = trimmed.replace(/^#{1,3}\s*/, "");
            blocks.push(<p key={`p-${idx}`}>{renderInlineBold(cleanHeading)}</p>);
        }
    });
    flushBullets("end");
    return blocks;
};

const QUICK_PROMPTS = [
    "Run full AI analysis of my data",
    "How is my recovery & sleep today?",
    "Review my calories & macros",
    "Suggest a 30-min workout for today",
    "Check my hydration & step pace",
];

export default function AICoach() {
    const user = getStoredUser();
    const firstName = user?.name?.split(" ")[0] || "Champ";
    const userKey = user?._id || user?.id || "guest";
    const todayKey = getLocalDate();
    const chatStorageKey = `vitalfit_ai_chat_${userKey}_${todayKey}`;

    const [telemetry, setTelemetry] = useState({
        caloriesBurned: 0, activeMinutes: 0, streak: 0, steps: 0, stepGoal: 10000,
        waterIntake: 0, waterGoal: 2500, sleepHours: 0, sleepGoal: 8,
        nutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    });

    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem(chatStorageKey);
            if (saved) return JSON.parse(saved);
        } catch {}
        return [
            {
                id: "welcome",
                role: "bot",
                source: "VitalFit AI",
                time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                text: `Hey **${firstName}**! I'm your **VitalFit AI Coach**.\n\nAsk me anything about your workouts, macros, sleep recovery, or hydration—or tap **Full AI Analysis** to generate a deep report from your logged history.`,
            },
        ];
    });

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [msg, setMsg] = useState("");
    const [isRateLimited, setIsRateLimited] = useState(false);

    const chatEndRef = useRef(null);

    const fetchTelemetry = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            const today = getLocalDate();
            const [dashRes, stepsRes] = await Promise.all([
                API.get("/api/dashboard/summary", { params: { date: today } }).catch(() => null),
                API.get("/api/steps/today", { params: { date: today } }).catch(() => null),
            ]);

            if (dashRes?.data) {
                const d = dashRes.data;
                setTelemetry({
                    caloriesBurned: d.workouts?.caloriesBurned || 0,
                    activeMinutes: d.workouts?.duration || 0,
                    streak: d.achievements?.streak || 0,
                    steps: stepsRes?.data?.steps || 0,
                    stepGoal: stepsRes?.data?.goal || 10000,
                    waterIntake: d.water?.total || 0,
                    waterGoal: d.water?.goal || 2500,
                    sleepHours: d.sleep?.hours || 0,
                    sleepGoal: d.sleep?.goal || 8,
                    nutrition: {
                        calories: d.nutrition?.calories || 0,
                        protein: d.nutrition?.protein || 0,
                        carbs: d.nutrition?.carbs || 0,
                        fats: d.nutrition?.fats || 0,
                    },
                });
            }
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTelemetry(false);
    }, [fetchTelemetry]);

    useEffect(() => {
        try {
            localStorage.setItem(chatStorageKey, JSON.stringify(messages));
        } catch {}
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading, chatStorageKey]);

    const pushMessage = (role, text, source = "VitalFit AI") => {
        const nowTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        setMessages((prev) => [
            ...prev,
            {
                id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                role,
                text,
                source,
                time: nowTime,
            },
        ]);
    };

    const handleApiError = (err) => {
        const status = err.response?.status;
        let errText = "";

        if (status === 429) {
            setIsRateLimited(true);
            errText = err.response?.data?.message || "Daily AI limit reached. Try again tomorrow.";
        } else if (status === 400) {
            errText = err.response?.data?.message || "Not enough data yet. Log some meals, workouts, or progress first.";
        } else if (!err.response) {
            errText = err.message || "Network error. Please check your connection.";
        } else {
            errText = err.response?.data?.message || "AI failed to analyze your data. Please try again.";
        }

        setMsg(errText);
        pushMessage("bot", `**Notice:** ${errText}`, "System");
    };

    // 1. Real Deep Analysis Call
    const runFullAnalysis = async (customUserPrompt = null) => {
        if (loading || isRateLimited) return;

        if (customUserPrompt) {
            pushMessage("user", customUserPrompt, "You");
        }

        setLoading(true);
        setMsg("");

        try {
            const res = await API.get("/api/ai/analyze", {
                params: { refresh: true },
            });
            const text =
                typeof res.data?.analysis === "string"
                    ? res.data.analysis
                    : res.data?.analysis?.text;

            if (!text || !text.trim()) {
                throw new Error("AI returned an empty analysis. Please try again.");
            }

            pushMessage(
                "bot",
                text,
                res.data.cached ? "AI Telemetry (Cached)" : "AI Deep Analysis"
            );
        } catch (err) {
            handleApiError(err);
        } finally {
            setLoading(false);
        }
    };

    // 2. Real Chat Call (Direct Backend AI Connection)
    const handleSend = async (promptOverride = null) => {
        const text = (promptOverride ?? input).trim();
        if (!text || loading) return;

        if (!promptOverride) setInput("");

        if (
            text.toLowerCase().includes("full ai analysis") ||
            text.toLowerCase().includes("analyze my data")
        ) {
            await runFullAnalysis(text);
            return;
        }

        pushMessage("user", text, "You");
        setLoading(true);
        setMsg("");

        try {
            const cleanHistory = messages
                .filter(
                    (m) =>
                        m.id !== "welcome" &&
                        !String(m.id).startsWith("welcome_") &&
                        m.source !== "System"
                )
                .slice(-6)
                .map((m) => ({
                    role: m.role === "bot" ? "assistant" : "user",
                    text: m.text,
                }));

            const res = await API.post("/api/ai/chat", {
                message: text,
                history: cleanHistory,
                stats: telemetry,
            });

            const botReply = res.data?.reply;
            if (!botReply || !botReply.trim()) {
                throw new Error("AI returned an empty response. Please try again.");
            }

            const sourceLabel = res.data?.modelUsed
                ? `AI • ${res.data.modelUsed}`
                : "VitalFit Live AI";

            pushMessage("bot", botReply, sourceLabel);
        } catch (err) {
            handleApiError(err);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        const fresh = [
            {
                id: `welcome_${Date.now()}`,
                role: "bot",
                source: "VitalFit AI",
                time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                text: `Chat cleared, **${firstName}**! Ask me anything about your training, nutrition, sleep, or hydration.`,
            },
        ];
        setMessages(fresh);
        setMsg("");
    };

    const todayFormatted = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });
    const sleepDecimals = telemetry.sleepHours % 1 !== 0 ? 1 : 0;

    return (
        <div className="bento-page-wrapper">
            {/* ===== TOP COMMAND HEADER ===== */}
            <section className="dashboard-header-bento">
                <div className="header-left-col">
                    <div className="header-meta-row">
                        <span className="date-pill"><Calendar size={12} /> {todayFormatted}</span>
                        <span className="readiness-pill">
                            <span className="pulse-dot" />
                            <BrainCircuit size={12} /> AI Coach: <strong>Online</strong>
                        </span>
                        <button
                            type="button"
                            className="refresh-mini-btn"
                            onClick={() => fetchTelemetry(true)}
                            disabled={refreshing}
                        >
                            <RefreshCw size={13} className={refreshing ? "spin" : ""} />
                        </button>
                    </div>

                    <div className="greeting-section">
                        <h1>AI Fitness <span>Coach</span></h1>
                        <p>Conversational coaching synced with your live workouts, macros, sleep, and hydration telemetry.</p>
                    </div>

                    <div className="quick-actions-row">
                        <button
                            type="button"
                            className="quick-action-chip primary"
                            onClick={() => runFullAnalysis("Run a full AI analysis of my data")}
                            disabled={loading || isRateLimited}
                        >
                            <Sparkles size={14} /> Full AI Analysis
                        </button>
                        <button
                            type="button"
                            className="quick-action-chip"
                            onClick={() => handleSend("How is my recovery & sleep today?")}
                            disabled={loading}
                        >
                            Recovery Check
                        </button>
                        <Link to="/dashboard" className="quick-action-chip">
                            Dashboard <ArrowUpRight size={13} />
                        </Link>
                    </div>
                </div>

                <div className="top-stats-row">
                    <div className="mini-stat">
                        <div className="mini-icon-box orange"><Flame size={20} /></div>
                        <div><strong><CountUp end={telemetry.caloriesBurned} /></strong><span>Burned kcal</span></div>
                    </div>
                    <div className="mini-stat">
                        <div className="mini-icon-box red"><Activity size={20} /></div>
                        <div><strong><CountUp end={telemetry.activeMinutes} /></strong><span>Active Mins</span></div>
                    </div>
                    <div className="mini-stat">
                        <div className="mini-icon-box purple"><Moon size={20} /></div>
                        <div><strong><CountUp end={telemetry.sleepHours} decimals={sleepDecimals} suffix="h" /></strong><span>Sleep Logged</span></div>
                    </div>
                    <div className="mini-stat">
                        <div className="mini-icon-box pink"><Heart size={20} fill="currentColor" /></div>
                        <div><strong><CountUp end={telemetry.streak} /></strong><span>Day Streak</span></div>
                    </div>
                </div>
            </section>

            {/* ===== BENTO GRID ===== */}
            <div className="bento-grid">
                <div className="bento-item col-span-4 ai-context-stack">
                    <div className="bento-header" style={{ marginBottom: 4 }}>
                        <h3><Zap size={17} color="var(--accent-primary, #ef4444)" /> Coach Context</h3>
                        <span className="pct-badge red">Live Sync</span>
                    </div>

                    <div className="ai-telemetry-mini-grid">
                        <div className="ai-tele-box"><span><Footprints size={12} color="#22c55e" /> Steps</span><strong>{telemetry.steps.toLocaleString()}</strong></div>
                        <div className="ai-tele-box"><span><Droplets size={12} color="#3b82f6" /> Water</span><strong>{telemetry.waterIntake.toLocaleString()} ml</strong></div>
                        <div className="ai-tele-box"><span><Utensils size={12} color="#f59e0b" /> Intake</span><strong>{telemetry.nutrition.calories.toLocaleString()} kcal</strong></div>
                        <div className="ai-tele-box"><span><Sparkles size={12} color="#ef4444" /> Protein</span><strong>{telemetry.nutrition.protein} g</strong></div>
                    </div>

                    {isRateLimited ? (
                        <div className="bento-error-banner" style={{ marginBottom: 0 }}><Lock size={15} /><span>{msg}</span></div>
                    ) : msg ? (
                        <div className="bento-error-banner" style={{ marginBottom: 0 }}><AlertCircle size={15} /><span>{msg}</span></div>
                    ) : null}

                    <div>
                        <span style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--text-muted)", marginBottom: 10 }}>
                            Quick Coach Prompts
                        </span>
                        <div className="ai-prompt-list">
                            {QUICK_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt}
                                    type="button"
                                    className="ai-prompt-btn"
                                    onClick={() => handleSend(prompt)}
                                    disabled={loading}
                                >
                                    <span>{prompt}</span>
                                    <ArrowUpRight size={14} color="#ef4444" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bento-item col-span-8 ai-chat-card">
                    <div className="ai-chat-topbar">
                        <div className="ai-bot-identity">
                            <div className="ai-bot-avatar"><Bot size={22} /></div>
                            <div>
                                <strong>VitalFit AI Coach</strong>
                                <span className="ai-online-status"><span className="ai-online-dot" /> Live AI Connected</span>
                            </div>
                        </div>
                        <div className="ai-chat-top-actions">
                            <button
                                type="button"
                                className="ai-icon-ghost-btn"
                                onClick={() => runFullAnalysis("Run full AI analysis of my data")}
                                disabled={loading || isRateLimited}
                            >
                                <RefreshCw size={13} className={loading ? "spin" : ""} /> Deep Analyze
                            </button>
                            <button
                                type="button"
                                className="ai-icon-ghost-btn"
                                onClick={clearChat}
                                disabled={loading}
                            >
                                <Trash2 size={13} /> Clear
                            </button>
                        </div>
                    </div>

                    <div className="ai-chat-messages">
                        {messages.map((m) => (
                            <div key={m.id} className={`ai-msg-row ${m.role}`}>
                                <div className={`ai-msg-avatar ${m.role}`}>
                                    {m.role === "bot" ? <Bot size={16} /> : <User size={16} />}
                                </div>
                                <div className="ai-msg-bubble">
                                    {renderMessageContent(m.text)}
                                    <div className="ai-msg-meta">
                                        <span className="ai-source-pill">{m.source}</span>
                                        <span>{m.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="ai-msg-row bot">
                                <div className="ai-msg-avatar bot"><Bot size={16} /></div>
                                <div className="ai-msg-bubble">
                                    <div className="ai-typing-dots" aria-label="Coach is typing"><span /><span /><span /></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <form
                        className="ai-chat-composer"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                    >
                        <div className="ai-suggestion-bar">
                            <button
                                type="button"
                                className="ai-chip-btn"
                                onClick={() => handleSend("Suggest a 30-min workout for today")}
                                disabled={loading}
                            >
                                30m Workout
                            </button>
                            <button
                                type="button"
                                className="ai-chip-btn"
                                onClick={() => handleSend("Check my hydration & step pace")}
                                disabled={loading}
                            >
                                Hydration &amp; Steps
                            </button>
                            <button
                                type="button"
                                className="ai-chip-btn"
                                onClick={() => handleSend("Review my calories & macros")}
                                disabled={loading}
                            >
                                Macro Check
                            </button>
                        </div>
                        <div className="ai-input-row">
                            <input
                                type="text"
                                className="premium-input"
                                placeholder="Ask VitalFit AI about workouts, macros, sleep, or recovery..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                className="ai-send-btn"
                                disabled={loading || !input.trim()}
                            >
                                {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}