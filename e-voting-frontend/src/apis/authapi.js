// ======================================================
// API CONFIGURATION
// ======================================================

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";

// Backend origin is used for uploaded images/documents.
const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

export { API_URL, API_ORIGIN };


// ======================================================
// COMMON RESPONSE HANDLER
// ======================================================

const handleResponse = async (response) => {
    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok || data?.status === false) {
        throw new Error(
            data?.message ||
            `Request failed with status ${response.status}`
        );
    }

    return data;
};


// ======================================================
// TOKEN
// ======================================================

const getToken = () => {
    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token")
    );
};


// ======================================================
// REGISTER USER
// ======================================================

export const registerUser = async (userData) => {
    const response = await fetch(
        `${API_URL}/user/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        }
    );

    return handleResponse(response);
};


// ======================================================
// VERIFY REGISTRATION OTP
// ======================================================

export const verifyRegistrationOtp = async (email, otp) => {
    const response = await fetch(
        `${API_URL}/user/verify-registration-otp`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, otp }),
        }
    );

    return handleResponse(response);
};


// ======================================================
// LOGIN USER
// Supports both:
// loginUser({ email, password })
// loginUser(email, password)
// ======================================================

export const loginUser = async (emailOrData, passwordArg) => {
    const payload =
        typeof emailOrData === "object" && emailOrData !== null
            ? emailOrData
            : {
                  email: emailOrData,
                  password: passwordArg,
              };

    const response = await fetch(
        `${API_URL}/user/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }
    );

    return handleResponse(response);
};


// ======================================================
// GET CURRENT USER PROFILE
// ======================================================

export const getProfile = async (token = getToken()) => {
    if (!token) {
        throw new Error("Authentication token not found.");
    }

    const response = await fetch(
        `${API_URL}/profile`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return handleResponse(response);
};


// ======================================================
// UPDATE PROFILE
// Supports current frontend call:
// updateProfile(token, FormData)
// ======================================================

export const updateProfile = async (
    tokenOrFormData,
    formDataOrToken
) => {
    let token;
    let formData;

    if (typeof tokenOrFormData === "string") {
        token = tokenOrFormData;
        formData = formDataOrToken;
    } else {
        formData = tokenOrFormData;
        token = formDataOrToken || getToken();
    }

    if (!token) {
        throw new Error("Authentication token not found.");
    }

    if (!(formData instanceof FormData)) {
        throw new Error("Profile data must be sent as FormData.");
    }

    const response = await fetch(
        `${API_URL}/profile`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        }
    );

    return handleResponse(response);
};


// ======================================================
// UPDATE PASSWORD
// Supports both:
// updatePassword(token, current, new, confirm)
// updatePassword({ currentPassword, newPassword, confirmPassword }, token)
// ======================================================

export const updatePassword = async (
    firstArg,
    secondArg,
    thirdArg,
    fourthArg
) => {
    let token;
    let passwordData;

    if (typeof firstArg === "string") {
        token = firstArg;
        passwordData = {
            currentPassword: secondArg,
            newPassword: thirdArg,
            confirmPassword: fourthArg,
        };
    } else {
        passwordData = firstArg || {};
        token = secondArg || getToken();
    }

    if (!token) {
        throw new Error("Authentication token not found.");
    }

    const response = await fetch(
        `${API_URL}/profile/password`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(passwordData),
        }
    );

    return handleResponse(response);
};


// ======================================================
// FORGOT PASSWORD
// ======================================================

export const forgotPassword = async (email) => {
    const response = await fetch(
        `${API_URL}/user/forgot-password`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        }
    );

    return handleResponse(response);
};


// ======================================================
// VERIFY PASSWORD RESET OTP
// ======================================================

export const verifyOtp = async (email, otp) => {
    const response = await fetch(
        `${API_URL}/user/verify-otp`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, otp }),
        }
    );

    return handleResponse(response);
};


// ======================================================
// RESET PASSWORD
// ======================================================

export const resetPassword = async (
    email,
    newPassword,
    confirmPassword
) => {
    const response = await fetch(
        `${API_URL}/user/reset-password`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                newPassword,
                confirmPassword,
            }),
        }
    );

    return handleResponse(response);
};


// ======================================================
// GET ELECTIONS
// ======================================================

