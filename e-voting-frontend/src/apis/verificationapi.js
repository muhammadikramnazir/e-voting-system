import { API_URL } from "./authapi";

// ======================================================
// GET MY VERIFICATION
// ======================================================

export const getMyVerification = async (token) => {
    const response = await fetch(
        `${API_URL}/verification/me`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok || data.status === false) {
        throw new Error(
            data.message ||
            "Unable to fetch verification status."
        );
    }

    return data;
};

// ======================================================
// SUBMIT VERIFICATION
// ======================================================

export const submitVerification = async (
    token,
    formData,
    files
) => {
    const verificationData = new FormData();

    // ==================================================
    // PERSONAL INFORMATION
    // ==================================================

    verificationData.append(
        "fullName",
        formData.fullName
    );

    verificationData.append(
        "phoneNumber",
        formData.phoneNumber
    );

    verificationData.append(
        "cnicNumber",
        formData.cnicNumber
    );

    // ==================================================
    // PROFESSIONAL DETAILS
    // ==================================================

    verificationData.append(
        "barRegistrationNo",
        formData.barRegistrationNo
    );

    verificationData.append(
        "licenseNumber",
        formData.licenseNumber
    );

    verificationData.append(
        "barAssociation",
        formData.barAssociation
    );

    verificationData.append(
        "practiceArea",
        formData.practiceArea || ""
    );

    verificationData.append(
        "yearsOfPractice",
        formData.yearsOfPractice || ""
    );

    verificationData.append(
        "chamberAddress",
        formData.chamberAddress || ""
    );

    // ==================================================
    // REQUIRED DOCUMENTS
    // ==================================================

    if (files.cnicFront) {
        verificationData.append(
            "cnicFront",
            files.cnicFront
        );
    }

    if (files.cnicBack) {
        verificationData.append(
            "cnicBack",
            files.cnicBack
        );
    }

    if (files.license) {
        verificationData.append(
            "license",
            files.license
        );
    }

    if (files.barCard) {
        verificationData.append(
            "barCard",
            files.barCard
        );
    }

    // ==================================================
    // OPTIONAL DOCUMENT
    // ==================================================

    if (files.additionalDocument) {
        verificationData.append(
            "additionalDocument",
            files.additionalDocument
        );
    }

    // ==================================================
    // API REQUEST
    // ==================================================

    const response = await fetch(
        `${API_URL}/verification/submit`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: verificationData,
        }
    );

    const data = await response.json();

    if (!response.ok || data.status === false) {
        throw new Error(
            data.message ||
            "Unable to submit verification."
        );
    }

    return data;
};