import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

// Protected Pages
import Dashboard from "./pages/dashboard/Dashboard";
import Elections from "./pages/elections/Elections";
import CastVote from "./pages/cast_vote/Castvote";
import MyProfile from "./pages/profile_page/Myprofile";
import Verification from "./pages/verification_page/Verification";
import Results from "./pages/result_page/Results";
import Notices from "./pages/notices/Notices";
import Support from "./pages/support/Support";
import Settings from "./pages/settings/Settings";
import Candidates from "./pages/candidates/Candidates";

// Public Pages
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import ForgotPassword from "./pages/forgot_password/Forgotpassword";
import EmailVerification from "./pages/email_verification/Emailverification";
import RegistrationVerification from "./pages/RegistrationVerification";
import ResetPassword from "./pages/reset_password/Resetpassword";

// Authentication
// IMPORTANT:
// Actual ZIP path is:
// src/components/protectedRoute/protectedroute.jsx
import ProtectedRoute from "./components/protectedRoute/protectedroute";

// Maintenance Page
import Maintenance from "./pages/maintenance/Maintenance";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:4000/api/v1";


function App() {

  // =====================================================
  // MAINTENANCE MODE
  // =====================================================

  const [maintenance, setMaintenance] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);

  useEffect(() => {

    const checkMaintenance = async () => {

      try {

        const response = await fetch(
          `${API_URL}/maintenance-status`
        );

        const data = await response.json();

        setMaintenance(data.maintenance === true);

      } catch (error) {

        console.error(
          "MAINTENANCE CHECK ERROR:",
          error
        );

        // Backend available na ho
        // to normal application ko block nahi karna
        setMaintenance(false);

      } finally {

        setCheckingMaintenance(false);

      }

    };

    checkMaintenance();

  }, []);


  // =====================================================
  // WAIT WHILE CHECKING MAINTENANCE
  // =====================================================

  if (checkingMaintenance) {
    return null;
  }


  // =====================================================
  // MAINTENANCE SCREEN
  // =====================================================

  if (maintenance) {
    return <Maintenance />;
  }


  // =====================================================
  // NORMAL APPLICATION
  // =====================================================

  return (

    <Routes>

      {/* =========================================
                PUBLIC ROUTES
            ========================================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/email-verification"
        element={<EmailVerification />}
      />

      {/* Registration OTP Verification */}
      <Route
        path="/registration-verification"
        element={<RegistrationVerification />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />


      {/* =========================================
                PROTECTED ROUTES
            ========================================= */}

      <Route element={<ProtectedRoute />}>

        {/* Dashboard */}
        <Route
          path="/"
          element={<Dashboard />}
        />

        {/* Direct dashboard URL */}
        <Route
          path="/dashboard"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

        {/* Elections */}
        <Route
          path="/elections"
          element={<Elections />}
        />

        {/* Cast Vote */}
        <Route
          path="/cast-vote"
          element={<CastVote />}
        />

        {/* My Profile */}
        <Route
          path="/my-profile"
          element={<MyProfile />}
        />

        {/* Account Verification */}
        <Route
          path="/verification"
          element={<Verification />}
        />

        {/* Candidates */}
        <Route
          path="/candidates"
          element={<Candidates />}
        />

        {/* Results */}
        <Route
          path="/results"
          element={<Results />}
        />

        {/* Notices */}
        <Route
          path="/notices"
          element={<Notices />}
        />

        {/* Support */}
        <Route
          path="/support"
          element={<Support />}
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={<Settings />}
        />

      </Route>


      {/* =========================================
                UNKNOWN URL
            ========================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>

  );

}

export default App;