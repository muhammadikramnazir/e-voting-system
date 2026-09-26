import db from "../db/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

/* =====================================================
   HELPERS
===================================================== */

const clean = (value) => String(value ?? "").trim();

const adminToken = (admin) => {
  return jwt.sign(
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
};

const isSettingEnabled = async (settingKey) => {
  try {
    const [rows] = await db.query(
      `
      SELECT setting_value
      FROM system_settings
      WHERE setting_key = ?
      LIMIT 1
      `,
      [settingKey]
    );

    if (!rows.length) {
      return false;
    }

    const value = rows[0].setting_value;

    try {
      return Boolean(JSON.parse(value));
    } catch {
      return (
        value === "true" ||
        value === "1" ||
        value === 1 ||
        value === "on" ||
        value === "yes"
      );
    }
  } catch (error) {
    console.error(
      `CHECK ${settingKey.toUpperCase()} ERROR:`,
      error
    );

    return false;
  }
};

const sendAdminLoginAlert = async (admin) => {
  try {
    const loginAlertsEnabled =
      await isSettingEnabled("loginAlerts");

    if (!loginAlertsEnabled) {
      return;
    }

    if (
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS
    ) {
      console.error(
        "LOGIN ALERT ERROR: EMAIL_USER or EMAIL_PASS is not configured."
      );

      return;
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
      to: admin.email,

      subject: "E-Voting Admin Login Alert",

      text:
        `Hello ${admin.name || "Administrator"},\n\n` +
        `A successful login was detected on your E-Voting administrator account.\n\n` +
        `Account: ${admin.email}\n` +
        `Time: ${new Date().toLocaleString()}\n\n` +
        `If you did not perform this login, please secure your administrator account immediately.\n\n` +
        `District Bar Association E-Voting System`,
    });

    console.log(
      `ADMIN LOGIN ALERT: Email sent to ${admin.email}`
    );
  } catch (error) {
    console.error(
      "SEND ADMIN LOGIN ALERT ERROR:",
      error
    );
  }
};

/* =====================================================
   BOOTSTRAP ADMIN
===================================================== */

export const bootstrapAdmin = async () => {
  try {
    const email = clean(process.env.ADMIN_EMAIL).toLowerCase();
    const password = String(process.env.ADMIN_PASSWORD || "");

    if (!email || !password) {
      return;
    }

    /*
      IMPORTANT:
      Sirf ye check karna hai ke database mein koi admin
      already exist karta hai ya nahi.

      Is se .env email change karne par duplicate admin
      automatically create nahi hoga.
    */

    const [rows] = await db.query(
      `SELECT id FROM admins LIMIT 1`
    );

    if (rows.length) {
      return;
    }

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO admins
        (
          name,
          email,
          password,
          role,
          department,
          status
        )
       VALUES
        (
          ?,
          ?,
          ?,
          'Super Admin',
          'Administration',
          'Active'
        )`,
      [
        process.env.ADMIN_NAME || "System Administrator",
        email,
        hash,
      ]
    );

    // Keep the dashboard setting aligned with the actual bootstrap admin.
    await db.query(
      `INSERT INTO system_settings (setting_key, setting_value)
       VALUES ('adminEmail', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(email)]
    );

    console.log(`Default admin created for ${email}`);
  } catch (error) {
    console.error("BOOTSTRAP ADMIN ERROR:", error);
    throw error;
  }
};

/* =====================================================
   SYNC ELECTION STATUSES
===================================================== */

export const syncElectionStatuses = async () => {
  try {
    /*
     * Upcoming election:
     * Start time aa chuka hai
     * -> Active
     */
    const [upcomingResult] = await db.query(`
      UPDATE elections
      SET status = 'Active'
      WHERE deleted_at IS NULL
        AND status = 'Upcoming'
        AND start_at <= NOW()
        AND end_at > NOW()
    `);

    if (upcomingResult.affectedRows > 0) {
      console.log(
        `ELECTION STATUS: ${upcomingResult.affectedRows} election(s) changed from Upcoming to Active.`
      );
    }

    /*
     * Active election:
     * End time aa chuka hai
     * -> Completed
     *
     * Results publishing is handled separately
     * by autoPublishResultsIfEnabled().
     */
    const [completedResult] = await db.query(`
      UPDATE elections
      SET status = 'Completed'
      WHERE deleted_at IS NULL
        AND status = 'Active'
        AND end_at <= NOW()
    `);

    if (completedResult.affectedRows > 0) {
      console.log(
        `ELECTION STATUS: ${completedResult.affectedRows} election(s) changed from Active to Completed.`
      );
    }
  } catch (error) {
    console.error(
      "SYNC ELECTION STATUS ERROR:",
      error
    );
  }
};

