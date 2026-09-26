import { useEffect, useState } from "react";
import "./AdminProfile.css";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";

function AdminProfile() {
    const defaultAdmin = {
        id: "",
        name: "System Administrator",
        email: "admin@evoting.com",
        role: "Super Administrator",
        phone: "+92 300 0000000",
        department: "Election Administration",
        status: "Active",
    };

    const [admin, setAdmin] = useState(defaultAdmin);
    const [form, setForm] = useState(defaultAdmin);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editing, setEditing] = useState(false);
    const [saved, setSaved] = useState(false);

    const [error, setError] = useState("");

    const [showPasswordForm, setShowPasswordForm] =
        useState(false);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [passwordMessage, setPasswordMessage] =
        useState("");

    const [passwordSaving, setPasswordSaving] =
        useState(false);

    /* =====================================================
       LOAD ADMIN PROFILE FROM DATABASE
    ===================================================== */

    useEffect(() => {
        const loadAdminProfile = async () => {
            const token =
                localStorage.getItem("adminToken");

            if (!token) {
                setLoading(false);
                setError(
                    "Admin authentication token not found."
                );
                return;
            }

            try {
                const response = await fetch(
                    `${API_URL}/admin/profile`,
                    {
                        method: "GET",
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.status
                ) {
                    throw new Error(
                        data.message ||
                        "Failed to load admin profile."
                    );
                }

                const backendAdmin =
                    data.admin || {};

                const loadedAdmin = {
                    id:
                        backendAdmin.id ||
                        "",
                    name:
                        backendAdmin.name ||
                        defaultAdmin.name,
                    email:
                        backendAdmin.email ||
                        defaultAdmin.email,
                    role:
                        backendAdmin.role ||
                        defaultAdmin.role,
                    phone:
                        backendAdmin.phone ||
                        defaultAdmin.phone,
                    department:
                        backendAdmin.department ||
                        defaultAdmin.department,
                    status:
                        backendAdmin.status ||
                        defaultAdmin.status,
                };

                setAdmin(loadedAdmin);
                setForm(loadedAdmin);

                /*
                 * Keep localStorage synchronized
                 * with the real database record.
                 */
                localStorage.setItem(
                    "admin",
                    JSON.stringify(loadedAdmin)
                );
            } catch (err) {
                console.error(
                    "LOAD ADMIN PROFILE ERROR:",
                    err
                );

                /*
                 * If backend request fails, use the
                 * existing localStorage data as fallback.
                 */
                const savedAdmin =
                    localStorage.getItem("admin");

                if (savedAdmin) {
                    try {
                        const parsed =
                            JSON.parse(savedAdmin);

                        const loadedAdmin = {
                            ...defaultAdmin,
                            ...parsed,
                        };

                        setAdmin(
                            loadedAdmin
                        );

                        setForm(
                            loadedAdmin
                        );
                    } catch {
                        setError(
                            err.message ||
                            "Failed to load admin profile."
                        );
                    }
                } else {
                    setError(
                        err.message ||
                        "Failed to load admin profile."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        loadAdminProfile();
    }, []);

    /* =====================================================
       FORM CHANGE
    ===================================================== */

    const handleChange = (
        field,
        value
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setSaved(false);
        setError("");
    };

    /* =====================================================
       SAVE ADMIN PROFILE
    ===================================================== */

    const handleSave = async (e) => {
        e.preventDefault();

        setError("");
        setSaved(false);

        if (!form.name.trim()) {
            setError(
                "Name is required."
            );
            return;
        }

        if (!form.email.trim()) {
            setError(
                "Email address is required."
            );
            return;
        }

        const token =
            localStorage.getItem(
                "adminToken"
            );

        if (!token) {
            setError(
                "Admin authentication token not found."
            );
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(
                `${API_URL}/admin/profile`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        name:
                            form.name.trim(),

                        email:
                            form.email
                                .trim()
                                .toLowerCase(),

                        department:
                            form.department.trim(),
                    }),
                }
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.status
            ) {
                throw new Error(
                    data.message ||
                    "Failed to update admin profile."
                );
            }

            /*
             * Backend returns the updated
             * admin profile.
             */
            const updatedBackendAdmin =
                data.admin || {};

            const updatedAdmin = {
                ...admin,

                id:
                    updatedBackendAdmin.id ||
                    admin.id,

                name:
                    updatedBackendAdmin.name ||
                    form.name,

                email:
                    updatedBackendAdmin.email ||
                    form.email
                        .trim()
                        .toLowerCase(),

                role:
                    updatedBackendAdmin.role ||
                    admin.role,

                department:
                    updatedBackendAdmin.department ||
                    form.department,

                status:
                    updatedBackendAdmin.status ||
                    admin.status,

                phone:
                    admin.phone,
            };

            setAdmin(updatedAdmin);
            setForm(updatedAdmin);

            /*
             * Keep localStorage synchronized.
             */
            localStorage.setItem(
                "admin",
                JSON.stringify(updatedAdmin)
            );

            setEditing(false);
            setSaved(true);

            setTimeout(() => {
                setSaved(false);
            }, 3000);
        } catch (err) {
            console.error(
                "UPDATE ADMIN PROFILE ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to update admin profile."
            );
        } finally {
            setSaving(false);
        }
    };

    /* =====================================================
       CANCEL PROFILE EDIT
    ===================================================== */

    const handleCancel = () => {
        setForm(admin);

        setEditing(false);
        setSaved(false);
        setError("");
    };

    /* =====================================================
       PASSWORD FORM CHANGE
    ===================================================== */

    const handlePasswordChange = (
        field,
        value
    ) => {
        setPasswordForm(
            (current) => ({
                ...current,
                [field]: value,
            })
        );

        setPasswordMessage("");
    };

    /* =====================================================
       UPDATE ADMIN PASSWORD
    ===================================================== */

    const handlePasswordSubmit = async (
        e
    ) => {
        e.preventDefault();

        setPasswordMessage("");

        if (
            !passwordForm.currentPassword ||
            !passwordForm.newPassword ||
            !passwordForm.confirmPassword
        ) {
            setPasswordMessage(
                "Please fill in all password fields."
            );
            return;
        }

        if (
            passwordForm.newPassword.length < 8
        ) {
            setPasswordMessage(
                "New password must contain at least 8 characters."
            );
            return;
        }

        if (
            passwordForm.newPassword !==
            passwordForm.confirmPassword
        ) {
            setPasswordMessage(
                "New password and confirmation do not match."
            );
            return;
        }

        const token =
            localStorage.getItem(
                "adminToken"
            );

        if (!token) {
            setPasswordMessage(
                "Admin authentication token not found."
            );
            return;
        }

        try {
            setPasswordSaving(true);

            const response = await fetch(
                `${API_URL}/admin/password`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        currentPassword:
                            passwordForm.currentPassword,

                        newPassword:
                            passwordForm.newPassword,

                        confirmPassword:
                            passwordForm.confirmPassword,
                    }),
                }
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.status
            ) {
                throw new Error(
                    data.message ||
                    "Failed to update password."
                );
            }

            setPasswordMessage(
                "Password updated successfully."
            );

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            setTimeout(() => {
                setPasswordMessage("");

                setShowPasswordForm(
                    false
                );
            }, 2500);
        } catch (err) {
            console.error(
                "ADMIN PASSWORD UPDATE ERROR:",
                err
            );

            setPasswordMessage(
                err.message ||
                "Failed to update password."
            );
        } finally {
            setPasswordSaving(false);
        }
    };

    /* =====================================================
       INITIALS
    ===================================================== */

    const getInitials = (
        name
    ) => {
        return String(name || "")
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(
                (word) =>
                    word
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="admin-profile-page">

                <div
                    style={{
                        minHeight:
                            "300px",

                        display:
                            "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "center",

                        color:
                            "#64748b",

                        fontSize:
                            "13px",
                    }}
                >
                    <i
                        className="bi bi-arrow-repeat"
                        style={{
                            marginRight:
                                "8px",
                        }}
                    ></i>

                    Loading administrator profile...
                </div>

            </div>
        );
    }

    return (
        <div className="admin-profile-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="admin-profile-header">

                <div>

                    <span className="admin-profile-overline">
                        ADMINISTRATION
                    </span>

                    <h1>
                        Admin Profile
                    </h1>

                    <p>
                        Manage your administrator account information
                        and security settings.
                    </p>

                </div>

                {!editing && (
                    <button
                        type="button"
                        className="profile-edit-btn"
                        onClick={() => {
                            setEditing(true);
                            setError("");
                            setSaved(false);
                        }}
                    >
                        <i className="bi bi-pencil"></i>
                        Edit Profile
                    </button>
                )}

            </div>


            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {error && (
                <div
                    style={{
                        marginBottom:
                            "16px",

                        padding:
                            "11px 14px",

                        borderRadius:
                            "9px",

                        background:
                            "#fef2f2",

                        border:
                            "1px solid #fecaca",

                        color:
                            "#b91c1c",

                        fontSize:
                            "10px",

                        display:
                            "flex",

                        alignItems:
                            "center",

                        gap:
                            "7px",
                    }}
                >
                    <i className="bi bi-exclamation-circle"></i>

                    <span>
                        {error}
                    </span>
                </div>
            )}


            {/* =================================================
                PROFILE OVERVIEW
            ================================================= */}

            <div className="profile-overview-card">

                <div className="profile-avatar-large">
                    {getInitials(
                        admin.name
                    )}
                </div>

                <div className="profile-overview-info">

                    <h2>
                        {admin.name}
                    </h2>

                    <p>
                        {admin.email}
                    </p>

                    <div className="profile-overview-meta">

                        <span className="profile-role-badge">
                            <i className="bi bi-shield-check"></i>

                            {admin.role}
                        </span>

                        <span>
                            <i className="bi bi-building"></i>

                            {admin.department}
                        </span>

                    </div>

                </div>

                <div className="profile-active-badge">

                    <span></span>

                    {admin.status ||
                        "Active"}

                </div>

            </div>


            {/* =================================================
                MAIN GRID
            ================================================= */}

            <div className="admin-profile-grid">

                {/* =================================================
                    PERSONAL INFORMATION
                ================================================= */}

                <div className="profile-card profile-information-card">

                    <div className="profile-card-header">

                        <div className="profile-card-heading">

                            <div className="profile-card-icon blue">
                                <i className="bi bi-person"></i>
                            </div>

                            <div>

                                <h3>
                                    Personal Information
                                </h3>

                                <p>
                                    Your administrator account details
                                </p>

                            </div>

                        </div>

                    </div>


                    <form
                        className="profile-form"
                        onSubmit={
                            handleSave
                        }
                    >

                        <div className="profile-form-grid">

                            {/* FULL NAME */}

                            <div className="profile-form-group">

                                <label>
                                    Full Name
                                </label>

                                <div className="profile-input-wrapper">

                                    <i className="bi bi-person"></i>

                                    <input
                                        type="text"
                                        value={
                                            form.name
                                        }
                                        disabled={
                                            !editing ||
                                            saving
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            handleChange(
                                                "name",
                                                e.target
                                                    .value
                                            )
                                        }
                                    />

                                </div>

                            </div>


                            {/* EMAIL */}

                            <div className="profile-form-group">

                                <label>
                                    Email Address
                                </label>

                                <div className="profile-input-wrapper">

                                    <i className="bi bi-envelope"></i>

                                    <input
                                        type="email"
                                        value={
                                            form.email
                                        }
                                        disabled={
                                            !editing ||
                                            saving
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            handleChange(
                                                "email",
                                                e.target
                                                    .value
                                            )
                                        }
                                    />

                                </div>

                            </div>


                            {/* PHONE */}

                            <div className="profile-form-group">

                                <label>
                                    Phone Number
                                </label>

                                <div className="profile-input-wrapper">

                                    <i className="bi bi-telephone"></i>

                                    <input
                                        type="text"
                                        value={
                                            form.phone
                                        }
                                        disabled
                                    />

                                </div>

                            </div>


                            {/* DEPARTMENT */}

                            <div className="profile-form-group">

                                <label>
                                    Department
                                </label>

                                <div className="profile-input-wrapper">

                                    <i className="bi bi-building"></i>

                                    <input
                                        type="text"
                                        value={
                                            form.department
                                        }
                                        disabled={
                                            !editing ||
                                            saving
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            handleChange(
                                                "department",
                                                e.target
                                                    .value
                                            )
                                        }
                                    />

                                </div>

                            </div>


                            {/* ROLE */}

                            <div className="profile-form-group">

                                <label>
                                    Administrator Role
                                </label>

                                <div className="profile-input-wrapper">

                                    <i className="bi bi-shield-check"></i>

                                    <input
                                        type="text"
                                        value={
                                            admin.role
                                        }
                                        disabled
                                        readOnly
                                    />

                                </div>

                            </div>

                        </div>


                        {/* SAVE / CANCEL */}

                        {editing && (
                            <div className="profile-form-actions">

                                <button
                                    type="button"
                                    className="profile-cancel-btn"
                                    onClick={
                                        handleCancel
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="profile-save-btn"
                                    disabled={
                                        saving
                                    }
                                >

                                    {saving ? (
                                        <>
                                            <span
                                                className="login-spinner"
                                            ></span>

                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg"></i>

                                            Save Changes
                                        </>
                                    )}

                                </button>

                            </div>
                        )}


                        {/* SUCCESS */}

                        {saved && (
                            <div className="profile-save-message">

                                <i className="bi bi-check-circle"></i>

                                Profile updated successfully.

                            </div>
                        )}

                    </form>

                </div>


                {/* =================================================
                    SECURITY CARD
                ================================================= */}

                <div className="profile-card profile-security-card">

                    <div className="profile-card-header">

                        <div className="profile-card-heading">

                            <div className="profile-card-icon purple">

                                <i className="bi bi-shield-lock"></i>

                            </div>

                            <div>

                                <h3>
                                    Account Security
                                </h3>

                                <p>
                                    Protect your administrator account
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* SECURITY STATUS */}

                    <div className="security-status-box">

                        <div className="security-status-icon">

                            <i className="bi bi-shield-check"></i>

                        </div>

                        <div>

                            <strong>
                                Account Protected
                            </strong>

                            <span>
                                Your administrator account is currently
                                active and protected.
                            </span>

                        </div>

                    </div>


                    {/* SECURITY ITEMS */}

                    <div className="security-items">

                        {/* PASSWORD */}

                        <div className="security-item">

                            <div className="security-item-icon">

                                <i className="bi bi-key"></i>

                            </div>

                            <div className="security-item-content">

                                <strong>
                                    Password
                                </strong>

                                <span>
                                    Change your account password
                                </span>

                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowPasswordForm(
                                        (current) =>
                                            !current
                                    );

                                    setPasswordMessage("");
                                }}
                            >
                                {showPasswordForm
                                    ? "Cancel"
                                    : "Change"}
                            </button>

                        </div>


                        {/* 2FA */}

                        <div className="security-item">

                            <div className="security-item-icon">

                                <i className="bi bi-shield-check"></i>

                            </div>

                            <div className="security-item-content">

                                <strong>
                                    Two-Factor Authentication
                                </strong>

                                <span>
                                    Additional security verification
                                </span>

                            </div>

                            <span className="security-disabled">
                                Settings
                            </span>

                        </div>


                        {/* LOGIN ALERTS */}

                        <div className="security-item">

                            <div className="security-item-icon">

                                <i className="bi bi-bell"></i>

                            </div>

                            <div className="security-item-content">

                                <strong>
                                    Login Alerts
                                </strong>

                                <span>
                                    Receive alerts for new logins
                                </span>

                            </div>

                            <span className="security-enabled">
                                Enabled
                            </span>

                        </div>

                    </div>


                    {/* =================================================
                        PASSWORD FORM
                    ================================================= */}

                    {showPasswordForm && (

                        <form
                            className="password-change-form"
                            onSubmit={
                                handlePasswordSubmit
                            }
                        >

                            <div className="password-form-title">

                                <i className="bi bi-key"></i>

                                <span>
                                    Change Password
                                </span>

                            </div>


                            {/* CURRENT PASSWORD */}

                            <div className="password-form-group">

                                <label>
                                    Current Password
                                </label>

                                <input
                                    type="password"
                                    value={
                                        passwordForm.currentPassword
                                    }
                                    disabled={
                                        passwordSaving
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handlePasswordChange(
                                            "currentPassword",
                                            e.target
                                                .value
                                        )
                                    }
                                />

                            </div>


                            {/* NEW PASSWORD */}

                            <div className="password-form-group">

                                <label>
                                    New Password
                                </label>

                                <input
                                    type="password"
                                    value={
                                        passwordForm.newPassword
                                    }
                                    disabled={
                                        passwordSaving
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handlePasswordChange(
                                            "newPassword",
                                            e.target
                                                .value
                                        )
                                    }
                                />

                            </div>


                            {/* CONFIRM PASSWORD */}

                            <div className="password-form-group">

                                <label>
                                    Confirm New Password
                                </label>

                                <input
                                    type="password"
                                    value={
                                        passwordForm.confirmPassword
                                    }
                                    disabled={
                                        passwordSaving
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handlePasswordChange(
                                            "confirmPassword",
                                            e.target
                                                .value
                                        )
                                    }
                                />

                            </div>


                            {/* PASSWORD MESSAGE */}

                            {passwordMessage && (
                                <div
                                    className={`password-message ${passwordMessage.includes(
                                        "successfully"
                                    )
                                            ? "success"
                                            : "error"
                                        }`}
                                >

                                    <i
                                        className={
                                            passwordMessage.includes(
                                                "successfully"
                                            )
                                                ? "bi bi-check-circle"
                                                : "bi bi-exclamation-circle"
                                        }
                                    ></i>

                                    {passwordMessage}

                                </div>
                            )}


                            {/* UPDATE BUTTON */}

                            <button
                                type="submit"
                                className="password-update-btn"
                                disabled={
                                    passwordSaving
                                }
                            >

                                {passwordSaving ? (
                                    <>
                                        <span
                                            className="login-spinner"
                                        ></span>

                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-lg"></i>

                                        Update Password
                                    </>
                                )}

                            </button>

                        </form>

                    )}

                </div>

            </div>


            {/* =================================================
                ADMIN ACCOUNT INFORMATION
            ================================================= */}

            <div className="profile-account-note">

                <div className="profile-account-note-icon">

                    <i className="bi bi-info-circle"></i>

                </div>

                <div>

                    <strong>
                        Administrator Account
                    </strong>

                    <p>
                        This account has administrator-level access
                        to the e-voting management panel. Sensitive
                        account and security changes should be handled
                        carefully.
                    </p>

                </div>

            </div>

        </div>
    );
}

export default AdminProfile;