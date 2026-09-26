import db from "../db/database.js";

const isEnabled = (value) => {
    if (value === true || value === 1) return true;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        return (
            normalized === "true" ||
            normalized === "1" ||
            normalized === "on" ||
            normalized === "yes"
        );
    }

    return false;
};

export const maintenanceMiddleware = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            `
      SELECT setting_value
      FROM system_settings
      WHERE setting_key = 'maintenanceMode'
      LIMIT 1
      `
        );

        if (!rows.length) {
            return next();
        }

        let maintenanceMode = false;

        try {
            maintenanceMode = JSON.parse(rows[0].setting_value);
        } catch {
            maintenanceMode = rows[0].setting_value;
        }

        if (isEnabled(maintenanceMode)) {
            return res.status(503).json({
                status: false,
                maintenance: true,
                message:
                    "The E-Voting System is currently under maintenance. Please try again later.",
            });
        }

        return next();
    } catch (error) {
        console.error("MAINTENANCE CHECK ERROR:", error);

        // Agar settings database read na ho sake,
        // system ko unnecessarily block nahi karna.
        return next();
    }
};