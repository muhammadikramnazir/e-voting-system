import db from "../db/database.js";

const clean = (value) => String(value ?? "").trim();


// ======================================================
// LIST VERIFICATION REQUESTS
// ======================================================

export const listVerifications = async (req, res) => {
    try {
        const search = clean(req.query?.search);
        const status = clean(req.query?.status);

        const params = [];

        let where = `
      WHERE v.deleted_at IS NULL
    `;

        if (search) {
            where += `
        AND (
          v.full_name LIKE ?
          OR v.email LIKE ?
          OR v.cnic_number LIKE ?
          OR v.bar_registration_no LIKE ?
          OR v.license_number LIKE ?
        )
      `;

            const searchValue = `%${search}%`;

            params.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );
        }

        if (
            status &&
            ["Pending", "Approved", "Rejected"].includes(status)
        ) {
            where += ` AND v.status = ?`;
            params.push(status);
        }

        const [rows] = await db.query(
            `
      SELECT
        v.id,
        v.user_id,
        v.full_name,
        v.email,
        v.phone_number,
        v.cnic_number,
        v.bar_registration_no,
        v.license_number,
        v.bar_association,
        v.practice_area,
        v.years_of_practice,
        v.status,
        v.admin_remarks,
        v.submitted_at,
        v.reviewed_at,
        v.created_at,
        v.updated_at
      FROM lawyer_verifications v
      ${where}
      ORDER BY
        CASE
          WHEN v.status = 'Pending' THEN 0
          WHEN v.status = 'Rejected' THEN 1
          WHEN v.status = 'Approved' THEN 2
          ELSE 3
        END,
        v.id DESC
      `,
            params
        );

        return res.json({
            status: true,
            verifications: rows,
        });
    } catch (error) {
        console.error(
            "ADMIN LIST VERIFICATIONS ERROR:",
            error
        );

        return res.status(500).json({
            status: false,
            message: "Failed to fetch verification requests.",
        });
    }
};


// ======================================================
// GET SINGLE VERIFICATION REQUEST
// ======================================================

export const getVerification = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!id) {
            return res.status(400).json({
                status: false,
                message: "Invalid verification id.",
            });
        }

        const [rows] = await db.query(
            `
      SELECT
        v.id,
        v.user_id,
        v.full_name,
        v.email,
        v.phone_number,
        v.cnic_number,
        v.bar_registration_no,
        v.license_number,
        v.bar_association,
        v.practice_area,
        v.years_of_practice,
        v.chamber_address,
        v.cnic_front,
        v.cnic_back,
        v.lawyer_license,
        v.bar_card,
        v.additional_document,
        v.status,
        v.admin_remarks,
        v.submitted_at,
        v.reviewed_at,
        v.created_at,
        v.updated_at
      FROM lawyer_verifications v
      WHERE v.id = ?
        AND v.deleted_at IS NULL
      LIMIT 1
      `,
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                status: false,
                message: "Verification request not found.",
            });
        }

        return res.json({
            status: true,
            verification: rows[0],
        });
    } catch (error) {
        console.error(
            "ADMIN GET VERIFICATION ERROR:",
            error
        );

        return res.status(500).json({
            status: false,
            message: "Failed to fetch verification request.",
        });
    }
};


// ======================================================
// APPROVE VERIFICATION
// ======================================================

export const approveVerification = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const id = Number(req.params.id);

        if (!id) {
            return res.status(400).json({
                status: false,
                message: "Invalid verification id.",
            });
        }

        const [rows] = await connection.query(
            `
      SELECT
        id,
        user_id,
        status
      FROM lawyer_verifications
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                status: false,
                message: "Verification request not found.",
            });
        }

        const verification = rows[0];

        if (verification.status !== "Pending") {
            return res.status(400).json({
                status: false,
                message:
                    "Only pending verification requests can be approved.",
            });
        }

        await connection.beginTransaction();

        await connection.query(
            `
      UPDATE lawyer_verifications
      SET
        status = 'Approved',
        admin_remarks = ?,
        reviewed_at = NOW()
      WHERE id = ?
        AND deleted_at IS NULL
      `,
            [
                clean(req.body?.remarks) || null,
                id,
            ]
        );

        await connection.query(
            `
      UPDATE users
      SET status = 'Verified'
      WHERE id = ?
        AND deleted_at IS NULL
      `,
            [verification.user_id]
        );

        await connection.commit();

        return res.json({
            status: true,
            message: "Verification request approved successfully.",
        });
    } catch (error) {
        await connection.rollback();

        console.error(
            "ADMIN APPROVE VERIFICATION ERROR:",
            error
        );

        return res.status(500).json({
            status: false,
            message: "Failed to approve verification request.",
        });
    } finally {
        connection.release();
    }
};


// ======================================================
// REJECT VERIFICATION
// ======================================================

export const rejectVerification = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const id = Number(req.params.id);
        const remarks = clean(req.body?.remarks);

        if (!id) {
            return res.status(400).json({
                status: false,
                message: "Invalid verification id.",
            });
        }

        if (!remarks) {
            return res.status(400).json({
                status: false,
                message: "Rejection remarks are required.",
            });
        }

        const [rows] = await connection.query(
            `
      SELECT
        id,
        user_id,
        status
      FROM lawyer_verifications
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                status: false,
                message: "Verification request not found.",
            });
        }

        const verification = rows[0];

        if (verification.status !== "Pending") {
            return res.status(400).json({
                status: false,
                message:
                    "Only pending verification requests can be rejected.",
            });
        }

        await connection.beginTransaction();

        await connection.query(
            `
      UPDATE lawyer_verifications
      SET
        status = 'Rejected',
        admin_remarks = ?,
        reviewed_at = NOW()
      WHERE id = ?
        AND deleted_at IS NULL
      `,
            [
                remarks,
                id,
            ]
        );

        /*
          Existing users.status values are:
          Pending / Verified / Suspended
    
          On rejection we keep the member as Pending,
          because the lawyer has not been verified.
        */

        await connection.query(
            `
      UPDATE users
      SET status = 'Pending'
      WHERE id = ?
        AND deleted_at IS NULL
        AND status <> 'Suspended'
      `,
            [verification.user_id]
        );

        await connection.commit();

        return res.json({
            status: true,
            message: "Verification request rejected successfully.",
        });
    } catch (error) {
        await connection.rollback();

        console.error(
            "ADMIN REJECT VERIFICATION ERROR:",
            error
        );

        return res.status(500).json({
            status: false,
            message: "Failed to reject verification request.",
        });
    } finally {
        connection.release();
    }
};