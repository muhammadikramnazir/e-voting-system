import express from "express";
import { jwtMiddleware } from "../middleware/jwtMiddleware.js";
import upload from "../middleware/multer.js";
import { getProfile, updateProfile, updatePassword, getNotices, createSupportRequest } from "../controller/usercontroller.js";
import { getElections, getElectionById, getElectionCandidates, castVote, getResults } from "../controller/electioncontroller.js";

const router = express.Router();
router.use(jwtMiddleware);
router.get("/profile", getProfile);
router.put("/profile", upload.single("profilePhoto"), updateProfile);
router.put("/profile/password", updatePassword);
router.get("/notices", getNotices);
router.post("/support", createSupportRequest);
router.get("/elections", getElections);
router.get("/elections/:id", getElectionById);
router.get("/elections/:id/candidates", getElectionCandidates);
router.post("/votes", castVote);
router.get("/results", getResults);
export default router;
