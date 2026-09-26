import db from "../db/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

const normalize = (value) => String(value ?? "").trim();

const createUserToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: "user",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "2d",
    }
  );

// ======================================================
// REGISTER
// ======================================================

export const register = async (req, res) => {
  try {
    const fullName = normalize(req.body?.fullName);
    const email = normalize(req.body?.email).toLowerCase();
    const barRegistrationNo = normalize(req.body?.barRegistrationNo);
    const licenseNumber = normalize(req.body?.licenseNumber);
    const cnicNumber = normalize(req.body?.cnicNumber);
    const phoneNumber = normalize(req.body?.phoneNumber);
    const password = String(req.body?.password ?? "");
    const confirmPassword = String(req.body?.confirmPassword ?? "");

    if (
      !fullName ||
      !email ||
      !barRegistrationNo ||
      !licenseNumber ||
      !cnicNumber ||
      !phoneNumber ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Password and confirm password do not match.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 8 characters.",
      });
    }

    // ==================================================
    // CHECK DUPLICATE USER
    // ==================================================

    const [existing] = await db.query(
      `SELECT
          id,
          email,
          bar_registration_no,
          license_number,
          cnic_number
       FROM users
       WHERE deleted_at IS NULL
       AND (
         email = ?
         OR bar_registration_no = ?
         OR license_number = ?
         OR cnic_number = ?
       )
       LIMIT 1`,
      [
        email,
        barRegistrationNo,
        licenseNumber,
        cnicNumber,
      ]
    );

    if (existing.length) {
      const row = existing[0];

      const duplicate =
        row.email === email
          ? "Email"
          : row.bar_registration_no === barRegistrationNo
            ? "Bar registration number"
            : row.license_number === licenseNumber
              ? "License number"
              : "CNIC number";

      return res.status(409).json({
        status: false,
        message: `${duplicate} is already registered.`,
      });
    }

    // ==================================================
    // CHECK EMAIL CONFIGURATION
    // ==================================================

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        status: false,
        message:
          "Email service is not configured. Please contact administration.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Generate 6-digit registration OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // ==================================================
      // CREATE USER AS PENDING
      // ==================================================

      const [result] = await connection.query(
        `INSERT INTO users
        (
          full_name,
          email,
          bar_registration_no,
          license_number,
          cnic_number,
          phone_number,
          password,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
        [
          fullName,
          email,
          barRegistrationNo,
          licenseNumber,
          cnicNumber,
          phoneNumber,
          passwordHash,
        ]
      );

      const userId = result.insertId;

      // ==================================================
      // CREATE LAWYER PROFILE
      // ==================================================

      await connection.query(
        `INSERT INTO lawyer_profiles
        (
          user_id,
          bar_registration_number,
          license_number,
          bar_association,
          enrollment_date
        )
        VALUES (?, ?, ?, ?, CURDATE())`,
        [
          userId,
          barRegistrationNo,
          licenseNumber,
          process.env.DEFAULT_BAR_ASSOCIATION ||
          "District Bar Association",
        ]
      );

      // ==================================================
      // CREATE REGISTRATION OTP
      // ==================================================

      await connection.query(
        `INSERT INTO registration_verifications
        (
          user_id,
          otp,
          expires_at
        )
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
        [userId, otp]
      );

      // ==================================================
      // SEND REGISTRATION OTP EMAIL
      // ==================================================

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
        subject: "E-Voting Account Verification OTP",
        text:
          `Dear ${fullName},\n\n` +
          `Your E-Voting account verification OTP is: ${otp}\n\n` +
          `This OTP is valid for 10 minutes.\n\n` +
          `Please do not share this OTP with anyone.\n\n` +
          `Regards,\n` +
          `E-Voting System`,
      });

      // Commit only after OTP email is successfully sent
      await connection.commit();

      return res.status(201).json({
        status: true,
        message:
          "Registration successful. A verification OTP has been sent to your email.",
        userId,
        email,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Registration failed.",
    });
  }
};

