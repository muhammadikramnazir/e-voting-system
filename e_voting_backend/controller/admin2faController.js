import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

import db from "../db/database.js";

/* =========================================================
   HELPERS
========================================================= */

const clean = (value) =>
    String(value ?? "").trim();

const generateOtp = () =>
    crypto
        .randomInt(100000, 1000000)
        .toString();

const sendAdmin2FAEmail = async ({
    email,
    otp,
}) => {
    if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASS
    ) {
        throw new Error(
            "EMAIL_USER and EMAIL_PASS are not configured."
        );
    }

    const transporter =
        nodemailer.createTransport({
            service: "gmail",

            auth: {
                user:
                    process.env.EMAIL_USER,

                pass:
                    process.env.EMAIL_PASS,
            },
        });

    await transporter.sendMail({
        from:
            process.env.EMAIL_USER,

        to: email,

        subject:
            "E-Voting Admin Login Verification Code",

        text:
            `Your E-Voting administrator login verification code is ${otp}.\n\n` +
            `This code will expire in 10 minutes.\n\n` +
            `If you did not attempt to log in, please secure your administrator account.`,
    });
};

/* =========================================================
   CHECK ADMIN 2FA SETTING
========================================================= */

export const isAdminTwoFactorEnabled =
    async () => {
        try {
            const [rows] =
                await db.query(
                    `SELECT setting_value
           FROM system_settings
           WHERE setting_key = 'twoFactor'
           LIMIT 1`
                );

            if (!rows.length) {
                return false;
            }

            const value =
                rows[0].setting_value;

            try {
                return Boolean(
                    JSON.parse(value)
                );
            } catch {
                return (
                    value === "true" ||
                    value === "1" ||
                    value === 1
                );
            }
        } catch (error) {
            console.error(
                "CHECK ADMIN 2FA ERROR:",
                error
            );

            return false;
        }
    };

/* =========================================================
   SEND LOGIN OTP
========================================================= */

export const sendAdmin2FAOtp =
    async (req, res) => {
        try {
            const email = clean(
                req.body?.email
            ).toLowerCase();

            if (!email) {
                return res.status(400).json({
                    status: false,
                    message:
                        "Admin email is required.",
                });
            }

            /*
             * Make sure 2FA is actually enabled.
             */
            const enabled =
                await isAdminTwoFactorEnabled();

            if (!enabled) {
                return res.status(400).json({
                    status: false,
                    message:
                        "Two-factor authentication is disabled.",
                });
            }

            /*
             * Find active admin.
             */
            const [admins] =
                await db.query(
                    `SELECT
             id,
             name,
             email,
             status
           FROM admins
           WHERE LOWER(email) = LOWER(?)
           LIMIT 1`,
                    [email]
                );

            if (!admins.length) {
                return res.status(401).json({
                    status: false,
                    message:
                        "Invalid admin credentials.",
                });
            }

            const admin =
                admins[0];

            if (
                admin.status !==
                "Active"
            ) {
                return res.status(403).json({
                    status: false,
                    message:
                        "Admin account is not active.",
                });
            }

            /*
             * Rate-limit OTP requests.
             *
             * Do not allow another OTP within
             * 60 seconds.
             */
            const [recentRows] =
                await db.query(
                    `SELECT id
           FROM admin_two_factor_codes
           WHERE admin_id = ?
             AND created_at >= DATE_SUB(NOW(), INTERVAL 60 SECOND)
             AND used_at IS NULL
           ORDER BY id DESC
           LIMIT 1`,
                    [admin.id]
                );

            if (recentRows.length) {
                return res.status(429).json({
                    status: false,
                    message:
                        "Please wait 60 seconds before requesting another OTP.",
                });
            }

            /*
             * Invalidate previous unused codes.
             */
            await db.query(
                `UPDATE admin_two_factor_codes
         SET used_at = NOW()
         WHERE admin_id = ?
           AND used_at IS NULL`,
                [admin.id]
            );

            /*
             * Generate secure OTP.
             */
            const otp =
                generateOtp();

            /*
             * Hash OTP before storing it.
             */
            const otpHash =
                await bcrypt.hash(
                    otp,
                    10
                );

            /*
             * Store OTP for 10 minutes.
             */
            await db.query(
                `INSERT INTO admin_two_factor_codes
         (
           admin_id,
           otp_hash,
           expires_at
         )
         VALUES
         (
           ?,
           ?,
           DATE_ADD(NOW(), INTERVAL 10 MINUTE)
         )`,
                [
                    admin.id,
                    otpHash,
                ]
            );

            /*
             * Send OTP email.
             */
            await sendAdmin2FAEmail({
                email: admin.email,
                otp,
            });

            return res.json({
                status: true,

                message:
                    "Login verification OTP sent successfully.",

                email:
                    admin.email,
            });
        } catch (error) {
            console.error(
                "SEND ADMIN 2FA OTP ERROR:",
                error
            );

            return res.status(500).json({
                status: false,
                message:
                    "Failed to send login verification OTP.",
            });
        }
    };