export const autoPublishResultsIfEnabled = async () => {
  try {
    /*
     * Check Auto Publish Results setting
     */
    const [settingRows] = await db.query(`
      SELECT setting_value
      FROM system_settings
      WHERE setting_key = 'autoPublishResults'
      LIMIT 1
    `);

    if (!settingRows.length) {
      return;
    }

    const rawValue = settingRows[0].setting_value;

    let enabled = false;

    try {
      enabled = Boolean(JSON.parse(rawValue));
    } catch {
      enabled =
        rawValue === "true" ||
        rawValue === "1" ||
        rawValue === 1;
    }

    /*
     * Auto publishing is disabled.
     */
    if (!enabled) {
      return;
    }

    /*
     * Find elections whose end time has passed
     * and whose results are not published yet.
     */
    const [elections] = await db.query(`
      SELECT id, title
      FROM elections
      WHERE deleted_at IS NULL
        AND end_at <= NOW()
        AND results_published = 0
        AND status <> 'Cancelled'
    `);

    if (!elections.length) {
      return;
    }

    /*
     * Publish results for all completed elections.
     */
    for (const election of elections) {
      await db.query(
        `
        UPDATE elections
        SET
          results_published = 1,
          status = CASE
            WHEN status = 'Cancelled'
            THEN status
            ELSE 'Completed'
          END
        WHERE id = ?
          AND deleted_at IS NULL
          AND results_published = 0
        `,
        [election.id]
      );

      console.log(
        `AUTO PUBLISH: Results published for election "${election.title}" (ID: ${election.id})`
      );
    }
  } catch (error) {
    console.error(
      "AUTO PUBLISH RESULTS ERROR:",
      error
    );
  }
};

/* =====================================================
   ADMIN LOGIN
===================================================== */

export const loginAdmin = async (req, res) => {
  try {
    const email = clean(
      req.body?.email
    ).toLowerCase();

    const password = String(
      req.body?.password || ""
    );

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message:
          "Email and password are required.",
      });
    }

    /* =====================================================
       FIND ADMIN
    ===================================================== */

    const [rows] = await db.query(
      `SELECT
        id,
        name,
        email,
        password,
        role,
        department,
        status
       FROM admins
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({
        status: false,
        message:
          "Invalid admin credentials.",
      });
    }

    const admin = rows[0];

    /* =====================================================
       CHECK ADMIN STATUS
    ===================================================== */

    if (
      admin.status !== "Active"
    ) {
      return res.status(403).json({
        status: false,
        message:
          "Admin account is not active.",
      });
    }

    /* =====================================================
       CHECK PASSWORD
    ===================================================== */

    const passwordValid =
      await bcrypt.compare(
        password,
        admin.password
      );

    if (!passwordValid) {
      return res.status(401).json({
        status: false,
        message:
          "Invalid admin credentials.",
      });
    }

    /* =====================================================
       CHECK TWO-FACTOR SETTING
    ===================================================== */

    let twoFactorEnabled =
      false;

    try {
      const [settingRows] =
        await db.query(
          `SELECT setting_value
           FROM system_settings
           WHERE setting_key = 'twoFactor'
           LIMIT 1`
        );

      if (settingRows.length) {
        const value =
          settingRows[0]
            .setting_value;

        try {
          twoFactorEnabled =
            Boolean(
              JSON.parse(value)
            );
        } catch {
          twoFactorEnabled =
            value === "true" ||
            value === "1" ||
            value === 1;
        }
      }
    } catch (settingError) {
      console.error(
        "CHECK TWO FACTOR SETTING ERROR:",
        settingError
      );

      /*
       * If the setting cannot be read,
       * keep the existing normal login
       * behavior instead of locking out
       * the administrator.
       */
      twoFactorEnabled = false;
    }

    /* =====================================================
       REMOVE PASSWORD FROM ADMIN OBJECT
    ===================================================== */

    delete admin.password;

    /* =====================================================
       TWO-FACTOR ENABLED
    ===================================================== */

    if (twoFactorEnabled) {
      /*
       * IMPORTANT:
       * Do NOT issue the final JWT yet.
       *
       * Frontend will request the OTP and then
       * verify it through the 2FA endpoint.
       */

      return res.json({
        status: true,

        message:
          "Password verified. Two-factor authentication is required.",

        requiresTwoFactor: true,

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
    }

    /* =====================================================
       NORMAL LOGIN — 2FA DISABLED
    ===================================================== */

    // Send login alert without delaying login response
    sendAdminLoginAlert(admin).catch((error) => {
      console.error(
        "BACKGROUND LOGIN ALERT ERROR:",
        error
      );
    });

    return res.json({
      status: true,

      message:
        "Admin login successful.",

      requiresTwoFactor: false,

      token:
        adminToken(admin),

      admin,
    });
  } catch (error) {
    console.error(
      "ADMIN LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        "Admin login failed.",
    });
  }
};

/* =====================================================
   ADMIN PROFILE
===================================================== */

export const getAdminProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        name,
        email,
        role,
        department,
        status,
        created_at
       FROM admins
       WHERE id = ?
       LIMIT 1`,
      [req.admin.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        status: false,
        message: "Admin not found.",
      });
    }

    return res.json({
      status: true,
      admin: rows[0],
    });
  } catch (error) {
    console.error("GET ADMIN PROFILE ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to load admin profile.",
    });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const name = clean(req.body?.name);
    const email = clean(req.body?.email).toLowerCase();
    const department = clean(req.body?.department);

    if (!name || !email) {
      return res.status(400).json({
        status: false,
        message: "Name and email are required.",
      });
    }

    const [dupe] = await db.query(
      `SELECT id
       FROM admins
       WHERE email = ?
       AND id <> ?
       LIMIT 1`,
      [
        email,
        req.admin.id,
      ]
    );

    if (dupe.length) {
      return res.status(409).json({
        status: false,
        message: "Email is already in use.",
      });
    }

    await db.query(
      `UPDATE admins
       SET
         name = ?,
         email = ?,
         department = ?
       WHERE id = ?`,
      [
        name,
        email,
        department || "Administration",
        req.admin.id,
      ]
    );

    return getAdminProfile(req, res);
  } catch (error) {
    console.error("UPDATE ADMIN PROFILE ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to update admin profile.",
    });
  }
};

