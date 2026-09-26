import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { maintenanceMiddleware } from "./middleware/maintenanceMiddleware.js";

import verificationRoutes from "./routes/verificationRoutes.js";

import db from "./db/database.js";

import authRoutes from "./routes/authroutes.js";
import adminRoutes from "./routes/adminroutes.js";
import userRoutes from "./routes/userRoutes.js";


import {
  bootstrapAdmin,
  syncElectionStatuses,
  autoPublishResultsIfEnabled,
} from "./controller/admincontroller.js";

dotenv.config();

const app = express();

// --------------------------------------------------
// Health Check
// Useful for local checks and cloud deployment probes.
// --------------------------------------------------

app.get("/health", (req, res) => {
  return res.json({
    status: true,
    service: "e-voting-backend",
    message: "Backend is healthy.",
  });
});

// --------------------------------------------------
// __dirname setup for ES Modules
// --------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------------
// CORS
// --------------------------------------------------

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);


// --------------------------------------------------
// Maintenance Status
// Public endpoint - Admin Panel is not affected
// --------------------------------------------------

app.get("/api/v1/maintenance-status", async (req, res) => {
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
      return res.json({
        status: true,
        maintenance: false,
      });
    }

    let maintenanceMode = false;

    try {
      maintenanceMode = JSON.parse(rows[0].setting_value);
    } catch {
      maintenanceMode = rows[0].setting_value;
    }

    const enabled =
      maintenanceMode === true ||
      maintenanceMode === 1 ||
      String(maintenanceMode).toLowerCase() === "true" ||
      String(maintenanceMode).toLowerCase() === "1" ||
      String(maintenanceMode).toLowerCase() === "on" ||
      String(maintenanceMode).toLowerCase() === "yes";

    return res.json({
      status: true,
      maintenance: enabled,
    });
  } catch (error) {
    console.error("MAINTENANCE STATUS ERROR:", error);

    return res.status(500).json({
      status: false,
      maintenance: false,
      message: "Unable to check maintenance status.",
    });
  }
});
// --------------------------------------------------
// Body Parsers
// --------------------------------------------------

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------
// Static Uploaded Files
// --------------------------------------------------

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// --------------------------------------------------
// API Routes
// --------------------------------------------------

// Member authentication
app.use(
  "/api/v1/user",
  maintenanceMiddleware,
  authRoutes
);

// Admin APIs
app.use("/api/v1/admin", adminRoutes);

// Member protected APIs
app.use(
  "/api/v1",
  maintenanceMiddleware,
  userRoutes
);

// Verification APIs
app.use(
  "/api/v1/verification",
  maintenanceMiddleware,
  verificationRoutes
);

// --------------------------------------------------
// Root Route
// --------------------------------------------------

app.get("/", (req, res) => {
  return res.json({
    status: true,
    message: "E-Voting Backend Server is Working !!",
  });
});

// --------------------------------------------------
// 404 Handler
// IMPORTANT: Keep this AFTER all API routes
// --------------------------------------------------

app.use((req, res) => {
  return res.status(404).json({
    status: false,
    message: "API endpoint not found.",
  });
});

// --------------------------------------------------
// Global Error Handler
// --------------------------------------------------

app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err);

  return res.status(500).json({
    status: false,
    message: "Internal server error.",
  });
});

// --------------------------------------------------
// Start Server
// --------------------------------------------------

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await db.query("SELECT 1");

    await bootstrapAdmin();

    /*
     * Sync election statuses immediately
     * when server starts.
     */
    await syncElectionStatuses();

    /*
     * Check auto-publish immediately when server starts.
     */
    await autoPublishResultsIfEnabled();

    /*
     * Keep election status and results synchronized.
     *
     * Every 30 seconds:
     *
     * Upcoming + start time reached
     *        -> Active
     *
     * Active + end time reached
     *        -> Completed
     *
     * Completed + autoPublish enabled
     *        -> Results Published
     */
    setInterval(async () => {
      await syncElectionStatuses();
      await autoPublishResultsIfEnabled();
    }, 30 * 1000);

    app.listen(PORT, () =>
      console.log(`SERVER IS WORKING !! PORT ${PORT}`)
    );
  } catch (error) {
    console.error(
      "SERVER STARTUP ERROR:",
      error.message
    );

    process.exit(1);
  }
};
startServer();