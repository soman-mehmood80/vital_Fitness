const Nutrition = require("../model/Nutrition");
const WorkoutLog = require("../model/WorkoutLog");
const Progress = require("../model/Progress");
const User = require("../model/User");
const {
  generateAIResponse,
  generateChatResponse,
  generateWorkoutPlan,
  generateNutritionAdvice,
} = require("../services/aiServices");
const { getDaysAgoUTC } = require("../utils/dateUtils");

const analysisCache = new Map();
const MAX_CACHE_ENTRIES = 500;

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age > 0 && age < 120 ? age : null;
};

const normalizeHeightCm = (height) => {
  const h = Number(height);
  if (!h || Number.isNaN(h) || h <= 0) return null;
  return h <= 3 ? Math.round(h * 100) : Math.round(h);
};

const mapActivityMultiplier = (activityLevel = "") => {
  const lvl = String(activityLevel).toLowerCase().trim();
  if (lvl.includes("very") || lvl.includes("athlete") || lvl.includes("extra"))
    return 1.725;
  if (lvl.includes("active") && !lvl.includes("in")) return 1.55;
  if (lvl.includes("moderate")) return 1.55;
  if (lvl.includes("light")) return 1.375;
  return 1.2;
};

const mapActivityToWorkoutLevel = (activityLevel = "") => {
  const lvl = String(activityLevel).toLowerCase().trim();
  if (lvl.includes("very") || lvl.includes("athlete") || lvl.includes("high"))
    return "advanced";
  if (lvl.includes("moderate") || (lvl.includes("active") && !lvl.includes("in")))
    return "intermediate";
  return "beginner";
};

const calculateBiometricsAndTargets = ({
  age,
  gender,
  heightCm,
  weightKg,
  activityLevel,
  fitnessGoal,
}) => {
  const bmi =
    heightCm && weightKg
      ? +(weightKg / Math.pow(heightCm / 100, 2)).toFixed(1)
      : null;

  if (!heightCm || !weightKg || !age) {
    return { bmi, recommendedTargets: null };
  }

  const g = String(gender || "").toLowerCase();
  const genderOffset = g === "female" ? -161 : g === "male" ? 5 : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset;
  const tdee = Math.round(bmr * mapActivityMultiplier(activityLevel));

  const goal = String(fitnessGoal || "").toLowerCase();
  let targetCalories = tdee;
  let proteinPerKg = 1.6;

  if (
    goal.includes("lose") ||
    goal.includes("cut") ||
    goal.includes("fat") ||
    goal.includes("weight loss")
  ) {
    targetCalories = Math.max(1200, tdee - 450);
    proteinPerKg = 1.8;
  } else if (
    goal.includes("muscle") ||
    goal.includes("gain") ||
    goal.includes("bulk") ||
    goal.includes("strength")
  ) {
    targetCalories = tdee + 300;
    proteinPerKg = 2.0;
  } else if (
    goal.includes("endurance") ||
    goal.includes("stamina") ||
    goal.includes("run")
  ) {
    targetCalories = tdee + 150;
    proteinPerKg = 1.5;
  }

  const targetProtein = Math.round(weightKg * proteinPerKg);
  const targetFats = Math.round((targetCalories * 0.25) / 9);
  const remainingCals = Math.max(
    0,
    targetCalories - targetProtein * 4 - targetFats * 9
  );
  const targetCarbs = Math.round(remainingCals / 4);

  return {
    bmi,
    recommendedTargets: {
      tdee,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
    },
  };
};

