import express from "express";

import { jwtMiddleware } from "../middleware/jwtMiddleware.js";

import verificationUpload from "../middleware/verificationUpload.js";

import {
    submitVerification,
    getMyVerification,
} from "../controller/verificationcontroller.js";

const router = express.Router();

router.use(jwtMiddleware);

router.get(
    "/me",
    getMyVerification
);

router.post(
    "/submit",
    verificationUpload.fields([
        {
            name: "cnicFront",
            maxCount: 1,
        },
        {
            name: "cnicBack",
            maxCount: 1,
        },
        {
            name: "license",
            maxCount: 1,
        },
        {
            name: "barCard",
            maxCount: 1,
        },
        {
            name: "additionalDocument",
            maxCount: 1,
        },
    ]),
    submitVerification
);

export default router;