// ======================================================
// VERIFY REGISTRATION OTP
// ======================================================

export const verifyRegistrationOtp = async (req, res) => {
  try {
    const email = normalize(req.body?.email).toLowerCase();
    const otp = normalize(req.body?.otp);

    if (!email || !otp) {
      return res.status(400).json({
        status: false,
        message: "Email and OTP are required.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        status: false,
        message: "OTP must be exactly 6 digits.",
      });
    }

    const [rows] = await db.query(
      `SELECT
          rv.id,
          rv.user_id
       FROM registration_verifications rv
       INNER JOIN users u ON u.id = rv.user_id
       WHERE LOWER(u.email) = LOWER(?)
       AND u.deleted_at IS NULL
       AND u.status = 'Pending'
       AND rv.otp = ?
       AND rv.verified = 0
       AND rv.deleted_at IS NULL
       AND rv.expires_at > NOW()
       ORDER BY rv.id DESC
       LIMIT 1`,
      [email, otp]
    );

    if (!rows.length) {
      return res.status(400).json({
        status: false,
        message: "Invalid or expired registration OTP.",
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Mark OTP verified
      await connection.query(
        `UPDATE registration_verifications
         SET verified = 1
         WHERE id = ?`,
        [rows[0].id]
      );

      // Verify user account
      await connection.query(
        `UPDATE users
         SET status = 'Verified'
         WHERE id = ?`,
        [rows[0].user_id]
      );

      await connection.commit();

      return res.status(200).json({
        status: true,
        message:
          "Email verified successfully. Your account is now verified.",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(
      "VERIFY REGISTRATION OTP ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to verify registration OTP.",
    });
  }
};

// ======================================================
// LOGIN
// ======================================================

export const login = async (req, res) => {
  try {
    const identifier = normalize(req.body?.email);
    const password = String(req.body?.password ?? "");

    if (!identifier || !password) {
      return res.status(400).json({
        status: false,
        message:
          "Email or registration number and password are required.",
      });
    }

    const [rows] = await db.query(
      `SELECT
          u.id,
          u.full_name,
          u.email,
          u.password,
          u.bar_registration_no,
          u.license_number,
          u.cnic_number,
          u.phone_number,
          u.status,
          lp.bar_association,
          lp.enrollment_date,
          lp.profile_photo
       FROM users u
       LEFT JOIN lawyer_profiles lp
         ON lp.user_id = u.id
         AND lp.deleted_at IS NULL
       WHERE u.deleted_at IS NULL
       AND (
         LOWER(u.email) = LOWER(?)
         OR u.bar_registration_no = ?
       )
       LIMIT 1`,
      [identifier, identifier]
    );

    if (!rows.length) {
      return res.status(401).json({
        status: false,
        message: "Invalid login credentials.",
      });
    }

    const user = rows[0];

    if (user.status === "Suspended") {
      return res.status(403).json({
        status: false,
        message:
          "Your account is suspended. Please contact administration.",
      });
    }

    // Registration OTP verification required
    if (user.status === "Pending") {
      return res.status(403).json({
        status: false,
        message:
          "Your email is not verified. Please complete OTP verification first.",
      });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: false,
        message: "Invalid login credentials.",
      });
    }

    const token = createUserToken(user);

    const {
      password: _password,
      ...safeUser
    } = user;

    return res.status(200).json({
      status: true,
      message: "Login successful.",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Login failed.",
    });
  }
};

// ======================================================
// FORGOT PASSWORD
// ======================================================

export const forgotPassword = async (req, res) => {
  try {
    const identifier = normalize(req.body?.email).toLowerCase();

    if (!identifier) {
      return res.status(400).json({
        status: false,
        message: "Email is required.",
      });
    }

    const [users] = await db.query(
      `SELECT id, email
       FROM users
       WHERE deleted_at IS NULL
       AND (
         LOWER(email) = LOWER(?)
         OR bar_registration_no = ?
       )
       LIMIT 1`,
      [identifier, identifier]
    );

    if (!users.length) {
      return res.status(404).json({
        status: false,
        message:
          "No account found with this email or registration number.",
      });
    }

    const user = users[0];

    await db.query(
      `UPDATE password_resets
       SET deleted_at = NOW()
       WHERE user_id = ?
       AND deleted_at IS NULL`,
      [user.id]
    );

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    await db.query(
      `INSERT INTO password_resets
      (
        user_id,
        otp,
        expires_at
      )
      VALUES
      (
        ?,
        ?,
        DATE_ADD(NOW(), INTERVAL 10 MINUTE)
      )`,
      [user.id, otp]
    );

    if (
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    ) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "E-Voting Password Reset OTP",
        text:
          `Your password reset OTP is ${otp}. ` +
          `It expires in 10 minutes.`,
      });
    } else {
      console.warn(
        "EMAIL_USER/EMAIL_PASS are not configured; OTP was generated but not emailed."
      );
    }

    return res.status(200).json({
      status: true,
      message: "OTP sent successfully.",
      email: user.email,
    });
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to send OTP.",
    });
  }
};

