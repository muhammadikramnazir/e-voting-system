import express from "express";

import { adminMiddleware } from "../middleware/adminMiddleware.js";

import {
  loginAdmin,

  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,

  dashboard,

  listLawyers,
  getLawyer,
  updateLawyer,
  deleteLawyer,
  updateLawyerStatus,

  listGeneric,
  createGeneric,
  updateGeneric,
  deleteGeneric,

  toggleCandidateStatus,

  listVotes,
  updateVoteStatus,
  deleteVote,
  voteStats,

  adminResults,
  publishResults,

  listSupport,
  getSupport,
  updateSupportStatus,
  deleteSupport,

  getSettings,
  updateSettings,
} from "../controller/admincontroller.js";

import {
  listVerifications,
  getVerification,
  approveVerification,
  rejectVerification,
} from "../controller/adminverificationcontroller.js";

import {
  requestAdminPasswordReset,
  resetAdminPassword,
} from "../controller/adminPasswordController.js";

import {
  sendAdmin2FAOtp,
  verifyAdmin2FAOtp,
} from "../controller/admin2faController.js";

const router = express.Router();

/* =====================================================
   ADMIN LOGIN
===================================================== */

router.post(
  "/login",
  loginAdmin
);

/* =====================================================
   ADMIN PASSWORD RESET
   These routes must remain public because the
   administrator does not have a JWT while using
   Forgot Password.
===================================================== */

router.post(
  "/forgot-password",
  requestAdminPasswordReset
);

router.post(
  "/reset-password",
  resetAdminPassword
);

/* =====================================================
   ADMIN TWO-FACTOR AUTHENTICATION
   These routes must remain public because the
   administrator does not have a JWT yet while
   completing the login OTP step.
===================================================== */

router.post(
  "/2fa/send-otp",
  sendAdmin2FAOtp
);

router.post(
  "/2fa/verify",
  verifyAdmin2FAOtp
);

/* =====================================================
   ADMIN AUTHENTICATION
===================================================== */

router.use(adminMiddleware);

/* =====================================================
   VERIFICATIONS
===================================================== */

router.get(
  "/verifications",
  listVerifications
);

router.get(
  "/verifications/:id",
  getVerification
);

router.patch(
  "/verifications/:id/approve",
  approveVerification
);

router.patch(
  "/verifications/:id/reject",
  rejectVerification
);

/* =====================================================
   ADMIN PROFILE
===================================================== */

router.get(
  "/profile",
  getAdminProfile
);

router.put(
  "/profile",
  updateAdminProfile
);

router.put(
  "/password",
  updateAdminPassword
);

/* =====================================================
   DASHBOARD
===================================================== */

router.get(
  "/dashboard",
  dashboard
);

/* =====================================================
   LAWYERS
===================================================== */

router.get(
  "/lawyers",
  listLawyers
);

router.get(
  "/lawyers/:id",
  getLawyer
);

router.put(
  "/lawyers/:id",
  updateLawyer
);

router.patch(
  "/lawyers/:id/status",
  updateLawyerStatus
);

router.delete(
  "/lawyers/:id",
  deleteLawyer
);

/* =====================================================
   ELECTIONS
===================================================== */

router.get(
  "/elections",
  listGeneric("elections")
);

router.post(
  "/elections",
  createGeneric("elections")
);

router.put(
  "/elections/:id",
  updateGeneric("elections")
);

router.delete(
  "/elections/:id",
  deleteGeneric("elections")
);

/* =====================================================
   POSITIONS
===================================================== */

router.get(
  "/positions",
  listGeneric("positions")
);

router.post(
  "/positions",
  createGeneric("positions")
);

router.put(
  "/positions/:id",
  updateGeneric("positions")
);

router.delete(
  "/positions/:id",
  deleteGeneric("positions")
);

/* =====================================================
   CANDIDATES
===================================================== */

router.get(
  "/candidates",
  listGeneric("candidates")
);

router.post(
  "/candidates",
  createGeneric("candidates")
);

router.put(
  "/candidates/:id",
  updateGeneric("candidates")
);

router.delete(
  "/candidates/:id",
  deleteGeneric("candidates")
);

router.patch(
  "/candidates/:id/status",
  toggleCandidateStatus
);

/* =====================================================
   VOTES
===================================================== */

router.get(
  "/votes",
  listVotes
);

router.get(
  "/votes/statistics",
  voteStats
);

router.patch(
  "/votes/:id/status",
  updateVoteStatus
);

router.delete(
  "/votes/:id",
  deleteVote
);

/* =====================================================
   RESULTS
===================================================== */

router.get(
  "/results",
  adminResults
);

router.patch(
  "/results/:electionId/publish",
  publishResults
);

/* =====================================================
   NOTICES
===================================================== */

router.get(
  "/notices",
  listGeneric("notices")
);

router.post(
  "/notices",
  createGeneric("notices")
);

router.put(
  "/notices/:id",
  updateGeneric("notices")
);

router.delete(
  "/notices/:id",
  deleteGeneric("notices")
);

/* =====================================================
   SUPPORT
===================================================== */

router.get(
  "/support",
  listSupport
);

router.get(
  "/support/:id",
  getSupport
);

router.patch(
  "/support/:id/status",
  updateSupportStatus
);

router.delete(
  "/support/:id",
  deleteSupport
);

/* =====================================================
   SETTINGS
===================================================== */

router.get(
  "/settings",
  getSettings
);

router.put(
  "/settings",
  updateSettings
);

export default router;