/* =====================================================
   ADMIN PASSWORD
===================================================== */

export const updateAdminPassword = async (req, res) => {
  try {
    const currentPassword = String(
      req.body?.currentPassword || ""
    );

    const newPassword = String(
      req.body?.newPassword || ""
    );

    const confirmPassword = String(
      req.body?.confirmPassword || ""
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
       FROM admins
       WHERE id = ?
       LIMIT 1`,
      [req.admin.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        status: false,
        message: "Admin not found.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      rows[0].password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        status: false,
        message: "Current password is incorrect.",
      });
    }

    const hash = await bcrypt.hash(
      newPassword,
      10
    );

    await db.query(
      `UPDATE admins
       SET password = ?
       WHERE id = ?`,
      [
        hash,
        req.admin.id,
      ]
    );

    return res.json({
      status: true,
      message: "Admin password updated successfully.",
    });
  } catch (error) {
    console.error("ADMIN PASSWORD ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to update admin password.",
    });
  }
};

/* =====================================================
   DASHBOARD
===================================================== */

export const dashboard = async (req, res) => {
  try {
    // -------------------------------------------------
    // TOTAL LAWYERS
    // -------------------------------------------------
    const [[lawyers]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM users
       WHERE deleted_at IS NULL`
    );

    // -------------------------------------------------
    // TOTAL CANDIDATES
    // -------------------------------------------------
    const [[candidates]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM candidates
       WHERE deleted_at IS NULL`
    );

    // -------------------------------------------------
    // ACTIVE ELECTIONS
    // -------------------------------------------------
    const [[activeElections]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM elections
       WHERE status = 'Active'
       AND deleted_at IS NULL`
    );

    // -------------------------------------------------
    // TOTAL VALID VOTES
    // -------------------------------------------------
    const [[votes]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM votes
       WHERE status = 'Valid'`
    );

    // -------------------------------------------------
    // CURRENT ACTIVE ELECTION
    // -------------------------------------------------
    const [[activeElection]] = await db.query(
      `SELECT
        id,
        title,
        type,
        description,
        start_at,
        end_at,
        status,
        results_published
       FROM elections
       WHERE status = 'Active'
       AND deleted_at IS NULL
       ORDER BY start_at ASC
       LIMIT 1`
    );

    // -------------------------------------------------
    // ELIGIBLE VERIFIED LAWYERS
    // -------------------------------------------------
    const [[eligibleVoters]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM users
       WHERE status = 'Verified'
       AND deleted_at IS NULL`
    );

    // -------------------------------------------------
    // CURRENT ELECTION VOTING STATISTICS
    // -------------------------------------------------
    let currentElectionStats = {
      eligibleVoters: Number(eligibleVoters.total || 0),
      votesCast: 0,
      uniqueVoters: 0,
      notVoted: Number(eligibleVoters.total || 0),
      turnout: 0,
    };

    if (activeElection) {
      const [[electionVotes]] = await db.query(
        `SELECT
          COUNT(*) AS totalVotes,
          COUNT(DISTINCT voter_id) AS uniqueVoters
         FROM votes
         WHERE election_id = ?
         AND status = 'Valid'`,
        [activeElection.id]
      );

      const totalEligible = Number(
        eligibleVoters.total || 0
      );

      const uniqueVoters = Number(
        electionVotes.uniqueVoters || 0
      );

      const totalVotes = Number(
        electionVotes.totalVotes || 0
      );

      const turnout =
        totalEligible > 0
          ? Number(
            ((uniqueVoters / totalEligible) * 100).toFixed(1)
          )
          : 0;

      currentElectionStats = {
        eligibleVoters: totalEligible,
        votesCast: totalVotes,
        uniqueVoters,
        notVoted: Math.max(
          totalEligible - uniqueVoters,
          0
        ),
        turnout,
      };
    }

    // -------------------------------------------------
    // RECENT LAWYERS
    // -------------------------------------------------
    const [recentLawyers] = await db.query(
      `SELECT
        id,
        full_name AS name,
        email,
        bar_registration_no AS registration,
        created_at AS date,
        status
       FROM users
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 5`
    );

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------
    return res.json({
      status: true,

      stats: {
        registeredLawyers: Number(lawyers.total || 0),
        candidates: Number(candidates.total || 0),
        activeElections: Number(activeElections.total || 0),
        votesCast: Number(votes.total || 0),
      },

      votingOverview: currentElectionStats,

      activeElection: activeElection || null,

      recentLawyers,

      recentActivities: [],
    });
  } catch (error) {
    console.error(
      "ADMIN DASHBOARD ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to load dashboard.",
    });
  }
};

