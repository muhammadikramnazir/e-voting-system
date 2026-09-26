import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";

import AdminLogin from "./pages/AdminLogin";
import AdminTwoFactor from "./pages/AdminTwoFactor";
import Dashboard from "./pages/Dashboard";
import Lawyers from "./pages/Lawyers";
import Verifications from "./pages/Verifications";
import Elections from "./pages/Elections";
import Positions from "./pages/Positions";
import Candidates from "./pages/Candidates";
import Votes from "./pages/Votes";
import Results from "./pages/Results";
import Notices from "./pages/Notices";
import Support from "./pages/Support";
import AdminProfile from "./pages/AdminProfile";
import Settings from "./pages/Settings";

function isTokenValid() {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(
      atob(
        token
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    if (!payload.exp) {
      return false;
    }

    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function clearAdminSession() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
  localStorage.removeItem("adminRememberMe");
}

function ProtectedAdminRoute() {
  const navigate = useNavigate();
  const [valid, setValid] = useState(isTokenValid());

  useEffect(() => {
    const checkToken = () => {
      const tokenIsValid = isTokenValid();

      setValid(tokenIsValid);

      if (!tokenIsValid) {
        clearAdminSession();
        navigate("/admin/login", { replace: true });
      }
    };

    checkToken();

    const interval = setInterval(checkToken, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  if (!valid) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout />;
}

function AdminLoginRoute() {
  const isLoggedIn = isTokenValid();

  if (isLoggedIn) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <AdminLogin />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Admin Login */}
        <Route
          path="/admin/login"
          element={<AdminLoginRoute />}
        />

        {/* Dedicated administrator 2FA screen */}
        <Route
          path="/admin/two-factor"
          element={<AdminTwoFactor />}
        />

        {/* Protected Admin Panel */}
        <Route
          path="/admin"
          element={<ProtectedAdminRoute />}
        >
          <Route
            index
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={<Dashboard />}
          />

          <Route
            path="lawyers"
            element={<Lawyers />}
          />

          <Route
            path="verifications"
            element={<Verifications />}
          />

          <Route
            path="elections"
            element={<Elections />}
          />

          <Route
            path="positions"
            element={<Positions />}
          />

          <Route
            path="candidates"
            element={<Candidates />}
          />

          <Route
            path="votes"
            element={<Votes />}
          />

          <Route
            path="results"
            element={<Results />}
          />

          <Route
            path="notices"
            element={<Notices />}
          />

          <Route
            path="support"
            element={<Support />}
          />

          <Route
            path="profile"
            element={<AdminProfile />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />
        </Route>

        {/* Unknown Routes */}
        <Route
          path="*"
          element={
            <Navigate
              to="/admin/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;