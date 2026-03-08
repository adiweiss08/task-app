import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import HomePage from "@/react-app/pages/Home";
import BirthdaysPage from "@/react-app/pages/Birthdays";
import TaskInsights from "@/react-app/pages/TaskInsights";
import LoginPage from "@/react-app/pages/LoginPage";
import SignupPage from "@/react-app/pages/SignupPage";
import { ProtectedRoute } from "@/react-app/components/ProtectedRoute";
import { useAuth } from "@/react-app/context/AuthContext";

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-indigo-50 to-fuchsia-50">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
        <Route path="/signup" element={<AuthRedirect><SignupPage /></AuthRedirect>} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/birthdays" element={<ProtectedRoute><BirthdaysPage /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><TaskInsights /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