/* =====================================================
   LAWYERS
===================================================== */

export const listLawyers = async (req, res) => {
  try {
    const search = clean(req.query.search);
    const status = clean(req.query.status);

    const params = [];

    let where = `
      WHERE u.deleted_at IS NULL
    `;

    if (search) {
      where += `
        AND (
          u.full_name LIKE ?
          OR u.email LIKE ?
          OR u.bar_registration_no LIKE ?
          OR u.cnic_number LIKE ?
        )
      `;

      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }

    if (status && status !== "All") {
      where += ` AND u.status = ?`;
      params.push(status);
    }

    const [rows] = await db.query(
      `SELECT
        u.id,
        u.full_name AS name,
        u.email,
        u.bar_registration_no AS barNumber,
        u.license_number AS licenseNumber,
        u.cnic_number AS cnic,
        u.phone_number AS phone,
        u.status,
        u.created_at,
        lp.bar_association AS barAssociation

       FROM users u

       LEFT JOIN lawyer_profiles lp
         ON lp.user_id = u.id
         AND lp.deleted_at IS NULL

       ${where}

       ORDER BY u.id DESC`,
      params
    );

    return res.json({
      status: true,
      lawyers: rows,
    });
  } catch (error) {
    console.error("LIST LAWYERS ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch lawyers.",
    });
  }
};

export const getLawyer = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        u.id,
        u.full_name AS name,
        u.email,
        u.bar_registration_no AS barNumber,
        u.license_number AS licenseNumber,
        u.cnic_number AS cnic,
        u.phone_number AS phone,
        u.status,
        lp.*

       FROM users u

       LEFT JOIN lawyer_profiles lp
         ON lp.user_id = u.id
         AND lp.deleted_at IS NULL

       WHERE u.id = ?
       AND u.deleted_at IS NULL`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        status: false,
        message: "Lawyer not found.",
      });
    }

    return res.json({
      status: true,
      lawyer: rows[0],
    });
  } catch (error) {
    console.error("GET LAWYER ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch lawyer.",
    });
  }
};

export const updateLawyer = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      fullName,
      phoneNumber,
      status,
      practiceArea,
      yearsOfPractice,
      chamberAddress,
      additionalInfo,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Invalid lawyer id.",
      });
    }

    if (
      status &&
      ![
        "Pending",
        "Verified",
        "Suspended",
      ].includes(status)
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid lawyer status.",
      });
    }

    await db.query(
      `UPDATE users
       SET
         full_name = COALESCE(?, full_name),
         phone_number = COALESCE(?, phone_number),
         status = COALESCE(?, status)
       WHERE id = ?
       AND deleted_at IS NULL`,
      [
        clean(fullName) || null,
        clean(phoneNumber) || null,
        status || null,
        id,
      ]
    );

    await db.query(
      `UPDATE lawyer_profiles
       SET
         practice_area = COALESCE(?, practice_area),
         years_of_practice = COALESCE(?, years_of_practice),
         chamber_address = COALESCE(?, chamber_address),
         additional_info = COALESCE(?, additional_info)
       WHERE user_id = ?
       AND deleted_at IS NULL`,
      [
        clean(practiceArea) || null,
        yearsOfPractice === undefined
          ? null
          : Number(yearsOfPractice),
        clean(chamberAddress) || null,
        clean(additionalInfo) || null,
        id,
      ]
    );

    return getLawyer(req, res);
  } catch (error) {
    console.error("UPDATE LAWYER ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to update lawyer.",
    });
  }
};

export const deleteLawyer = async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE users
       SET deleted_at = NOW()
       WHERE id = ?
       AND deleted_at IS NULL`,
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        status: false,
        message: "Lawyer not found.",
      });
    }

    return res.json({
      status: true,
      message: "Lawyer removed successfully.",
    });
  } catch (error) {
    console.error("DELETE LAWYER ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to remove lawyer.",
    });
  }
};