const buildProfileSummaryString = (ctx) => {
  const parts = [];
  if (ctx.profile.age) parts.push(`${ctx.profile.age}yo`);
  if (ctx.profile.gender) parts.push(ctx.profile.gender);
  if (ctx.profile.heightCm) parts.push(`${ctx.profile.heightCm}cm`);
  if (typeof ctx.currentWeight === "number") parts.push(`${ctx.currentWeight}kg`);
  if (ctx.bmi) parts.push(`BMI ${ctx.bmi}`);
  if (ctx.profile.activityLevel) parts.push(`activity: ${ctx.profile.activityLevel}`);
  if (ctx.profile.fitnessGoal) parts.push(`goal: ${ctx.profile.fitnessGoal}`);
  return parts.length > 0 ? parts.join(", ") : "general fitness profile";
};

const getUserFitnessContext = async (userId) => {
  const last7Days = getDaysAgoUTC(7);
  const last30Days = getDaysAgoUTC(30);

  const [nutritionLogs, workoutLogs, progress30Days, user] = await Promise.all([
    Nutrition.find({ userId, date: { $gte: last7Days } }).lean(),
    WorkoutLog.find({ userId, completedAt: { $gte: last7Days } })
      .sort({ completedAt: -1 })
      .lean(),
    Progress.find({ userId, date: { $gte: last30Days } })
      .sort({ date: 1 })
      .lean(),
    User.findById(userId)
      .select(
        "name gender height dateOfBirth fitnessGoal activityLevel waterGoal sleepGoal stepGoal streak"
      )
      .lean(),
  ]);

  const dailyNutrition = {};
  nutritionLogs.forEach((log) => {
    const dateKey = new Date(log.date).toISOString().split("T")[0];
    if (!dailyNutrition[dateKey]) {
      dailyNutrition[dateKey] = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    }
    dailyNutrition[dateKey].calories += log.calories || 0;
    dailyNutrition[dateKey].protein += log.protein || 0;
    dailyNutrition[dateKey].carbs += log.carbs || 0;
    dailyNutrition[dateKey].fats += log.fats || 0;
  });

  const daysWithNutrition = Object.keys(dailyNutrition).length;
  const avgCalories =
    daysWithNutrition > 0
      ? Math.round(
        Object.values(dailyNutrition).reduce((s, d) => s + d.calories, 0) /
        daysWithNutrition
      )
      : 0;
  const avgProtein =
    daysWithNutrition > 0
      ? Math.round(
        Object.values(dailyNutrition).reduce((s, d) => s + d.protein, 0) /
        daysWithNutrition
      )
      : 0;
  const avgCarbs =
    daysWithNutrition > 0
      ? Math.round(
        Object.values(dailyNutrition).reduce((s, d) => s + d.carbs, 0) /
        daysWithNutrition
      )
      : 0;
  const avgFats =
    daysWithNutrition > 0
      ? Math.round(
        Object.values(dailyNutrition).reduce((s, d) => s + d.fats, 0) /
        daysWithNutrition
      )
      : 0;

  const weightEntries = progress30Days.filter(
    (p) => typeof p.weight === "number" && !Number.isNaN(p.weight) && p.weight > 0
  );

  let weightChange = 0;
  let currentWeight = "Not logged";
  let numericWeight = null;

  if (weightEntries.length >= 2) {
    const oldest = weightEntries[0].weight;
    const latest = weightEntries[weightEntries.length - 1].weight;
    currentWeight = latest;
    numericWeight = latest;
    weightChange = +(latest - oldest).toFixed(1);
  } else if (weightEntries.length === 1) {
    currentWeight = weightEntries[0].weight;
    numericWeight = weightEntries[0].weight;
  }

  const totalWorkouts = workoutLogs.length;
  const totalBurned = workoutLogs.reduce(
    (s, l) => s + (l.caloriesBurned || 0),
    0
  );
  const recentWorkouts = workoutLogs
    .slice(0, 5)
    .map(
      (w) =>
        w.workoutTitleSnapshot ||
        w.title ||
        w.workoutName ||
        w.workoutCategorySnapshot ||
        w.type ||
        w.category ||
        "Workout"
    );

  const age = calculateAge(user?.dateOfBirth);
  const heightCm = normalizeHeightCm(user?.height);

  const { bmi, recommendedTargets } = calculateBiometricsAndTargets({
    age,
    gender: user?.gender,
    heightCm,
    weightKg: numericWeight,
    activityLevel: user?.activityLevel,
    fitnessGoal: user?.fitnessGoal,
  });

  const profile = {
    name: user?.name || "Athlete",
    age,
    gender: user?.gender || null,
    heightCm,
    fitnessGoal: user?.fitnessGoal || null,
    activityLevel: user?.activityLevel || null,
    streak: user?.streak?.current || user?.streak || 0,
  };

  const hasLogs =
    nutritionLogs.length > 0 ||
    workoutLogs.length > 0 ||
    progress30Days.length > 0;
  const hasProfile = Boolean(
    profile.fitnessGoal || profile.activityLevel || heightCm || age
  );

  return {
    hasData: hasLogs || hasProfile,
    hasLogs,
    hasProfile,
    profile,
    bmi,
    recommendedTargets,
    daysWithNutrition,
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFats,
    totalWorkouts,
    totalBurned,
    recentWorkouts,
    currentWeight,
    weightChange,
    goals: {
      waterGoal: user?.waterGoal || 2500,
      sleepGoal: user?.sleepGoal || 8,
      stepGoal: user?.stepGoal || 10000,
    },
  };
};

