import db from "../db/database.js";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const normalize = (v) => String(v ?? "").trim();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadPath = path.join(__dirname, "../uploads");

/*
|--------------------------------------------------------------------------
| Get Profile
|--------------------------------------------------------------------------
*/

export const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        u.id,
        u.full_name,
        u.email,
        u.bar_registration_no,
        u.license_number,
        u.cnic_number,
        u.phone_number,
        u.status,
        lp.bar_association,
        lp.enrollment_date,
        lp.practice_area,
        lp.years_of_practice,
        lp.chamber_address,
        lp.additional_info,
        lp.profile_photo
       FROM users u
       LEFT JOIN lawyer_profiles lp
         ON lp.user_id = u.id
        AND lp.deleted_at IS NULL
       WHERE u.id = ?
         AND u.deleted_at IS NULL
       LIMIT 1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    return res.json({
      status: true,
      message: "Profile fetched successfully.",
      user: rows[0],
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch profile.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Profile + Profile Photo
|--------------------------------------------------------------------------
*/

export const updateProfile = async (req, res) => {
  let newUploadedFile = null;

  try {
    const userId = req.user.id;

    const fullName = normalize(req.body?.fullName);
    const phoneNumber = normalize(req.body?.phoneNumber);
    const practiceArea = normalize(req.body?.practiceArea);

    const yearsOfPractice =
      req.body?.yearsOfPractice === undefined ||
        req.body?.yearsOfPractice === ""
        ? 0
        : Number(req.body.yearsOfPractice);

    const chamberAddress = normalize(
      req.body?.chamberAddress ?? req.body?.chamber_address
    );
    const additionalInfo = normalize(req.body?.additionalInfo);

    if (!fullName || !phoneNumber) {
      return res.status(400).json({
        status: false,
        message: "Full name and phone number are required.",
      });
    }

    if (
      !Number.isInteger(yearsOfPractice) ||
      yearsOfPractice < 0
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Years of practice must be a valid non-negative number.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Save uploaded file information temporarily
    |--------------------------------------------------------------------------
    */

    if (req.file) {
      newUploadedFile = req.file.filename;
    }

    /*
    |--------------------------------------------------------------------------
    | Get existing profile photo
    |--------------------------------------------------------------------------
    */

    const [existingProfile] = await db.query(
      `SELECT profile_photo
       FROM lawyer_profiles
       WHERE user_id = ?
         AND deleted_at IS NULL
       LIMIT 1`,
      [userId]
    );

    const oldProfilePhoto =
      existingProfile.length > 0
        ? existingProfile[0].profile_photo
        : null;

    /*
    |--------------------------------------------------------------------------
    | Database Transaction
    |--------------------------------------------------------------------------
    */

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      /*
      | Update main user information
      */

      const [userUpdate] = await connection.query(
        `UPDATE users
         SET full_name = ?,
             phone_number = ?
         WHERE id = ?
           AND deleted_at IS NULL`,
        [fullName, phoneNumber, userId]
      );

      if (userUpdate.affectedRows === 0) {
        await connection.rollback();

        if (newUploadedFile) {
          await deleteUploadedFile(newUploadedFile);
          newUploadedFile = null;
        }

        return res.status(404).json({
          status: false,
          message: "User not found.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Create lawyer profile if it does not exist
      |--------------------------------------------------------------------------
      */

      await connection.query(
        `INSERT INTO lawyer_profiles
          (
            user_id,
            bar_registration_number,
            license_number,
            bar_association,
            enrollment_date,
            practice_area,
            years_of_practice,
            chamber_address,
            additional_info,
            profile_photo
          )
         SELECT
            id,
            bar_registration_no,
            license_number,
            ?,
            CURDATE(),
            ?,
            ?,
            ?,
            ?,
            ?
         FROM users
         WHERE id = ?
           AND NOT EXISTS (
             SELECT 1
             FROM lawyer_profiles
             WHERE user_id = ?
               AND deleted_at IS NULL
           )`,
        [
          process.env.DEFAULT_BAR_ASSOCIATION ||
          "District Bar Association",
          practiceArea || null,
          yearsOfPractice,
          chamberAddress || null,
          additionalInfo || null,
          newUploadedFile,
          userId,
          userId,
        ]
      );

      /*
      |--------------------------------------------------------------------------
      | Update lawyer profile
      |--------------------------------------------------------------------------
      */

      if (newUploadedFile) {
        await connection.query(
          `UPDATE lawyer_profiles
           SET practice_area = ?,
               years_of_practice = ?,
               chamber_address = ?,
               additional_info = ?,
               profile_photo = ?
           WHERE user_id = ?
             AND deleted_at IS NULL`,
          [
            practiceArea || null,
            yearsOfPractice,
            chamberAddress || null,
            additionalInfo || null,
            newUploadedFile,
            userId,
          ]
        );
      } else {
        await connection.query(
          `UPDATE lawyer_profiles
           SET practice_area = ?,
               years_of_practice = ?,
               chamber_address = ?,
               additional_info = ?
           WHERE user_id = ?
             AND deleted_at IS NULL`,
          [
            practiceArea || null,
            yearsOfPractice,
            chamberAddress || null,
            additionalInfo || null,
            userId,
          ]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();

      /*
      | If database operation fails after Multer
      | already saved the new file, remove it.
      */

      if (newUploadedFile) {
        await deleteUploadedFile(newUploadedFile);
      }

      throw error;
    } finally {
      connection.release();
    }

    /*
    |--------------------------------------------------------------------------
    | Delete old profile photo after successful DB update
    |--------------------------------------------------------------------------
    */

    if (
      newUploadedFile &&
      oldProfilePhoto &&
      oldProfilePhoto !== newUploadedFile
    ) {
      await deleteUploadedFile(oldProfilePhoto);
    }

    /*
    |--------------------------------------------------------------------------
    | Return updated profile
    |--------------------------------------------------------------------------
    */

    return getProfile(req, res);
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to update profile.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Delete Uploaded Profile File
|--------------------------------------------------------------------------
*/

const deleteUploadedFile = async (filename) => {
  try {
    if (!filename) return;

    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadPath, safeFilename);

    await fs.unlink(filePath);
  } catch (error) {
    /*
    | File may already be deleted.
    | Do not break the API because of this.
    */

    if (error.code !== "ENOENT") {
      console.error(
        "DELETE PROFILE PHOTO ERROR:",
        error.message
      );
    }
  }
};

/*
|--------------------------------------------------------------------------
| Update Password
|--------------------------------------------------------------------------
*/

export const updatePassword = async (req, res) => {
  try {
    const currentPassword = String(
      req.body?.currentPassword ?? ""
    );

    const newPassword = String(
      req.body?.newPassword ?? ""
    );

    const confirmPassword = String(
      req.body?.confirmPassword ?? ""
    );

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Current password, new password and confirmation are required.",
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
      `SELECT password
       FROM users
       WHERE id = ?
         AND deleted_at IS NULL
       LIMIT 1`,
      [req.user.id]
    );

    if (
      !rows.length ||
      !(await bcrypt.compare(
        currentPassword,
        rows[0].password
      ))
    ) {
      return res.status(401).json({
        status: false,
        message: "Current password is incorrect.",
      });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users
       SET password = ?
       WHERE id = ?`,
      [hash, req.user.id]
    );

    return res.json({
      status: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("UPDATE PASSWORD ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to update password.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Notices
|--------------------------------------------------------------------------
*/

export const getNotices = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        title,
        description AS body,
        category,
        status,
        important,
        published_at,
        created_at
       FROM notices
       WHERE status = 'Published'
       ORDER BY COALESCE(published_at, created_at) DESC`
    );

    return res.json({
      status: true,
      notices: rows,
    });
  } catch (error) {
    console.error("GET NOTICES ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch notices.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Create Support Request
|--------------------------------------------------------------------------
*/

export const createSupportRequest = async (req, res) => {
  try {
    const subject = normalize(req.body?.subject);
    const message = normalize(req.body?.message);
    const category =
      normalize(req.body?.category) || "General";

    if (!subject || !message) {
      return res.status(400).json({
        status: false,
        message: "Subject and message are required.",
      });
    }

    await db.query(
      `INSERT INTO support_requests
        (
          user_id,
          subject,
          message,
          category,
          priority,
          status
        )
       VALUES (?, ?, ?, ?, 'Medium', 'Open')`,
      [
        req.user.id,
        subject,
        message,
        category,
      ]
    );

    return res.status(201).json({
      status: true,
      message:
        "Support request submitted successfully.",
    });
  } catch (error) {
    console.error("CREATE SUPPORT ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to submit support request.",
    });
  }
};