export const getElections = async (token = getToken()) => {
    if (!token) {
        throw new Error("Authentication token not found.");
    }

    const response = await fetch(
        `${API_URL}/elections`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return handleResponse(response);
};


// ======================================================
// GET ELECTION BY ID
// Supports current call: getElectionById(token, electionId)
// and fallback: getElectionById(electionId, token)
// ======================================================

export const getElectionById = async (
    firstArg,
    secondArg
) => {
    let token;
    let electionId;

    if (secondArg === undefined) {
        electionId = firstArg;
        token = getToken();
    } else if (
        typeof firstArg === "string" &&
        typeof secondArg === "number"
    ) {
        token = firstArg;
        electionId = secondArg;
    } else if (
        typeof firstArg === "string" &&
        /^\d+$/.test(String(secondArg))
    ) {
        token = firstArg;
        electionId = secondArg;
    } else {
        electionId = firstArg;
        token = secondArg || getToken();
    }

    if (!token) {
        throw new Error("Authentication token not found.");
    }

    if (!electionId) {
        throw new Error("Election ID is required.");
    }

    const response = await fetch(
        `${API_URL}/elections/${electionId}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return handleResponse(response);
};


// ======================================================
// GET ELECTION CANDIDATES
// ======================================================

export const getElectionCandidates = async (
    token = getToken(),
    electionId
) => {
    if (!token) {
        throw new Error("Authentication token not found.");
    }

    if (!electionId) {
        throw new Error("Election ID is required.");
    }

    const response = await fetch(
        `${API_URL}/elections/${electionId}/candidates`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return handleResponse(response);
};


// ======================================================
// GET CANDIDATES
// ======================================================

export const getCandidates = async (
    electionId,
    token = getToken()
) => {
    if (!token) {
        throw new Error("Authentication token not found.");
    }

    const response = await fetch(
        `${API_URL}/elections/${electionId}/candidates`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return handleResponse(response);
};


// ======================================================
// GET NOTICES
// ======================================================

export const getNotices = async (token = getToken()) => {
    if (!token) {
        throw new Error("Authentication token not found.");
    }

    const response = await fetch(
        `${API_URL}/notices`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return handleResponse(response);
};


// ======================================================
// CAST VOTE
// Supports current call:
// castVote(token, electionId, positionId, candidateId)
// and object form:
// castVote({ electionId, positionId, candidateId }, token)
// ======================================================

export const castVote = async (
    firstArg,
    secondArg,
    thirdArg,
    fourthArg
) => {
    let token;
    let voteData;

    if (
        typeof firstArg === "string" &&
        secondArg !== undefined
    ) {
        token = firstArg;
        voteData = {
            electionId: secondArg,
            positionId: thirdArg,
            candidateId: fourthArg,
        };
    } else {
        voteData = firstArg || {};
        token = secondArg || getToken();
    }

    if (!token) {
        throw new Error("Authentication token not found.");
    }

    const response = await fetch(
        `${API_URL}/votes`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(voteData),
        }
    );

    return handleResponse(response);
};


// ======================================================
// GET RESULTS
// ======================================================

export const getResults = async (token = getToken()) => {
    if (!token) {
        throw new Error("Authentication token not found.");
    }

    const response = await fetch(
        `${API_URL}/results`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return handleResponse(response);
};


// ======================================================
// SUPPORT REQUEST
// Supports current call:
// createSupportRequest(token, subject, message)
// submitSupport({ subject, message }, token)
// ======================================================

export const submitSupport = async (
    firstArg,
    secondArg,
    thirdArg
) => {
    let token;
    let supportData;

    if (typeof firstArg === "string") {
        token = firstArg;
        supportData = {
            subject: secondArg,
            message: thirdArg,
        };
    } else {
        supportData = firstArg || {};
        token = secondArg || getToken();
    }

    if (!token) {
        throw new Error("Authentication token not found.");
    }

    const response = await fetch(
        `${API_URL}/support`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(supportData),
        }
    );

    return handleResponse(response);
};

// Backward-compatible name already used by Support.jsx.
export const createSupportRequest = async (
    token,
    subject,
    message
) => submitSupport(token, subject, message);


// ======================================================
// GET SUPPORT REQUESTS
// ======================================================

export const getSupportRequests = async (
    token = getToken()
) => {
    if (!token) {
        throw new Error("Authentication token not found.");
    }

    const response = await fetch(
        `${API_URL}/support`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return handleResponse(response);
};