// 1. GET /api/ai/analyze
const analyzeProgress = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    const forceRefresh = req.query.refresh === "true";
    const ctx = await getUserFitnessContext(userId);

    if (!ctx.hasData) {
      return res.status(400).json({
        success: false,
        message:
          "Not enough data for AI analysis. Please complete your fitness profile or log some meals, workouts, or progress first.",
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const fingerprint = [
      ctx.profile.fitnessGoal || "none",
      ctx.profile.activityLevel || "none",
      ctx.daysWithNutrition,
      ctx.totalWorkouts,
      ctx.currentWeight,
    ].join("|");
    const cacheKey = `ai:${userId}:${today}:${fingerprint}`;

    if (!forceRefresh && analysisCache.has(cacheKey)) {
      const cached = analysisCache.get(cacheKey);
      return res.status(200).json({
        success: true,
        analysis: cached.analysis,
        contextUsed: cached.contextUsed,
        recommendedTargets: cached.recommendedTargets,
        cached: true,
      });
    }

    const targetLine = ctx.recommendedTargets
      ? `${ctx.recommendedTargets.targetCalories} kcal (P: ${ctx.recommendedTargets.targetProtein}g, C: ${ctx.recommendedTargets.targetCarbs}g, F: ${ctx.recommendedTargets.targetFats}g)`
      : "Not enough body metrics yet to compute TDEE";

    const prompt = `
You are VitalFit's personal fitness & nutrition AI coach. Analyze this user's profile and 7-day data:

User Profile:
- Name: ${ctx.profile.name}
- Age: ${ctx.profile.age ?? "Not set"}
- Gender: ${ctx.profile.gender || "Not set"}
- Height: ${ctx.profile.heightCm ? `${ctx.profile.heightCm} cm` : "Not set"}
- Current Weight: ${typeof ctx.currentWeight === "number"
        ? `${ctx.currentWeight} kg`
        : "Not logged"
      }
- BMI: ${ctx.bmi ?? "Not calculated"}
- Weight Change (last 30 days): ${ctx.weightChange} kg
- Primary Fitness Goal: ${ctx.profile.fitnessGoal || "Not specified"}
- Activity Level: ${ctx.profile.activityLevel || "Not specified"}
- Daily Targets: Water ${ctx.goals.waterGoal} ml, Sleep ${ctx.goals.sleepGoal
      } hrs, Steps ${ctx.goals.stepGoal}
- Calculated Daily Nutrition Target: ${targetLine}

Last 7 Days Activity (${ctx.daysWithNutrition} days nutrition logged):
- Avg Daily Calories: ${ctx.avgCalories} kcal (Avg Protein: ${ctx.avgProtein
      }g, Carbs: ${ctx.avgCarbs}g, Fats: ${ctx.avgFats}g)
- Total Workouts: ${ctx.totalWorkouts} (Calories burned: ${ctx.totalBurned} kcal)
- Recent Workouts: ${ctx.recentWorkouts.length > 0
        ? ctx.recentWorkouts.join(", ")
        : "None logged yet"
      }

Instructions:
1. Address ${ctx.profile.name} directly in a motivating, practical tone.
2. Provide a 2-paragraph summary evaluating how their current activity/nutrition aligns with their "${ctx.profile.fitnessGoal || "fitness"
      }" goal and "${ctx.profile.activityLevel || "current"}" activity level.
3. Give 3 specific, actionable tips for next week (1 workout recommendation, 1 nutrition/macro tip, 1 hydration/sleep recovery tip).
Do not include any medical diagnoses.
    `.trim();

    let aiResponse = await generateAIResponse(prompt);

    if (!aiResponse || typeof aiResponse !== "string" || aiResponse.length < 20) {
      throw new Error("AI returned an invalid analysis response.");
    }
    if (aiResponse.length > 2500) aiResponse = aiResponse.slice(0, 2500);

    const contextUsed = {
      profile: ctx.profile,
      bmi: ctx.bmi,
      avgCalories: ctx.avgCalories,
      avgProtein: ctx.avgProtein,
      totalWorkouts: ctx.totalWorkouts,
      currentWeight: ctx.currentWeight,
      weightChange: ctx.weightChange,
    };

    if (analysisCache.size >= MAX_CACHE_ENTRIES) {
      analysisCache.clear();
    }
    analysisCache.set(cacheKey, {
      analysis: aiResponse,
      contextUsed,
      recommendedTargets: ctx.recommendedTargets,
    });

    res.status(200).json({
      success: true,
      analysis: aiResponse,
      contextUsed,
      recommendedTargets: ctx.recommendedTargets,
    });
  } catch (error) {
    console.error("analyzeProgress error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "AI analysis failed",
    });
  }
};