export const updateLawyerStatus = async (req, res) => {
  try {
    const status = clean(req.body?.status);

    if (
      ![
        "Pending",
        "Verified",
        "Suspended",
      ].includes(status)
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid status.",
      });
    }

    await db.query(
      `UPDATE users
       SET status = ?
       WHERE id = ?
       AND deleted_at IS NULL`,
      [
        status,
        req.params.id,
      ]
    );

    return res.json({
      status: true,
      message: "Lawyer status updated.",
    });
  } catch (error) {
    console.error("UPDATE LAWYER STATUS ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to update lawyer status.",
    });
  }
};

/* =====================================================
   GENERIC CRUD CONFIG
===================================================== */

const crudConfig = {
  elections: {
    table: "elections",

    fields: [
      "title",
      "type",
      "description",
      "start_at",
      "end_at",
      "status",
    ],
  },

  positions: {
    table: "positions",

    fields: [
      "election_id",
      "name",
      "description",
      "seats",
      "status",
      "sort_order",
    ],
  },

  candidates: {
    table: "candidates",

    fields: [
      "election_id",
      "position_id",
      "name",
      "bar_number",
      "photo",
      "nomination",
      "manifesto",
      "status",
    ],
  },

  notices: {
    table: "notices",

    fields: [
      "title",
      "description",
      "category",
      "status",
      "important",
      "published_at",
    ],
  },
};

/* =====================================================
   GENERIC LIST
===================================================== */

export const listGeneric = (resource) => async (
  req,
  res
) => {
  try {
    const c = crudConfig[resource];

    const [rows] = await db.query(
      `SELECT *
       FROM ${c.table}
       WHERE deleted_at IS NULL
       ORDER BY id DESC`
    );

    return res.json({
      status: true,
      [resource]: rows,
    });
  } catch (error) {
    console.error(
      `LIST ${resource}:`,
      error
    );

    return res.status(500).json({
      status: false,
      message: `Failed to fetch ${resource}.`,
    });
  }
};

/* =====================================================
   GENERIC CREATE
===================================================== */

export const createGeneric = (resource) => async (
  req,
  res
) => {
  try {
    const c = crudConfig[resource];

    const values = c.fields.map(
      (field) => req.body[field]
    );

    if (resource === "elections") {
      if (
        !req.body.title ||
        !req.body.startAt ||
        !req.body.endAt
      ) {
        return res.status(400).json({
          status: false,
          message:
            "Title, start date/time and end date/time are required.",
        });
      }

      values[
        c.fields.indexOf("start_at")
      ] = req.body.startAt;

      values[
        c.fields.indexOf("end_at")
      ] = req.body.endAt;
    }

    const placeholders = c.fields
      .map(() => "?")
      .join(",");

    const [result] = await db.query(
      `INSERT INTO ${c.table}
        (${c.fields.join(",")})
       VALUES
        (${placeholders})`,
      values
    );

    return res.status(201).json({
      status: true,
      message: `${resource} created successfully.`,
      id: result.insertId,
    });
  } catch (error) {
    console.error(
      `CREATE ${resource}:`,
      error
    );

    return res.status(500).json({
      status: false,
      message: `Failed to create ${resource}.`,
    });
  }
};

/* =====================================================
   GENERIC UPDATE
===================================================== */

