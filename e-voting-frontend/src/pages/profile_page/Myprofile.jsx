import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboardLayout/DashboardLayout";
import {
    API_URL,
    getProfile,
    updateProfile,
    updatePassword,
} from "../../apis/authapi";
import "./Myprofile.css";

function MyProfile() {

    const [editing, setEditing] = useState(false);
    const [passwordMode, setPasswordMode] = useState(false);

    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        practiceArea: "",
        yearsOfPractice: "",
        chamberAddress: "",
        additionalInfo: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // ======================================================
    // BACKEND URL
    // ======================================================

    const BACKEND_URL = API_URL.replace("/api/v1", "");

    // ======================================================
    // GET TOKEN
    // ======================================================

    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            sessionStorage.getItem("token")
        );
    };

    // ======================================================
    // LOAD PROFILE
    // ======================================================

    useEffect(() => {

        const fetchProfile = async () => {

            try {

                setLoading(true);
                setError("");

                const token = getToken();

                if (!token) {
                    setError("Please login first.");
                    setLoading(false);
                    return;
                }

                const data = await getProfile(token);

                setUser(data.user);

                setFormData({
                    fullName: data.user.full_name || "",
                    phoneNumber: data.user.phone_number || "",
                    practiceArea: data.user.practice_area || "",
                    yearsOfPractice:
                        data.user.years_of_practice ?? "",
                    chamberAddress:
                        data.user.chamber_address || "",
                    additionalInfo:
                        data.user.additional_info || "",
                });

            } catch (error) {

                console.error("PROFILE ERROR:", error);

                setError(
                    error.message ||
                    "Unable to load profile."
                );

            } finally {

                setLoading(false);

            }
        };

        fetchProfile();

    }, []);

    // ======================================================
    // HANDLE PROFILE INPUT
    // ======================================================

    const handleChange = (event) => {

        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ======================================================
    // HANDLE PASSWORD INPUT
    // ======================================================

    const handlePasswordChange = (event) => {

        const { name, value } = event.target;

        setPasswordData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ======================================================
    // PROFILE PHOTO
    // ======================================================

    const handlePhotoChange = (event) => {

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setSelectedPhoto(file);
    };

    // ======================================================
    // START EDITING
    // ======================================================

    const startEditing = () => {

        setError("");
        setSuccess("");
        setPasswordMode(false);

        setFormData({
            fullName: user.full_name || "",
            phoneNumber: user.phone_number || "",
            practiceArea: user.practice_area || "",
            yearsOfPractice:
                user.years_of_practice ?? "",
            chamberAddress:
                user.chamber_address || "",
            additionalInfo:
                user.additional_info || "",
        });

        setEditing(true);
    };

    // ======================================================
    // CANCEL EDITING
    // ======================================================

    const cancelEditing = () => {

        setEditing(false);
        setSelectedPhoto(null);
        setError("");

        setFormData({
            fullName: user.full_name || "",
            phoneNumber: user.phone_number || "",
            practiceArea: user.practice_area || "",
            yearsOfPractice:
                user.years_of_practice ?? "",
            chamberAddress:
                user.chamber_address || "",
            additionalInfo:
                user.additional_info || "",
        });
    };

    // ======================================================
    // UPDATE PROFILE
    // ======================================================

    const handleSaveProfile = async () => {

        try {

            setSaving(true);
            setError("");
            setSuccess("");

            const token = getToken();

            if (!token) {
                setError("Please login first.");
                return;
            }

            const multipartData = new FormData();

            multipartData.append(
                "fullName",
                formData.fullName
            );

            multipartData.append(
                "phoneNumber",
                formData.phoneNumber
            );

            multipartData.append(
                "practiceArea",
                formData.practiceArea
            );

            multipartData.append(
                "yearsOfPractice",
                formData.yearsOfPractice
            );

            multipartData.append(
                "chamberAddress",
                formData.chamberAddress
            );

            multipartData.append(
                "additionalInfo",
                formData.additionalInfo
            );

            if (selectedPhoto) {
                multipartData.append(
                    "profilePhoto",
                    selectedPhoto
                );
            }

            const data = await updateProfile(
                token,
                multipartData
            );

            setUser(data.user);

            window.dispatchEvent(
                new CustomEvent("profileUpdated", {
                    detail: {
                        user: data.user,
                    },
                })
            );

            setFormData({
                fullName: data.user.full_name || "",
                phoneNumber: data.user.phone_number || "",
                practiceArea: data.user.practice_area || "",
                yearsOfPractice:
                    data.user.years_of_practice ?? "",
                chamberAddress:
                    data.user.chamber_address || "",
                additionalInfo:
                    data.user.additional_info || "",
            });

            setSelectedPhoto(null);
            setEditing(false);

            setSuccess(
                "Profile updated successfully."
            );

        } catch (error) {

            console.error(
                "PROFILE UPDATE ERROR:",
                error
            );

            setError(
                error.message ||
                "Unable to update profile."
            );

        } finally {

            setSaving(false);

        }
    };

    // ======================================================
    // UPDATE PASSWORD
    // ======================================================

    const handlePasswordUpdate = async () => {

        try {

            setSaving(true);
            setError("");
            setSuccess("");

            const token = getToken();

            if (!token) {
                setError("Please login first.");
                return;
            }

            if (
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword
            ) {
                setError(
                    "Please fill all password fields."
                );
                return;
            }

            const data = await updatePassword(
                token,
                passwordData.currentPassword,
                passwordData.newPassword,
                passwordData.confirmPassword
            );

            setSuccess(
                data.message ||
                "Password updated successfully."
            );

            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            setPasswordMode(false);

        } catch (error) {

            console.error(
                "PASSWORD UPDATE ERROR:",
                error
            );

            setError(
                error.message ||
                "Unable to update password."
            );

        } finally {

            setSaving(false);

        }
    };

    // ======================================================
    // DATE FORMAT
    // ======================================================

    const formatDate = (dateValue) => {

        if (!dateValue) {
            return "N/A";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "N/A";
        }

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // ======================================================
    // STATUS
    // ======================================================

    const getStatusText = () => {

        if (user?.status === "Verified") {
            return "Active Member";
        }

        if (user?.status === "Suspended") {
            return "Suspended";
        }

        if (user?.status === "Pending") {
            return "Pending Verification";
        }

        return user?.status || "Unknown";
    };

    const isVerified = user?.status === "Verified";

    // ======================================================
    // PROFILE IMAGE
    // ======================================================

    const profileImage = user?.profile_photo
        ? `${BACKEND_URL}/uploads/${user.profile_photo}`
        : null;
    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {

        return (
            <DashboardLayout>

                <div className="mp-page">

                    <div className="mp-page-bg"></div>

                    <div className="mp-content">

                        <div className="mp-card dba-card">

                            <h2>
                                Loading Profile...
                            </h2>

                        </div>

                    </div>

                </div>

            </DashboardLayout>
        );

    }

    // ======================================================
    // ERROR
    // ======================================================

    if (error && !user) {

        return (
            <DashboardLayout>

                <div className="mp-page">

                    <div className="mp-page-bg"></div>

                    <div className="mp-content">

                        <div className="mp-card dba-card">

                            <h2>
                                Profile Error
                            </h2>

                            <p>
                                {error}
                            </p>

                        </div>

                    </div>

                </div>

            </DashboardLayout>
        );

    }

    // ======================================================
    // NO USER
    // ======================================================

    if (!user) {

        return (
            <DashboardLayout>

                <div className="mp-page">

                    <div className="mp-page-bg"></div>

                    <div className="mp-content">

                        <div className="mp-card dba-card">

                            <h2>
                                No Profile Data Found
                            </h2>

                        </div>

                    </div>

                </div>

            </DashboardLayout>
        );

    }

    // ======================================================
    // MAIN UI
    // ======================================================

    return (

        <DashboardLayout>

            <div className="mp-page">

                <div className="mp-page-bg"></div>

                <div className="mp-content">

                    {/* ================= PAGE HEADER ================= */}

                    <div className="mp-head">

                        <div>

                            <div className="mp-title-wrap">

                                <span className="mp-title-icon">

                                    <i className="bi bi-person-badge"></i>

                                </span>

                                <div>

                                    <h1 className="dba-page-title">
                                        My Profile
                                    </h1>

                                    <p className="dba-page-sub">
                                        View and manage your membership information.
                                    </p>

                                </div>

                            </div>

                        </div>

                        <div>

                            {!editing ? (

                                <button
                                    className="dba-btn-outline mp-edit-btn"
                                    onClick={startEditing}
                                >

                                    <i className="bi bi-pencil-square"></i>

                                    Edit Profile

                                </button>

                            ) : (

                                <div className="d-flex gap-2">

                                    <button
                                        className="dba-btn-outline mp-edit-btn"
                                        onClick={cancelEditing}
                                        disabled={saving}
                                    >

                                        <i className="bi bi-x-lg"></i>

                                        Cancel

                                    </button>

                                    <button
                                        className="dba-btn-outline mp-edit-btn"
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                    >

                                        <i className="bi bi-check-lg"></i>

                                        {saving
                                            ? "Saving..."
                                            : "Save Changes"}

                                    </button>

                                </div>

                            )}

                        </div>

                    </div>


                    {/* ================= MESSAGES ================= */}

                    {success && (

                        <div className="alert alert-success mt-3">
                            {success}
                        </div>

                    )}

                    {error && user && (

                        <div className="alert alert-danger mt-3">
                            {error}
                        </div>

                    )}


                    {/* ================= PROFILE GRID ================= */}

                    <div className="mp-grid">

                        {/* ================= MAIN PROFILE CARD ================= */}

                        <section className="mp-card dba-card">

                            {/* Profile Header */}

                            <div className="mp-profile-header">

                                <div className="mp-avatar-wrap">

                                    {profileImage ? (
                                        <img
                                            src={profileImage}
                                            alt={user.email}
                                            className="mp-avatar"
                                            onError={(event) => {
                                                event.currentTarget.style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        <div className="mp-avatar mp-avatar-placeholder">
                                            <i className="bi bi-person-fill"></i>
                                        </div>
                                    )}

                                    <span className="mp-online">

                                        <i className="bi bi-check"></i>

                                    </span>

                                    {editing && (

                                        <label
                                            style={{
                                                position: "absolute",
                                                bottom: "-8px",
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                cursor: "pointer",
                                                background: "#fff",
                                                borderRadius: "20px",
                                                padding: "4px 10px",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                                fontSize: "12px",
                                                whiteSpace: "nowrap",
                                            }}
                                        >

                                            <i className="bi bi-camera me-1"></i>
                                            Change

                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png"
                                                onChange={handlePhotoChange}
                                                hidden
                                            />

                                        </label>

                                    )}

                                </div>


                                <div className="mp-profile-info">

                                    <div className="mp-name-row">

                                        <h2>
                                            {user.full_name ||
                                                user.fullName ||
                                                "User"}
                                        </h2>

                                        {isVerified && (

                                            <span className="mp-verified">

                                                <i className="bi bi-patch-check-fill"></i>

                                                Verified Member

                                            </span>

                                        )}

                                    </div>


                                    <p className="mp-role">
                                        Lawyer
                                    </p>


                                    <div className="mp-member-meta">

                                        <span>

                                            <i className="bi bi-person-badge"></i>

                                            {user.bar_registration_no ||
                                                "N/A"}

                                        </span>

                                        <span>

                                            <i className="bi bi-bank"></i>

                                            {user.bar_association ||
                                                "District Bar Association"}

                                        </span>

                                    </div>

                                </div>

                            </div>


                            {/* Information Heading */}

                            <div className="mp-info-heading">

                                <div>

                                    <h3>
                                        Personal Information
                                    </h3>

                                    <p>
                                        Your registered membership details
                                    </p>

                                </div>

                                <span className="mp-secure">

                                    <i className="bi bi-shield-check"></i>

                                    Secure

                                </span>

                            </div>


                            {/* Details */}

                            <div className="mp-details">

                                {/* Email */}

                                <div className="mp-row">

                                    <div className="mp-field-label">

                                        <span className="mp-field-icon">

                                            <i className="bi bi-envelope"></i>

                                        </span>

                                        <span>
                                            Email
                                        </span>

                                    </div>

                                    <strong>
                                        {user.email || "N/A"}
                                    </strong>

                                </div>


                                {/* Phone */}

                                <div className="mp-row">

                                    <div className="mp-field-label">

                                        <span className="mp-field-icon">

                                            <i className="bi bi-telephone"></i>

                                        </span>

                                        <span>
                                            Phone
                                        </span>

                                    </div>

                                    {editing ? (

                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className="form-control"
                                        />

                                    ) : (

                                        <strong>
                                            {user.phone_number || "N/A"}
                                        </strong>

                                    )}

                                </div>


                                {/* CNIC */}

                                <div className="mp-row">

                                    <div className="mp-field-label">

                                        <span className="mp-field-icon">

                                            <i className="bi bi-person-vcard"></i>

                                        </span>

                                        <span>
                                            CNIC
                                        </span>

                                    </div>

                                    <strong>
                                        {user.cnic_number || "N/A"}
                                    </strong>

                                </div>


                                {/* License */}

                                <div className="mp-row">

                                    <div className="mp-field-label">

                                        <span className="mp-field-icon">

                                            <i className="bi bi-card-text"></i>

                                        </span>

                                        <span>
                                            License Number
                                        </span>

                                    </div>

                                    <strong>
                                        {user.license_number || "N/A"}
                                    </strong>

                                </div>


                                {/* Bar Registration */}

                                <div className="mp-row">

                                    <div className="mp-field-label">

                                        <span className="mp-field-icon">

                                            <i className="bi bi-bank"></i>

                                        </span>

                                        <span>
                                            Bar Registration No.
                                        </span>

                                    </div>

                                    <strong>
                                        {user.bar_registration_no || "N/A"}
                                    </strong>

                                </div>


                                {/* Member Since */}

                                <div className="mp-row">

                                    <div className="mp-field-label">

                                        <span className="mp-field-icon">

                                            <i className="bi bi-calendar3"></i>

                                        </span>

                                        <span>
                                            Member Since
                                        </span>

                                    </div>

                                    <strong>
                                        {formatDate(
                                            user.enrollment_date
                                        )}
                                    </strong>

                                </div>


                                {/* Practice Area */}

                                <div className="mp-row">

                                    <div className="mp-field-label">

                                        <span className="mp-field-icon">

                                            <i className="bi bi-briefcase"></i>

                                        </span>

                                        <span>
                                            Practice Area
                                        </span>

                                    </div>

                                    {editing ? (

                                        <input
                                            type="text"
                                            name="practiceArea"
                                            value={formData.practiceArea}
                                            onChange={handleChange}
                                            className="form-control"
                                        />

                                    ) : (

                                        <strong>
                                            {user.practice_area || "N/A"}
                                        </strong>

                                    )}

                                </div>


                                {/* Years of Practice */}

                                <div className="mp-row">

                                    <div className="mp-field-label">

                                        <span className="mp-field-icon">

                                            <i className="bi bi-calendar-check"></i>

                                        </span>

                                        <span>
                                            Years of Practice
                                        </span>

                                    </div>

                                    {editing ? (

                                        <input
                                            type="number"
                                            min="0"
                                            name="yearsOfPractice"
                                            value={formData.yearsOfPractice}
                                            onChange={handleChange}
                                            className="form-control"
                                        />

                                    ) : (

                                        <strong>
                                            {user.years_of_practice ?? "N/A"}
                                        </strong>

                                    )}

                                </div>


                                {/* Chamber Address */}

                                <div className="mp-row">

                                    <div className="mp-field-label">

                                        <span className="mp-field-icon">

                                            <i className="bi bi-geo-alt"></i>

                                        </span>

                                        <span>
                                            Chamber Address
                                        </span>

                                    </div>

                                    {editing ? (

                                        <input
                                            type="text"
                                            name="chamberAddress"
                                            value={formData.chamberAddress}
                                            onChange={handleChange}
                                            className="form-control"
                                        />

                                    ) : (

                                        <strong>
                                            {user.chamber_address || "N/A"}
                                        </strong>

                                    )}

                                </div>


                                {/* Additional Information */}

                                <div className="mp-row">

                                    <div className="mp-field-label">

                                        <span className="mp-field-icon">

                                            <i className="bi bi-info-circle"></i>

                                        </span>

                                        <span>
                                            Additional Info
                                        </span>

                                    </div>

                                    {editing ? (

                                        <textarea
                                            name="additionalInfo"
                                            value={formData.additionalInfo}
                                            onChange={handleChange}
                                            className="form-control"
                                            rows="2"
                                        />

                                    ) : (

                                        <strong>
                                            {user.additional_info || "N/A"}
                                        </strong>

                                    )}

                                </div>

                            </div>

                        </section>


                        {/* ================= SIDE ================= */}

                        <aside className="mp-side">

                            {/* Membership Status */}

                            <div className="mp-status-card">

                                <div className="mp-side-heading">

                                    <div className="mp-side-icon gold">

                                        <i className="bi bi-shield-check"></i>

                                    </div>

                                    <div>

                                        <h3>
                                            Membership Status
                                        </h3>

                                        <span>
                                            Current account status
                                        </span>

                                    </div>

                                </div>


                                <div className="mp-status">

                                    <span className="mp-status-dot"></span>

                                    <strong>
                                        {getStatusText()}
                                    </strong>

                                </div>


                                <p className="mp-status-text">

                                    {isVerified
                                        ? "Your District Bar Association membership is currently active and verified."
                                        : "Your membership status is currently " +
                                        (user.status || "not available") +
                                        "."}

                                </p>

                            </div>


                            {/* Membership Overview */}

                            <div className="mp-overview-card">

                                <h3>
                                    Membership Overview
                                </h3>


                                <div className="mp-overview-item">

                                    <span>

                                        <i className="bi bi-award"></i>

                                        Member Since

                                    </span>

                                    <strong>
                                        {formatDate(
                                            user.enrollment_date
                                        )}
                                    </strong>

                                </div>


                                <div className="mp-overview-item">

                                    <span>

                                        <i className="bi bi-briefcase"></i>

                                        Professional Role

                                    </span>

                                    <strong>
                                        Lawyer
                                    </strong>

                                </div>


                                <div className="mp-overview-item">

                                    <span>

                                        <i className="bi bi-patch-check"></i>

                                        Verification

                                    </span>

                                    <strong className="verified-text">
                                        {isVerified
                                            ? "Verified"
                                            : user.status || "N/A"}
                                    </strong>

                                </div>

                            </div>


                            {/* Quick Actions */}

                            {/* ================= QUICK ACTIONS ================= */}

                            <div className="mp-actions-card">

                                <h3>
                                    Quick Actions
                                </h3>


                                {/* UPDATE PROFILE */}

                                <button
                                    className="mp-action"
                                    type="button"
                                    onClick={() => {
                                        setPasswordMode(false);
                                        setError("");
                                        setSuccess("");
                                        startEditing();
                                    }}
                                >

                                    <span>
                                        <i className="bi bi-pencil-square"></i>
                                    </span>

                                    Update Profile

                                    <i className="bi bi-chevron-right"></i>

                                </button>


                                {/* CHANGE PASSWORD */}

                                <button
                                    className="mp-action"
                                    type="button"
                                    onClick={() => {
                                        setEditing(false);
                                        setPasswordMode(!passwordMode);
                                        setError("");
                                        setSuccess("");
                                    }}
                                >

                                    <span>
                                        <i className="bi bi-key"></i>
                                    </span>

                                    Change Password

                                    <i className="bi bi-chevron-right"></i>

                                </button>


                                {/* NOTIFICATION SETTINGS */}

                                <button
                                    className="mp-action"
                                    type="button"
                                    onClick={() => {
                                        window.location.href = "/settings";
                                    }}
                                >

                                    <span>
                                        <i className="bi bi-bell"></i>
                                    </span>

                                    Notification Settings

                                    <i className="bi bi-chevron-right"></i>

                                </button>


                                {/* PASSWORD FORM */}

                                {passwordMode && (

                                    <div className="mt-3">

                                        <div className="mb-2">

                                            <label className="form-label">
                                                Current Password
                                            </label>

                                            <input
                                                type="password"
                                                name="currentPassword"
                                                value={
                                                    passwordData.currentPassword
                                                }
                                                onChange={
                                                    handlePasswordChange
                                                }
                                                className="form-control"
                                            />

                                        </div>


                                        <div className="mb-2">

                                            <label className="form-label">
                                                New Password
                                            </label>

                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={
                                                    passwordData.newPassword
                                                }
                                                onChange={
                                                    handlePasswordChange
                                                }
                                                className="form-control"
                                            />

                                        </div>


                                        <div className="mb-2">

                                            <label className="form-label">
                                                Confirm Password
                                            </label>

                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={
                                                    passwordData.confirmPassword
                                                }
                                                onChange={
                                                    handlePasswordChange
                                                }
                                                className="form-control"
                                            />

                                        </div>


                                        <button
                                            type="button"
                                            className="btn btn-dark w-100 mt-2"
                                            onClick={handlePasswordUpdate}
                                            disabled={saving}
                                        >

                                            {saving
                                                ? "Updating..."
                                                : "Update Password"}

                                        </button>

                                    </div>

                                )}

                            </div>


                            {/* ================= ACCOUNT VERIFICATION ================= */}

                            <div className="mp-verification-card">

                                <div className="mp-verification-top">

                                    <div className="mp-verification-icon">

                                        <i className="bi bi-shield-check"></i>

                                    </div>


                                    <span className="mp-verification-status">

                                        {isVerified
                                            ? "VERIFIED"
                                            : "PENDING"}

                                    </span>

                                </div>


                                <div className="mp-verification-content">

                                    <h3>
                                        {isVerified
                                            ? "Account Verified"
                                            : "Verify Your Account"}
                                    </h3>

                                    <p>

                                        {isVerified
                                            ? "Your professional account has been verified."
                                            : "Complete your professional verification to secure your membership."}

                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="mp-verification-btn"
                                    onClick={() => {
                                        window.location.href = "/verification";
                                    }}
                                >

                                    <span>

                                        <i className="bi bi-arrow-right-circle"></i>

                                        {isVerified
                                            ? "View Verification"
                                            : "Start Verification"}

                                    </span>

                                    <i className="bi bi-chevron-right"></i>

                                </button>

                            </div>


                        </aside>

                    </div>


                    {/* ================= PROFESSIONAL BANNER ================= */}

                    <section className="mp-banner">

                        <div className="mp-banner-overlay"></div>

                        <div className="mp-banner-content">

                            <div>

                                <span className="mp-banner-label">
                                    DISTRICT BAR ASSOCIATION
                                </span>

                                <h2>

                                    “Your Identity,
                                    <br />
                                    Your Voice.”

                                </h2>

                                <p>

                                    Empowering legal professionals through
                                    transparent and trusted digital elections.

                                </p>

                            </div>


                            <div className="mp-banner-icon">

                                <i className="bi bi-bank2"></i>

                            </div>

                        </div>

                    </section>

                </div>

            </div>

        </DashboardLayout>

    );
}

export default MyProfile;