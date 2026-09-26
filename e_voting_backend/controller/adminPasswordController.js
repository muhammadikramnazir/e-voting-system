import db from "../db/database.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

const clean = (value) => String(value ?? "").trim();

const genericMessage =
    "If an active administrator account exists for this email, a password reset OTP has been sent.";

const sendAdminResetEmail = async (email, otp) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error(
            "EMAIL_USER and EMAIL_PASS are not configured."
        );
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "E-Voting Admin Password Reset OTP",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
                <h2>E-Voting Admin Password Reset</h2>

                <p>
                    A password reset request was made for your
                    administrator account.
                </p>

                <p>Your OTP is:</p>

                <div style="
                    font-size:32px;
                    font-weight:bold;
                    letter-spacing:8px;
                    padding:18px;
                    background:#f1f5f9;
                    text-align:center;
                    border-radius:10px;
                ">
                    ${otp}
                </div>

                <p>
                    This OTP will expire in 10 minutes.
                </p>

                <p>
                    If you did not request this password reset,
                    you can safely ignore this email.
                </p>

                <hr />

                <small>
                    E-Voting Administration System
                </small>
            </div>
        `,
    });
};


// =========================================================
// REQUEST ADMIN PASSWORD RESET
// =========================================================

export const requestAdminPasswordReset = async (
    req,
    res
) => {
    try {
        const email = clean(
            req.body?.email
        ).toLowerCase();

        if (!email) {
            return res.status(400).json({
                status: false,
                message: "Email address is required.",
            });
        }

        const [admins] = await db.query(
            `
            SELECT id, email, status
            FROM admins
            WHERE LOWER(email) = LOWER(?)
            LIMIT 1
            `,
            [email]
        );

        /*
         * Generic response prevents account enumeration.
         */
        if (
            !admins.length ||
            admins[0].status !== "Active"
        ) {
            return res.json({
                status: true,
                message: genericMessage,
            });
        }

        const admin = admins[0];

        /*
         * Prevent requesting another OTP too quickly.
         */
        const [recent] = await db.query(
            `
            SELECT id
            FROM admin_password_resets
            WHERE admin_id = ?
              AND used_at IS NULL
              AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
            ORDER BY id DESC
            LIMIT 1
            `,
            [admin.id]
        );

        if (recent.length) {
            return res.status(429).json({
                status: false,
                message:
                    "Please wait 60 seconds before requesting another OTP.",
            });
        }

        /*
         * Invalidate previous reset requests.
         */
        await db.query(
            `
            UPDATE admin_password_resets
            SET used_at = NOW()
            WHERE admin_id = ?
              AND used_at IS NULL
            `,
            [admin.id]
        );

        /*
         * Generate cryptographically secure OTP.
         */
        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();

        /*
         * Never store the OTP itself.
         */
        const otpHash = await bcrypt.hash(
            otp,
            10
        );

        await db.query(
            `
            INSERT INTO admin_password_resets
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
            )
            `,
            [
                admin.id,
                otpHash,
            ]
        );

        await sendAdminResetEmail(
            admin.email,
            otp
        );

        return res.json({
            status: true,
            message: genericMessage,
        });
    } catch (error) {
        console.error(
            "ADMIN PASSWORD RESET REQUEST ERROR:",
            error
        );

        return res.status(500).json({
            status: false,
            message:
                "Unable to process password reset request.",
        });
    }
};


// =========================================================
// RESET ADMIN PASSWORD USING OTP
// =========================================================

export const resetAdminPassword = async (
    req,
    res
) => {
    try {
        const email = clean(
            req.body?.email
        ).toLowerCase();

        const otp = clean(
            req.body?.otp
        );

        const newPassword = String(
            req.body?.newPassword || ""
        );

        const confirmPassword = String(
            req.body?.confirmPassword || ""
        );

        if (
            !email ||
            !otp ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({
                status: false,
                message:
                    "Email, OTP, new password and confirmation are required.",
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                status: false,
                message:
                    "OTP must contain exactly 6 digits.",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                status: false,
                message:
                    "New password must contain at least 8 characters.",
            });
        }

        if (
            newPassword !== confirmPassword
        ) {
            return res.status(400).json({
                status: false,
                message:
                    "New password and confirmation do not match.",
            });
        }

        const [admins] = await db.query(
            `
            SELECT id, email, status
            FROM admins
            WHERE LOWER(email) = LOWER(?)
            LIMIT 1
            `,
            [email]
        );

        if (
            !admins.length ||
            admins[0].status !== "Active"
        ) {
            return res.status(400).json({
                status: false,
                message:
                    "Invalid or expired password reset request.",
            });
        }

        const admin = admins[0];

        const [resets] = await db.query(
            `
            SELECT
                id,
                otp_hash,
                attempts,
                expires_at
            FROM admin_password_resets
            WHERE admin_id = ?
              AND used_at IS NULL
            ORDER BY id DESC
            LIMIT 1
            `,
            [admin.id]
        );

        if (!resets.length) {
            return res.status(400).json({
                status: false,
                message:
                    "Invalid or expired password reset request.",
            });
        }

        const reset = resets[0];

        if (
            new Date(reset.expires_at) <
            new Date()
        ) {
            await db.query(
                `
                UPDATE admin_password_resets
                SET used_at = NOW()
                WHERE id = ?
                `,
                [reset.id]
            );

            return res.status(400).json({
                status: false,
                message:
                    "OTP has expired. Please request a new OTP.",
            });
        }

        if (reset.attempts >= 5) {
            await db.query(
                `
                UPDATE admin_password_resets
                SET used_at = NOW()
                WHERE id = ?
                `,
                [reset.id]
            );

            return res.status(429).json({
                status: false,
                message:
                    "Too many incorrect OTP attempts. Please request a new OTP.",
            });
        }

        const otpValid = await bcrypt.compare(
            otp,
            reset.otp_hash
        );

        if (!otpValid) {
            await db.query(
                `
                UPDATE admin_password_resets
                SET attempts = attempts + 1
                WHERE id = ?
                `,
                [reset.id]
            );

            return res.status(400).json({
                status: false,
                message: "Invalid OTP.",
            });
        }

        /*
         * Hash the new password.
         */
        const passwordHash =
            await bcrypt.hash(
                newPassword,
                10
            );

        /*
         * Update admin password.
         */
        await db.query(
            `
            UPDATE admins
            SET password = ?
            WHERE id = ?
            `,
            [
                passwordHash,
                admin.id,
            ]
        );

        /*
         * OTP can never be reused.
         */
        await db.query(
            `
            UPDATE admin_password_resets
            SET used_at = NOW()
            WHERE id = ?
            `,
            [reset.id]
        );

        /*
         * Invalidate any other outstanding
         * reset requests for this admin.
         */
        await db.query(
            `
            UPDATE admin_password_resets
            SET used_at = NOW()
            WHERE admin_id = ?
              AND used_at IS NULL
            `,
            [admin.id]
        );

        return res.json({
            status: true,
            message:
                "Admin password reset successfully.",
        });
    } catch (error) {
        console.error(
            "ADMIN PASSWORD RESET ERROR:",
            error
        );

        return res.status(500).json({
            status: false,
            message:
                "Failed to reset admin password.",
        });
    }
};