/* =========================================================
   VERIFY LOGIN OTP
========================================================= */

export const verifyAdmin2FAOtp =
    async (req, res) => {
        try {
            const email = clean(
                req.body?.email
            ).toLowerCase();

            const otp = clean(
                req.body?.otp
            );

            if (!email || !otp) {
                return res.status(400).json({
                    status: false,
                    message:
                        "Admin email and OTP are required.",
                });
            }

            if (!/^\d{6}$/.test(otp)) {
                return res.status(400).json({
                    status: false,
                    message:
                        "OTP must be exactly 6 digits.",
                });
            }

            /*
             * Find admin.
             */
            const [admins] =
                await db.query(
                    `SELECT
             id,
             name,
             email,
             role,
             department,
             status
           FROM admins
           WHERE LOWER(email) = LOWER(?)
           LIMIT 1`,
                    [email]
                );

            if (!admins.length) {
                return res.status(401).json({
                    status: false,
                    message:
                        "Invalid admin verification request.",
                });
            }

            const admin =
                admins[0];

            if (
                admin.status !==
                "Active"
            ) {
                return res.status(403).json({
                    status: false,
                    message:
                        "Admin account is not active.",
                });
            }

            /*
             * Get latest unused,
             * non-expired OTP.
             */
            const [codes] =
                await db.query(
                    `SELECT
             id,
             otp_hash,
             attempts,
             expires_at
           FROM admin_two_factor_codes
           WHERE admin_id = ?
             AND used_at IS NULL
             AND expires_at > NOW()
           ORDER BY id DESC
           LIMIT 1`,
                    [admin.id]
                );

            if (!codes.length) {
                return res.status(400).json({
                    status: false,
                    message:
                        "OTP is invalid or expired. Please request a new OTP.",
                });
            }

            const code =
                codes[0];

            /*
             * Maximum 5 attempts.
             */
            if (
                Number(code.attempts) >=
                5
            ) {
                await db.query(
                    `UPDATE admin_two_factor_codes
           SET used_at = NOW()
           WHERE id = ?`,
                    [code.id]
                );

                return res.status(429).json({
                    status: false,
                    message:
                        "Too many incorrect OTP attempts. Please request a new OTP.",
                });
            }

            /*
             * Compare entered OTP
             * against hashed OTP.
             */
            const validOtp =
                await bcrypt.compare(
                    otp,
                    code.otp_hash
                );

            if (!validOtp) {
                await db.query(
                    `UPDATE admin_two_factor_codes
           SET attempts = attempts + 1
           WHERE id = ?`,
                    [code.id]
                );

                const remaining =
                    Math.max(
                        0,
                        4 -
                        Number(
                            code.attempts
                        )
                    );

                return res.status(400).json({
                    status: false,
                    message:
                        `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
                });
            }

            /*
             * OTP is valid.
             * Mark it as used.
             */
            await db.query(
                `UPDATE admin_two_factor_codes
         SET used_at = NOW()
         WHERE id = ?`,
                [code.id]
            );

            const token = jwt.sign(
                {
                    id: admin.id,
                    email: admin.email,
                    type: "admin",
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "12h",
                }
            );

            return res.json({
                status: true,
                message:
                    "Two-factor authentication verified successfully.",
                verified: true,
                token,
                admin: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    department:
                        admin.department,
                    status: admin.status,
                },
            });
        } catch (error) {
            console.error(
                "VERIFY ADMIN 2FA OTP ERROR:",
                error
            );

            return res.status(500).json({
                status: false,
                message:
                    "Failed to verify login OTP.",
            });
        }
    };