export const updateGeneric = (resource) => async (
  req,
  res
) => {
  try {
    const c = crudConfig[resource];

    if (!c) {
      return res.status(400).json({
        status: false,
        message: "Invalid resource.",
      });
    }

    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Invalid record id.",
      });
    }

    const body = req.body || {};
    const updates = {};

    /* Common fields */

    if (body.title !== undefined) {
      updates.title = body.title;
    }

    if (body.description !== undefined) {
      updates.description = body.description;
    }

    if (body.category !== undefined) {
      updates.category = body.category;
    }

    if (body.status !== undefined) {
      updates.status = body.status;
    }

    if (body.important !== undefined) {
      updates.important =
        Number(body.important) ? 1 : 0;
    }

    /* Elections */

    if (resource === "elections") {
      if (body.type !== undefined) {
        updates.type = body.type;
      }

      if (body.startAt !== undefined) {
        updates.start_at = body.startAt;
      } else if (body.start_at !== undefined) {
        updates.start_at = body.start_at;
      }

      if (body.endAt !== undefined) {
        updates.end_at = body.endAt;
      } else if (body.end_at !== undefined) {
        updates.end_at = body.end_at;
      }
    }

    /* Positions */

    if (resource === "positions") {
      if (body.electionId !== undefined) {
        updates.election_id =
          body.electionId;
      } else if (
        body.election_id !== undefined
      ) {
        updates.election_id =
          body.election_id;
      }

      if (body.name !== undefined) {
        updates.name = body.name;
      }

      if (body.seats !== undefined) {
        updates.seats = body.seats;
      }

      if (body.sortOrder !== undefined) {
        updates.sort_order =
          body.sortOrder;
      } else if (
        body.sort_order !== undefined
      ) {
        updates.sort_order =
          body.sort_order;
      }
    }

    /* Candidates */

    if (resource === "candidates") {
      if (body.electionId !== undefined) {
        updates.election_id =
          body.electionId;
      } else if (
        body.election_id !== undefined
      ) {
        updates.election_id =
          body.election_id;
      }

      if (body.positionId !== undefined) {
        updates.position_id =
          body.positionId;
      } else if (
        body.position_id !== undefined
      ) {
        updates.position_id =
          body.position_id;
      }

      if (body.name !== undefined) {
        updates.name = body.name;
      }

      if (body.barNumber !== undefined) {
        updates.bar_number =
          body.barNumber;
      } else if (
        body.bar_number !== undefined
      ) {
        updates.bar_number =
          body.bar_number;
      }

      if (body.photo !== undefined) {
        updates.photo = body.photo;
      }

      if (body.nomination !== undefined) {
        updates.nomination =
          body.nomination;
      }

      if (body.manifesto !== undefined) {
        updates.manifesto =
          body.manifesto;
      }
    }

    /* Notices */

    if (resource === "notices") {
      if (body.publishedAt !== undefined) {
        updates.published_at =
          body.publishedAt;
      } else if (
        body.published_at !== undefined
      ) {
        updates.published_at =
          body.published_at;
      }

      if (
        body.status !== undefined &&
        body.status === "Published" &&
        body.publishedAt === undefined &&
        body.published_at === undefined
      ) {
        updates.published_at = new Date();
      }

      if (
        body.status !== undefined &&
        body.status !== "Published"
      ) {
        updates.published_at = null;
      }
    }

    const entries = Object.entries(
      updates
    ).filter(
      ([, value]) => value !== undefined
    );

    if (!entries.length) {
      return res.status(400).json({
        status: false,
        message: "No fields to update.",
      });
    }

    const setClause = entries
      .map(([field]) => `${field} = ?`)
      .join(", ");

    const values = entries.map(
      ([, value]) => value
    );

    const [result] = await db.query(
      `UPDATE ${c.table}
       SET ${setClause}
       WHERE id = ?
       AND deleted_at IS NULL`,
      [
        ...values,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: `${resource} record not found.`,
      });
    }

    return res.json({
      status: true,
      message: `${resource} updated successfully.`,
    });
  } catch (error) {
    console.error(
      `UPDATE ${resource} ERROR:`,
      error
    );

    return res.status(500).json({
      status: false,
      message: `Failed to update ${resource}.`,
    });
  }
};

/* =====================================================
   GENERIC DELETE
===================================================== */

export const deleteGeneric = (resource) => async (
  req,
  res
) => {
  try {
    const c = crudConfig[resource];

    await db.query(
      `UPDATE ${c.table}
       SET deleted_at = NOW()
       WHERE id = ?
       AND deleted_at IS NULL`,
      [req.params.id]
    );

    return res.json({
      status: true,
      message: `${resource} deleted successfully.`,
    });
  } catch (error) {
    console.error(
      `DELETE ${resource}:`,
      error
    );

    return res.status(500).json({
      status: false,
      message: `Failed to delete ${resource}.`,
    });
  }
};

/* =====================================================
   CANDIDATE STATUS
===================================================== */

