import express from "express";
import db from "../db/database.js";
import { jwtMiddleware } from "../middleware/jwtMiddleware.js";

const router = express.Router();


// ===============================
// GET USER PROFILE
// ===============================
router.get("/profile", jwtMiddleware, (req, res) => {

    const userId = req.user.id;

    const sql = `
        SELECT
            id,
            full_name,
            email,
            bar_registration_no,
            license_number,
            cnic_number,
            phone_number
        FROM users
        WHERE id = ?
        AND deleted_at IS NULL
        LIMIT 1
    `;

    db.query(sql, [userId], (error, results) => {

        if (error) {
            console.log("PROFILE FETCH ERROR !!", error);

            return res.status(500).json({
                status: false,
                message: "Failed to fetch profile !!"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                status: false,
                message: "User not found !!"
            });
        }

        const user = results[0];

        return res.status(200).json({
            status: true,
            message: "Profile fetched successfully !!",
            user: user
        });
    });
});


export default router;