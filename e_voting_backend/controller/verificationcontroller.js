import db from "../db/database.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const verificationUploadPath = path.join(
    __dirname,
    "../uploads/verification"
);

const deleteFile = async (filename) => {
    if (!filename) {
        return;
    }

    try {
        await fs.unlink(
            path.join(
                verificationUploadPath,
                filename
            )
        );
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error(
                "VERIFICATION FILE DELETE ERROR:",
                error
            );
        }
    }
};

const getUserId = (req) => {
    return req.user?.id;
};

export const submitVerification = async (
    req,
    res
) => {
    const userId = getUserId(req);

    if (!userId) {
        return res.status(401).json({
            status: false,
            message: "Authentication required.",
        });
    }

    const uploadedFiles = req.files || {};

    const getFileName = (fieldName) => {
        const files = uploadedFiles[fieldName];

        if (!files || !files.length) {
            return null;
        }

        return files[0].filename;
    };

    const cnicFront = getFileName("cnicFront");
    const cnicBack = getFileName("cnicBack");
    const lawyerLicense = getFileName("license");
    const barCard = getFileName("barCard");
    const additionalDocument =
        getFileName("additionalDocument");

    try {
        const {
            fullName,
            phoneNumber,
            cnicNumber,
            barRegistrationNo,
            licenseNumber,
            barAssociation,
            practiceArea,
            yearsOfPractice,
            chamberAddress,
        } = req.body;

        if (
            !fullName?.trim() ||
            !phoneNumber?.trim() ||
            !cnicNumber?.trim() ||
            !barRegistrationNo?.trim() ||
            !licenseNumber?.trim() ||
            !barAssociation?.trim()
        ) {
            await Promise.all(
                Object.values(uploadedFiles)
                    .flat()
                    .map((file) =>
                        deleteFile(file.filename)
                    )
            );

            return res.status(400).json({
                status: false,
                message:
                    "Please complete all required verification information.",
            });
        }

        if (
            !cnicFront ||
            !cnicBack ||
            !lawyerLicense ||
            !barCard
        ) {
            await Promise.all(
                Object.values(uploadedFiles)
                    .flat()
                    .map((file) =>
                        deleteFile(file.filename)
                    )
            );

            return res.status(400).json({
                status: false,
                message:
                    "CNIC front, CNIC back, lawyer license and bar card are required.",
            });
        }

        /*
         * IMPORTANT:
         * Email is NOT accepted from req.body.
         * It is taken directly from the logged-in user.
         */

        const [users] = await db.query(
            `
            SELECT
                id,
                full_name,
                email,
                phone_number,
                status
            FROM users
            WHERE id = ?
              AND deleted_at IS NULL
            LIMIT 1
            `,
            [userId]
        );

        if (!users.length) {
            await Promise.all(
                Object.values(uploadedFiles)
                    .flat()
                    .map((file) =>
                        deleteFile(file.filename)
                    )
            );

            return res.status(404).json({
                status: false,
                message: "User account not found.",
            });
        }

        const user = users[0];

        if (user.status === "Suspended") {
            await Promise.all(
                Object.values(uploadedFiles)
                    .flat()
                    .map((file) =>
                        deleteFile(file.filename)
                    )
            );

            return res.status(403).json({
                status: false,
                message:
                    "Suspended users cannot submit verification.",
            });
        }

        const [existing] = await db.query(
            `
            SELECT id, status
            FROM lawyer_verifications
            WHERE user_id = ?
              AND deleted_at IS NULL
            ORDER BY id DESC
            LIMIT 1
            `,
            [userId]
        );

        if (
            existing.length &&
            existing[0].status === "Pending"
        ) {
            await Promise.all(
                Object.values(uploadedFiles)
                    .flat()
                    .map((file) =>
                        deleteFile(file.filename)
                    )
            );

            return res.status(409).json({
                status: false,
                message:
                    "You already have a verification request under review.",
            });
        }

        if (
            existing.length &&
            existing[0].status === "Approved"
        ) {
            await Promise.all(
                Object.values(uploadedFiles)
                    .flat()
                    .map((file) =>
                        deleteFile(file.filename)
                    )
            );

            return res.status(409).json({
                status: false,
                message:
                    "Your account is already verified.",
            });
        }

        const connection =
            await db.getConnection();

        try {
            await connection.beginTransaction();

            /*
             * If an older rejected verification exists,
             * keep it as history and create a new request.
             */

            const [result] =
                await connection.query(
                    `
                    INSERT INTO lawyer_verifications (
                        user_id,
                        full_name,
                        email,
                        phone_number,
                        cnic_number,
                        bar_registration_no,
                        license_number,
                        bar_association,
                        practice_area,
                        years_of_practice,
                        chamber_address,
                        cnic_front,
                        cnic_back,
                        lawyer_license,
                        bar_card,
                        additional_document,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
                    `,
                    [
                        userId,
                        fullName.trim(),
                        user.email,
                        phoneNumber.trim(),
                        cnicNumber.trim(),
                        barRegistrationNo.trim(),
                        licenseNumber.trim(),
                        barAssociation.trim(),
                        practiceArea?.trim() || null,
                        yearsOfPractice
                            ? Number(yearsOfPractice)
                            : null,
                        chamberAddress?.trim() || null,
                        cnicFront,
                        cnicBack,
                        lawyerLicense,
                        barCard,
                        additionalDocument,
                    ]
                );

            await connection.commit();

            return res.status(201).json({
                status: true,
                message:
                    "Verification request submitted successfully.",
                verificationId:
                    result.insertId,
                verification: {
                    id: result.insertId,
                    status: "Pending",
                    email: user.email,
                },
            });
        } catch (error) {
            await connection.rollback();

            await Promise.all(
                Object.values(uploadedFiles)
                    .flat()
                    .map((file) =>
                        deleteFile(file.filename)
                    )
            );

            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(
            "SUBMIT VERIFICATION ERROR:",
            error
        );

        return res.status(500).json({
            status: false,
            message:
                "Failed to submit verification request.",
        });
    }
};


export const getMyVerification =
    async (req, res) => {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                status: false,
                message:
                    "Authentication required.",
            });
        }

        try {
            const [rows] = await db.query(
                `
                SELECT
                    id,
                    user_id,
                    full_name,
                    email,
                    phone_number,
                    cnic_number,
                    bar_registration_no,
                    license_number,
                    bar_association,
                    practice_area,
                    years_of_practice,
                    chamber_address,
                    status,
                    admin_remarks,
                    submitted_at,
                    reviewed_at,
                    cnic_front,
                    cnic_back,
                    lawyer_license,
                    bar_card,
                    additional_document
                FROM lawyer_verifications
                WHERE user_id = ?
                  AND deleted_at IS NULL
                ORDER BY id DESC
                LIMIT 1
                `,
                [userId]
            );

            if (!rows.length) {
                return res.status(200).json({
                    status: true,
                    exists: false,
                    verification: null,
                });
            }

            const verification = rows[0];

            return res.status(200).json({
                status: true,
                exists: true,
                verification,
            });
        } catch (error) {
            console.error(
                "GET MY VERIFICATION ERROR:",
                error
            );

            return res.status(500).json({
                status: false,
                message:
                    "Failed to load verification status.",
            });
        }
    };