export const toggleCandidateStatus = async (
  req,
  res
) => {
  try {
    const status = clean(
      req.body?.status
    );

    if (
      ![
        "Pending",
        "Approved",
        "Rejected",
      ].includes(status)
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid candidate status.",
      });
    }

    await db.query(
      `UPDATE candidates
       SET status = ?
       WHERE id = ?
       AND deleted_at IS NULL`,
      [
        status,
        req.params.id,
      ]
    );

    return res.json({
      status: true,
      message: "Candidate status updated.",
    });
  } catch (error) {
    console.error(
      "CANDIDATE STATUS ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        "Failed to update candidate status.",
    });
  }
};

/* =====================================================
   VOTES
===================================================== */

export const listVotes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        v.id,
        v.status,
        v.created_at,

        u.id AS voter_id,
        u.full_name AS voter_name,
        u.bar_registration_no AS voter_bar_number,

        e.id AS election_id,
        e.title AS election,

        p.id AS position_id,
        p.name AS position,

        c.id AS candidate_id,
        c.name AS candidate

      FROM votes v

      INNER JOIN users u
        ON u.id = v.voter_id

      INNER JOIN elections e
        ON e.id = v.election_id

      INNER JOIN positions p
        ON p.id = v.position_id

      INNER JOIN candidates c
        ON c.id = v.candidate_id

      ORDER BY v.id DESC
    `);

    return res.json({
      status: true,
      votes: rows,
    });
  } catch (error) {
    console.error(
      "LIST VOTES ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to fetch votes.",
    });
  }
};

export const updateVoteStatus = async (
  req,
  res
) => {
  try {
    const status = clean(
      req.body?.status
    );

    if (
      ![
        "Valid",
        "Invalid",
      ].includes(status)
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid vote status.",
      });
    }

    await db.query(
      `UPDATE votes
       SET status = ?
       WHERE id = ?`,
      [
        status,
        req.params.id,
      ]
    );

    return res.json({
      status: true,
      message: "Vote status updated.",
    });
  } catch (error) {
    console.error(
      "UPDATE VOTE STATUS ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to update vote status.",
    });
  }
};

export const deleteVote = async (
  req,
  res
) => {
  try {
    const voteId = Number(
      req.params.id
    );

    if (!voteId) {
      return res.status(400).json({
        status: false,
        message: "Invalid vote id.",
      });
    }

    const [result] = await db.query(
      `DELETE FROM votes
       WHERE id = ?`,
      [voteId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: "Vote record not found.",
      });
    }

    return res.json({
      status: true,
      message: "Vote deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE VOTE ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to delete vote.",
    });
  }
};

export const voteStats = async (
  req,
  res
) => {
  try {
    const [[total]] = await db.query(
      `SELECT COUNT(*) total
       FROM votes`
    );

    const [[valid]] = await db.query(
      `SELECT COUNT(*) total
       FROM votes
       WHERE status = 'Valid'`
    );

    const [[invalid]] = await db.query(
      `SELECT COUNT(*) total
       FROM votes
       WHERE status = 'Invalid'`
    );

    return res.json({
      status: true,

      statistics: {
        total: total.total,
        valid: valid.total,
        invalid: invalid.total,
      },
    });
  } catch (error) {
    console.error(
      "VOTE STATS ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to fetch vote statistics.",
    });
  }
};

/* =====================================================
   RESULTS
===================================================== */

export const adminResults = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        e.id AS election_id,
        e.title AS election,

        p.id AS position_id,
        p.name AS position,

        c.id AS candidate_id,
        c.name AS candidate,

        COUNT(v.id) AS votes,

        /* Current eligible lawyers */
        (
          SELECT COUNT(*)
          FROM users eu
          WHERE eu.status = 'Verified'
            AND eu.deleted_at IS NULL
        ) AS eligible_voters,

        /* Unique lawyers who actually voted in this election */
        (
          SELECT COUNT(DISTINCT ev.voter_id)
          FROM votes ev
          INNER JOIN users euv
            ON euv.id = ev.voter_id
          WHERE ev.election_id = e.id
            AND ev.status = 'Valid'
            AND euv.deleted_at IS NULL
        ) AS unique_voters,

        /* Total valid vote records for this election */
        (
          SELECT COUNT(*)
          FROM votes etv
          WHERE etv.election_id = e.id
            AND etv.status = 'Valid'
        ) AS total_election_votes

      FROM elections e

      INNER JOIN positions p
        ON p.election_id = e.id
        AND p.deleted_at IS NULL

      INNER JOIN candidates c
        ON c.position_id = p.id
        AND c.election_id = e.id
        AND c.deleted_at IS NULL

      LEFT JOIN votes v
        ON v.candidate_id = c.id
        AND v.election_id = e.id
        AND v.position_id = p.id
        AND v.status = 'Valid'

      WHERE e.deleted_at IS NULL

      GROUP BY
        e.id,
        e.title,
        p.id,
        p.name,
        c.id,
        c.name

      ORDER BY
        e.id DESC,
        p.sort_order ASC,
        votes DESC
    `);

    return res.json({
      status: true,
      results: rows,
    });
  } catch (error) {
    console.error(
      "ADMIN RESULTS ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to load results.",
    });
  }
};