// ======================================================
// VERIFY PASSWORD RESET OTP
// ======================================================

export const verifyOtp = async (req, res) => {
  try {
    const identifier = normalize(req.body?.email).toLowerCase();
    const otp = normalize(req.body?.otp);

    if (!identifier || !otp) {
      return res.status(400).json({
        status: false,
        message: "Email and OTP are required.",
      });
    }

    const [rows] = await db.query(
      `SELECT
          pr.id,
          pr.user_id
       FROM password_resets pr
       INNER JOIN users u
         ON u.id = pr.user_id
       WHERE u.deleted_at IS NULL
       AND (
         LOWER(u.email) = LOWER(?)
         OR u.bar_registration_no = ?
       )
       AND pr.otp = ?
       AND pr.verified = 0
       AND pr.deleted_at IS NULL
       AND pr.expires_at > NOW()
       ORDER BY pr.id DESC
       LIMIT 1`,
      [identifier, identifier, otp]
    );

    if (!rows.length) {
      return res.status(400).json({
        status: false,
        message: "Invalid or expired OTP.",
      });
    }

    await db.query(
      `UPDATE password_resets
       SET verified = 1
       WHERE id = ?`,
      [rows[0].id]
    );

    return res.status(200).json({
      status: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error(
      "VERIFY OTP ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to verify OTP.",
    });
  }
};

// ======================================================
// RESET PASSWORD
// ======================================================

export const resetPassword = async (req, res) => {
  try {
    const identifier = normalize(
      req.body?.email
    ).toLowerCase();

    const newPassword = String(
      req.body?.newPassword ?? ""
    );

    const confirmPassword = String(
      req.body?.confirmPassword ?? ""
    );

    if (
      !identifier ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Email, new password and confirm password are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message:
          "Password and confirm password do not match.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: false,
        message:
          "Password must be at least 8 characters.",
      });
    }

    const [rows] = await db.query(
      `SELECT
          pr.id,
          pr.user_id
       FROM password_resets pr
       INNER JOIN users u
         ON u.id = pr.user_id
       WHERE u.deleted_at IS NULL
       AND (
         LOWER(u.email) = LOWER(?)
         OR u.bar_registration_no = ?
       )
       AND pr.verified = 1
       AND pr.deleted_at IS NULL
       AND pr.expires_at > NOW()
       ORDER BY pr.id DESC
       LIMIT 1`,
      [identifier, identifier]
    );

    if (!rows.length) {
      return res.status(400).json({
        status: false,
        message:
          "OTP verification is missing or expired. Please request a new OTP.",
      });
    }

    const passwordHash = await bcrypt.hash(
      newPassword,
      10
    );

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE users
         SET password = ?
         WHERE id = ?`,
        [
          passwordHash,
          rows[0].user_id,
        ]
      );

      await connection.query(
        `UPDATE password_resets
         SET deleted_at = NOW()
         WHERE id = ?`,
        [rows[0].id]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return res.status(200).json({
      status: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to reset password.",
    });
  }
};