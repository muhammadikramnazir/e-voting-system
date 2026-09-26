import express from "express";

import {
    register,
    login,
    forgotPassword,
    verifyOtp,
    resetPassword,
    verifyRegistrationOtp,
} from "../controller/authcontroller.js";

const router = express.Router();

// ======================================================
// REGISTRATION
// ======================================================

router.post("/register", register);

router.post(
    "/verify-registration-otp",
    verifyRegistrationOtp
);

// ======================================================
// LOGIN
// ======================================================

router.post("/login", login);

// ======================================================
// FORGOT PASSWORD
// ======================================================

router.post(
    "/forgot-password",
    forgotPassword
);

router.post(
    "/verify-otp",
    verifyOtp
);

router.post(
    "/reset-password",
    resetPassword
);

export default router;