// 2. POST /api/ai/chat
const chatWithCoach = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    const { message, history = [], stats = {} } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const dbContext = await getUserFitnessContext(userId);
    const mergedStats = {
      profile: {
        name: dbContext.profile.name,
        age: dbContext.profile.age,
        gender: dbContext.profile.gender,
        heightCm: dbContext.profile.heightCm,
        fitnessGoal: dbContext.profile.fitnessGoal,
        activityLevel: dbContext.profile.activityLevel,
        bmi: dbContext.bmi,
        streak: dbContext.profile.streak,
      },
      dailyGoals: dbContext.goals,
      recommendedDailyTargets: dbContext.recommendedTargets,
      today: stats,
      last7Days: {
        avgCalories: dbContext.avgCalories,
        avgProtein: dbContext.avgProtein,
        avgCarbs: dbContext.avgCarbs,
        avgFats: dbContext.avgFats,
        totalWorkouts: dbContext.totalWorkouts,
        totalBurned: dbContext.totalBurned,
        recentWorkouts: dbContext.recentWorkouts,
        currentWeight: dbContext.currentWeight,
        weightChange30d: dbContext.weightChange,
      },
    };

    const { text, model } = await generateChatResponse(
      message.trim(),
      mergedStats,
      history
    );

    if (!text) {
      throw new Error("AI returned an empty chat reply.");
    }

    res.status(200).json({
      success: true,
      reply: text,
      modelUsed: model,
      profileUsed: dbContext.profile,
    });
  } catch (error) {
    console.error("chatWithCoach error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "AI chat failed",
    });
  }
};