export const publishResults = async (
  req,
  res
) => {
  try {
    await db.query(
      `UPDATE elections
       SET results_published = ?
       WHERE id = ?
       AND deleted_at IS NULL`,
      [
        req.body?.published ? 1 : 0,
        req.params.electionId,
      ]
    );

    return res.json({
      status: true,
      message: req.body?.published
        ? "Results published."
        : "Results unpublished.",
    });
  } catch (error) {
    console.error(
      "PUBLISH RESULTS ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to update result publication.",
    });
  }
};

/* =====================================================
   SUPPORT
===================================================== */

export const listSupport = async (
  req,
  res
) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.*,
        u.full_name AS name,
        u.email,
        u.bar_registration_no AS bar_number

      FROM support_requests s

      INNER JOIN users u
        ON u.id = s.user_id

      ORDER BY s.id DESC
    `);

    return res.json({
      status: true,
      requests: rows,
    });
  } catch (error) {
    console.error(
      "LIST SUPPORT ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to fetch support requests.",
    });
  }
};

export const getSupport = async (
  req,
  res
) => {
  try {
    const [rows] = await db.query(
      `SELECT
        s.*,
        u.full_name AS name,
        u.email,
        u.bar_registration_no AS bar_number

       FROM support_requests s

       INNER JOIN users u
         ON u.id = s.user_id

       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        status: false,
        message: "Support request not found.",
      });
    }

    return res.json({
      status: true,
      request: rows[0],
    });
  } catch (error) {
    console.error(
      "GET SUPPORT ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to fetch support request.",
    });
  }
};

export const updateSupportStatus = async (
  req,
  res
) => {
  try {
    const status = clean(
      req.body?.status
    );

    if (
      ![
        "Open",
        "In Progress",
        "Resolved",
        "Closed",
      ].includes(status)
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid support status.",
      });
    }

    await db.query(
      `UPDATE support_requests
       SET
         status = ?,
         resolved_at =
           IF(
             ? IN ('Resolved','Closed'),
             NOW(),
             NULL
           )
       WHERE id = ?`,
      [
        status,
        status,
        req.params.id,
      ]
    );

    return res.json({
      status: true,
      message: "Support status updated.",
    });
  } catch (error) {
    console.error(
      "UPDATE SUPPORT STATUS ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to update support status.",
    });
  }
};

export const deleteSupport = async (
  req,
  res
) => {
  try {
    await db.query(
      `DELETE FROM support_requests
       WHERE id = ?`,
      [req.params.id]
    );

    return res.json({
      status: true,
      message: "Support request deleted.",
    });
  } catch (error) {
    console.error(
      "DELETE SUPPORT ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to delete support request.",
    });
  }
};

/* =====================================================
   SETTINGS
===================================================== */

export const getSettings = async (
  req,
  res
) => {
  try {
    const [rows] = await db.query(
      `SELECT
        setting_key,
        setting_value
       FROM system_settings
       ORDER BY setting_key`
    );

    const settings = {};

    rows.forEach((row) => {
      try {
        settings[row.setting_key] =
          JSON.parse(row.setting_value);
      } catch {
        settings[row.setting_key] =
          row.setting_value;
      }
    });

    return res.json({
      status: true,
      settings,
    });
  } catch (error) {
    console.error(
      "GET SETTINGS ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to load settings.",
    });
  }
};

export const updateSettings = async (
  req,
  res
) => {
  const settings =
    req.body?.settings;

  if (
    !settings ||
    typeof settings !== "object"
  ) {
    return res.status(400).json({
      status: false,
      message: "Settings object is required.",
    });
  }

  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    for (
      const [key, value]
      of Object.entries(settings)
    ) {
      await connection.query(
        `INSERT INTO system_settings
          (
            setting_key,
            setting_value
          )
         VALUES (?, ?)

         ON DUPLICATE KEY UPDATE
           setting_value = VALUES(setting_value)`,
        [
          key,
          JSON.stringify(value),
        ]
      );
    }

    await connection.commit();

    return res.json({
      status: true,
      message: "Settings saved successfully.",
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "UPDATE SETTINGS ERROR:",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Failed to save settings.",
    });
  } finally {
    connection.release();
  }
};