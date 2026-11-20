import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import UserLayout from "./components/Layout/UserLayout";
import BackgroundVideo from "./components/BackgroundVideo";
import AdminLayout from "./components/Layout/AdminLayout";
import ErrorBoundary from "./components/ErrorBoundary";

// Landing Page
import LandingPage from "./pages/LandingPage"; 

// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ChangePassword from "./pages/auth/ChangePassword";

// User Pages
import UserDashboard from "./pages/user/UserDashboard";
import Profile from "./pages/user/Profile";
import WorkoutLibrary from "./pages/user/WorkoutLibrary";
import WorkoutDetails from "./pages/user/WorkoutDetails";
import MyWorkouts from "./pages/user/MyWorkouts";
import WorkoutTracker from "./pages/user/WorkoutTracker";
import Nutrition from "./pages/user/Nutrition";
import Progress from "./pages/user/Progress";
import Water from "./pages/user/Water";
import Sleep from "./pages/user/Sleep";
import Steps from "./pages/user/StepCounter"; 
import AICoach from "./pages/user/AICoach";
import Settings from "./pages/user/Settings";
import Support from "./pages/user/Support";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageWorkouts from "./pages/admin/ManageWorkouts";
import AddWorkout from "./pages/admin/AddWorkout";
import ManageFoodItems from "./pages/admin/ManageFoodItems";
import ManageSupport from "./pages/admin/ManageSupport";

// Guards
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <BackgroundVideo />
                <Routes>
                    {/* ================= 1. PUBLIC ROUTES ================= */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />

                    {/* ================= 2. USER ROUTES (PROTECTED) ================= */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<UserLayout />}>
                            <Route path="/dashboard" element={<UserDashboard />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/change-password" element={<ChangePassword />} />
                            <Route path="/workouts" element={<WorkoutLibrary />} />
                            <Route path="/workouts/:id" element={<WorkoutDetails />} />
                            <Route path="/my-workouts" element={<MyWorkouts />} />
                            <Route path="/workouts/:id/track" element={<WorkoutTracker />} />
                            <Route path="/nutrition" element={<Nutrition />} />
                            <Route path="/progress" element={<Progress />} />
                            <Route path="/water" element={<Water />} />
                            <Route path="/sleep" element={<Sleep />} />
                            <Route path="/steps" element={<Steps />} />
                            <Route path="/ai-coach" element={<AICoach />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/support" element={<Support />} />
                        </Route>
                    </Route>

                    {/* ================= 3. ADMIN ROUTES (PROTECTED) ================= */}
                    <Route element={<AdminRoute />}>
                        <Route element={<AdminLayout />}>
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/admin/users" element={<ManageUsers />} />
                            <Route path="/admin/workouts" element={<ManageWorkouts />} />
                            <Route path="/admin/workouts/new" element={<AddWorkout />} />
                            <Route path="/admin/workouts/:id" element={<AddWorkout />} />
                            <Route path="/admin/food-items" element={<ManageFoodItems />} />
                            <Route path="/admin/support" element={<ManageSupport />} />
                        </Route>
                    </Route>

                    {/* ================= 4. FALLBACK ================= */}
                    {/* Koi bhi galat URL daale toh Landing Page par wapas bhej do */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;