// 3. POST /api/ai/workout-plan
const getWorkoutRecommendation = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    const { goal, level, minutes, equipment } = req.body || {};

    const ctx = await getUserFitnessContext(userId);
    const resolvedGoal =
      goal || ctx.profile.fitnessGoal || "general fitness & strength";
    const resolvedLevel =
      level || mapActivityToWorkoutLevel(ctx.profile.activityLevel);
    const resolvedMinutes = Number(minutes) > 0 ? Number(minutes) : 45;
    const resolvedEquipment = equipment || "bodyweight or standard gym equipment";

    const profileSummary = buildProfileSummaryString(ctx);
    const recentNote =
      ctx.recentWorkouts.length > 0
        ? `; recent workouts: ${ctx.recentWorkouts.join(", ")}`
        : "";

    const contextualGoal = `${resolvedGoal} (User Profile: ${profileSummary}${recentNote})`;

    const { text, model } = await generateWorkoutPlan({
      goal: contextualGoal,
      level: resolvedLevel,
      minutes: resolvedMinutes,
      equipment: resolvedEquipment,
    });

    res.status(200).json({
      success: true,
      plan: text,
      modelUsed: model,
      basedOnProfile: {
        goal: resolvedGoal,
        level: resolvedLevel,
        minutes: resolvedMinutes,
        equipment: resolvedEquipment,
        activityLevel: ctx.profile.activityLevel,
        fitnessGoal: ctx.profile.fitnessGoal,
      },
    });
  } catch (error) {
    console.error("getWorkoutRecommendation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Workout generation failed",
    });
  }
};

// 4. POST /api/ai/nutrition-advice
const getNutritionRecommendation = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    const { calories, protein, carbs, fats, goal } = req.body || {};

    const ctx = await getUserFitnessContext(userId);
    const resolvedGoal = goal || ctx.profile.fitnessGoal || "balanced nutrition";

    const resolvedCalories =
      calories !== undefined && calories !== ""
        ? Number(calories)
        : ctx.avgCalories || ctx.recommendedTargets?.targetCalories || 2000;

    const resolvedProtein =
      protein !== undefined && protein !== ""
        ? Number(protein)
        : ctx.avgProtein || ctx.recommendedTargets?.targetProtein || 130;

    const resolvedCarbs =
      carbs !== undefined && carbs !== ""
        ? Number(carbs)
        : ctx.avgCarbs || ctx.recommendedTargets?.targetCarbs || 220;

    const resolvedFats =
      fats !== undefined && fats !== ""
        ? Number(fats)
        : ctx.avgFats || ctx.recommendedTargets?.targetFats || 65;

    const profileSummary = buildProfileSummaryString(ctx);
    const targetNote = ctx.recommendedTargets
      ? `; Recommended TDEE target: ${ctx.recommendedTargets.targetCalories} kcal (P:${ctx.recommendedTargets.targetProtein}g C:${ctx.recommendedTargets.targetCarbs}g F:${ctx.recommendedTargets.targetFats}g)`
      : "";

    const contextualGoal = `${resolvedGoal} (User Profile: ${profileSummary}; Water goal: ${ctx.goals.waterGoal}ml${targetNote})`;

    const { text, model } = await generateNutritionAdvice({
      calories: resolvedCalories,
      protein: resolvedProtein,
      carbs: resolvedCarbs,
      fats: resolvedFats,
      goal: contextualGoal,
    });

    res.status(200).json({
      success: true,
      advice: text,
      modelUsed: model,
      targetsUsed: {
        calories: resolvedCalories,
        protein: resolvedProtein,
        carbs: resolvedCarbs,
        fats: resolvedFats,
        goal: resolvedGoal,
        recommendedTargets: ctx.recommendedTargets,
      },
    });
  } catch (error) {
    console.error("getNutritionRecommendation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Nutrition advice failed",
    });
  }
};

module.exports = {
  analyzeProgress,
  chatWithCoach,
  getWorkoutRecommendation,
  getNutritionRecommendation,
};