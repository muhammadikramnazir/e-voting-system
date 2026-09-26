import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AdminLogin.css";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";

function AdminLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [rememberMe, setRememberMe] =
        useState(false);

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    // =====================================================
    // FORGOT PASSWORD
    // =====================================================

    const [showForgot, setShowForgot] =
        useState(false);

    const [forgotEmail, setForgotEmail] =
        useState("");

    const [otp, setOtp] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [forgotStep, setForgotStep] =
        useState("email");

    const [forgotLoading, setForgotLoading] =
        useState(false);

    const [forgotMessage, setForgotMessage] =
        useState("");

    const [forgotError, setForgotError] =
        useState("");


    // =====================================================
    // LOGIN
    // =====================================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        if (!password.trim()) {
            setError("Please enter your password.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/admin/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    "Invalid admin credentials."
                );
            }

            /*
             * 2FA ENABLED
             * Move the administrator to a dedicated OTP screen.
             * No final JWT is stored until the OTP is verified.
             */
            if (data.requiresTwoFactor) {
                localStorage.removeItem("adminToken");

                sessionStorage.setItem(
                    "admin2FAEmail",
                    email.trim().toLowerCase()
                );
                sessionStorage.setItem(
                    "admin2FAPending",
                    JSON.stringify(data.admin)
                );
                sessionStorage.setItem(
                    "admin2FARememberMe",
                    rememberMe ? "true" : "false"
                );
                sessionStorage.removeItem("admin2FAOtpSentAt");

                navigate("/admin/two-factor", {
                    replace: true,
                });

                return;
            }

            /*
             * 2FA DISABLED
             * Normal login.
             */
            if (!data.token) {
                throw new Error(
                    "Login token was not received."
                );
            }

            localStorage.setItem(
                "adminToken",
                data.token
            );

            localStorage.setItem(
                "admin",
                JSON.stringify(data.admin)
            );

            if (rememberMe) {
                localStorage.setItem(
                    "adminRememberMe",
                    "true"
                );
            } else {
                localStorage.removeItem(
                    "adminRememberMe"
                );
            }

            navigate(
                "/admin/dashboard",
                {
                    replace: true,
                }
            );
        } catch (err) {
            console.error(
                "ADMIN LOGIN ERROR:",
                err
            );

            setError(
                err.message ||
                "Login failed."
            );
        } finally {
            setLoading(false);
        }
    };


    // =====================================================
    // OPEN FORGOT PASSWORD
    // =====================================================

    const openForgotPassword = () => {
        setForgotEmail(
            email.trim()
        );

        setOtp("");
        setNewPassword("");
        setConfirmPassword("");

        setForgotStep("email");

        setForgotMessage("");
        setForgotError("");

        setShowForgot(true);
        setError("");
    };


    // =====================================================
    // CLOSE FORGOT PASSWORD
    // =====================================================

    const closeForgotPassword = () => {
        if (forgotLoading) {
            return;
        }

        setShowForgot(false);

        setForgotStep("email");

        setForgotMessage("");
        setForgotError("");

        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
    };


    // =====================================================
    // SEND OTP
    // =====================================================

    const handleSendOtp = async (e) => {
        e.preventDefault();

        setForgotMessage("");
        setForgotError("");

        if (!forgotEmail.trim()) {
            setForgotError(
                "Please enter your admin email address."
            );
            return;
        }

        try {
            setForgotLoading(true);

            const response =
                await fetch(
                    `${API_URL}/admin/forgot-password`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            email:
                                forgotEmail
                                    .trim()
                                    .toLowerCase(),
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
                    "Unable to send OTP."
                );
            }

            setForgotMessage(
                "If an active administrator account exists for this email, a password reset OTP has been sent."
            );

            setForgotStep("reset");
        } catch (err) {
            console.error(
                "SEND ADMIN RESET OTP ERROR:",
                err
            );

            setForgotError(
                err.message ||
                "Unable to send OTP."
            );
        } finally {
            setForgotLoading(false);
        }
    };


    // =====================================================
    // RESET PASSWORD
    // =====================================================

    const handleResetPassword =
        async (e) => {
            e.preventDefault();

            setForgotMessage("");
            setForgotError("");

            if (!otp.trim()) {
                setForgotError(
                    "Please enter the OTP."
                );
                return;
            }

            if (!newPassword) {
                setForgotError(
                    "Please enter the new password."
                );
                return;
            }

            if (
                newPassword.length < 8
            ) {
                setForgotError(
                    "New password must contain at least 8 characters."
                );
                return;
            }

            if (
                newPassword !==
                confirmPassword
            ) {
                setForgotError(
                    "New password and confirmation do not match."
                );
                return;
            }

            try {
                setForgotLoading(true);

                const response =
                    await fetch(
                        `${API_URL}/admin/reset-password`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                email:
                                    forgotEmail
                                        .trim()
                                        .toLowerCase(),

                                otp:
                                    otp.trim(),

                                newPassword,

                                confirmPassword,
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
                        "Password reset failed."
                    );
                }

                setForgotMessage(
                    "Password reset successfully. You can now login with your new password."
                );

                setOtp("");
                setNewPassword("");
                setConfirmPassword("");

                setTimeout(() => {
                    setShowForgot(false);
                    setForgotStep("email");
                    setForgotMessage("");
                }, 2200);
            } catch (err) {
                console.error(
                    "ADMIN RESET PASSWORD ERROR:",
                    err
                );

                setForgotError(
                    err.message ||
                    "Password reset failed."
                );
            } finally {
                setForgotLoading(false);
            }
        };


    return (
        <div className="admin-login-page">

            {/* =================================================
                LEFT / BRANDING SECTION
            ================================================= */}

            <div className="admin-login-brand">

                <div className="login-brand-content">

                    <div className="login-brand-logo">

                        <div className="login-brand-icon">
                            <i className="bi bi-check2-circle"></i>
                        </div>

                        <div>
                            <h1>
                                E-Voting
                            </h1>

                            <span>
                                Administration System
                            </span>
                        </div>

                    </div>


                    <div className="login-brand-message">

                        <div className="brand-badge">
                            <i className="bi bi-shield-check"></i>
                            Secure Administration
                        </div>

                        <h2>
                            Manage your
                            <br />
                            <span>
                                e-voting system
                            </span>
                        </h2>

                        <p>
                            Manage lawyers, elections,
                            candidates, votes, results
                            and system activities from
                            one secure administration panel.
                        </p>

                    </div>


                    <div className="login-features">

                        <div className="login-feature">

                            <div className="feature-icon">
                                <i className="bi bi-people"></i>
                            </div>

                            <div>
                                <strong>
                                    Lawyer Management
                                </strong>

                                <span>
                                    Manage registered members
                                </span>
                            </div>

                        </div>


                        <div className="login-feature">

                            <div className="feature-icon">
                                <i className="bi bi-check2-square"></i>
                            </div>

                            <div>
                                <strong>
                                    Election Management
                                </strong>

                                <span>
                                    Control elections and positions
                                </span>
                            </div>

                        </div>


                        <div className="login-feature">

                            <div className="feature-icon">
                                <i className="bi bi-bar-chart"></i>
                            </div>

                            <div>
                                <strong>
                                    Results & Reports
                                </strong>

                                <span>
                                    Monitor voting results
                                </span>
                            </div>

                        </div>

                    </div>

                </div>


                <div className="login-brand-footer">
                    © 2026 E-Voting System. All rights reserved.
                </div>

            </div>


            {/* =================================================
                LOGIN SECTION
            ================================================= */}

            <div className="admin-login-section">

                <div className="admin-login-card">

                    <div className="mobile-login-logo">

                        <div className="mobile-login-logo-icon">
                            <i className="bi bi-check2-circle"></i>
                        </div>

                        <div>
                            <strong>
                                E-Voting
                            </strong>

                            <span>
                                Admin Panel
                            </span>
                        </div>

                    </div>


                    <div className="admin-login-heading">

                        <span className="login-welcome">
                            Welcome back
                        </span>

                        <h2>
                            Sign in to your account
                        </h2>

                        <p>
                            Enter your administrator
                            credentials to continue.
                        </p>

                    </div>


                    {error && (
                        <div className="login-error">

                            <i className="bi bi-exclamation-circle"></i>

                            <span>
                                {error}
                            </span>

                        </div>
                    )}

                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >

                        {/* Email */}

                        <div className="login-form-group">

                            <label htmlFor="admin-email">
                                Email Address
                            </label>

                            <div className="login-input-wrapper">

                                <i className="bi bi-envelope"></i>

                                <input
                                    id="admin-email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    autoComplete="email"
                                    disabled={
                                        loading
                                    }
                                />

                            </div>

                        </div>


                        {/* Password */}

                        <div className="login-form-group">

                            <div className="password-label-row">

                                <label htmlFor="admin-password">
                                    Password
                                </label>

                                <button
                                    type="button"
                                    className="forgot-password"
                                    onClick={
                                        openForgotPassword
                                    }
                                    disabled={
                                        loading
                                    }
                                >
                                    Forgot Password?
                                </button>

                            </div>


                            <div className="login-input-wrapper">

                                <i className="bi bi-lock"></i>

                                <input
                                    id="admin-password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                    autoComplete="current-password"
                                    disabled={
                                        loading
                                    }
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(
                                            (previous) =>
                                                !previous
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    disabled={
                                        loading
                                    }
                                >
                                    <i
                                        className={
                                            showPassword
                                                ? "bi bi-eye-slash"
                                                : "bi bi-eye"
                                        }
                                    ></i>
                                </button>

                            </div>

                        </div>


                        <div className="login-options">

                            <label className="remember-option">

                                <input
                                    type="checkbox"
                                    checked={
                                        rememberMe
                                    }
                                    onChange={(e) =>
                                        setRememberMe(
                                            e.target.checked
                                        )
                                    }
                                    disabled={
                                        loading
                                    }
                                />

                                <span>
                                    Remember me
                                </span>

                            </label>

                        </div>


                        <button
                            type="submit"
                            className="admin-login-btn"
                            disabled={
                                loading
                            }
                        >

                            {loading ? (
                                <>
                                    <span className="login-spinner"></span>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-in-right"></i>
                                    Sign In
                                </>
                            )}

                        </button>

                    </form>


                    <div className="login-security">

                        <i className="bi bi-shield-lock"></i>

                        <div>

                            <strong>
                                Secure administrator access
                            </strong>

                            <span>
                                Your account information is protected.
                            </span>

                        </div>

                    </div>


                    <div className="mobile-login-footer">
                        © 2026 E-Voting System
                    </div>

                </div>

            </div>


            {/* =================================================
                FORGOT PASSWORD MODAL
            ================================================= */}

            {showForgot && (
                <div
                    onClick={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeForgotPassword();
                        }
                    }}
                    style={{
                        position:
                            "fixed",
                        inset: 0,
                        zIndex: 9999,
                        display: "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "center",
                        padding: "20px",
                        background:
                            "rgba(15, 23, 42, 0.55)",
                        backdropFilter:
                            "blur(5px)",
                    }}
                >

                    <div
                        style={{
                            width: "100%",
                            maxWidth: "430px",
                            background:
                                "#ffffff",
                            borderRadius:
                                "16px",
                            padding:
                                "26px",
                            boxShadow:
                                "0 25px 60px rgba(15,23,42,.25)",
                        }}
                    >

                        {/* Header */}

                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "flex-start",
                                gap: "15px",
                                marginBottom:
                                    "20px",
                            }}
                        >

                            <div>

                                <div
                                    style={{
                                        width:
                                            "42px",
                                        height:
                                            "42px",
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        borderRadius:
                                            "10px",
                                        background:
                                            "#eff6ff",
                                        color:
                                            "#2563eb",
                                        marginBottom:
                                            "12px",
                                        fontSize:
                                            "18px",
                                    }}
                                >
                                    <i className="bi bi-key"></i>
                                </div>

                                <h3
                                    style={{
                                        margin:
                                            0,
                                        color:
                                            "#111827",
                                        fontSize:
                                            "18px",
                                    }}
                                >
                                    {forgotStep ===
                                        "email"
                                        ? "Forgot Password"
                                        : "Reset Password"}
                                </h3>

                                <p
                                    style={{
                                        margin:
                                            "6px 0 0",
                                        color:
                                            "#64748b",
                                        fontSize:
                                            "11px",
                                        lineHeight:
                                            "1.5",
                                    }}
                                >
                                    {forgotStep ===
                                        "email"
                                        ? "Enter your administrator email to receive a reset OTP."
                                        : "Enter the OTP from your email and choose a new password."}
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    closeForgotPassword
                                }
                                disabled={
                                    forgotLoading
                                }
                                style={{
                                    border:
                                        "0",
                                    background:
                                        "transparent",
                                    color:
                                        "#94a3b8",
                                    fontSize:
                                        "20px",
                                    cursor:
                                        "pointer",
                                }}
                            >
                                ×
                            </button>

                        </div>


                        {/* Error */}

                        {forgotError && (
                            <div
                                style={{
                                    marginBottom:
                                        "14px",
                                    padding:
                                        "10px 12px",
                                    borderRadius:
                                        "8px",
                                    background:
                                        "#fef2f2",
                                    color:
                                        "#b91c1c",
                                    fontSize:
                                        "10px",
                                }}
                            >
                                <i
                                    className="bi bi-exclamation-circle"
                                    style={{
                                        marginRight:
                                            "6px",
                                    }}
                                ></i>

                                {forgotError}
                            </div>
                        )}


                        {/* Success */}

                        {forgotMessage && (
                            <div
                                style={{
                                    marginBottom:
                                        "14px",
                                    padding:
                                        "10px 12px",
                                    borderRadius:
                                        "8px",
                                    background:
                                        "#ecfdf5",
                                    color:
                                        "#047857",
                                    fontSize:
                                        "10px",
                                    lineHeight:
                                        "1.5",
                                }}
                            >
                                <i
                                    className="bi bi-check-circle"
                                    style={{
                                        marginRight:
                                            "6px",
                                    }}
                                ></i>

                                {forgotMessage}
                            </div>
                        )}


                        {/* =================================================
                            EMAIL STEP
                        ================================================= */}

                        {forgotStep ===
                            "email" && (

                                <form
                                    onSubmit={
                                        handleSendOtp
                                    }
                                >

                                    <label
                                        style={{
                                            display:
                                                "block",
                                            marginBottom:
                                                "6px",
                                            color:
                                                "#374151",
                                            fontSize:
                                                "10px",
                                            fontWeight:
                                                "600",
                                        }}
                                    >
                                        Administrator Email
                                    </label>

                                    <div
                                        style={{
                                            position:
                                                "relative",
                                            marginBottom:
                                                "15px",
                                        }}
                                    >

                                        <i
                                            className="bi bi-envelope"
                                            style={{
                                                position:
                                                    "absolute",
                                                left:
                                                    "11px",
                                                top:
                                                    "50%",
                                                transform:
                                                    "translateY(-50%)",
                                                color:
                                                    "#94a3b8",
                                            }}
                                        ></i>

                                        <input
                                            type="email"
                                            value={
                                                forgotEmail
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setForgotEmail(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="admin@example.com"
                                            autoComplete="email"
                                            disabled={
                                                forgotLoading
                                            }
                                            style={{
                                                width:
                                                    "100%",
                                                height:
                                                    "40px",
                                                boxSizing:
                                                    "border-box",
                                                padding:
                                                    "0 11px 0 34px",
                                                border:
                                                    "1px solid #dbe2ea",
                                                borderRadius:
                                                    "7px",
                                                outline:
                                                    "none",
                                                fontSize:
                                                    "10px",
                                            }}
                                        />

                                    </div>


                                    <button
                                        type="submit"
                                        disabled={
                                            forgotLoading
                                        }
                                        style={{
                                            width:
                                                "100%",
                                            height:
                                                "40px",
                                            border:
                                                0,
                                            borderRadius:
                                                "8px",
                                            background:
                                                "#2563eb",
                                            color:
                                                "#ffffff",
                                            fontSize:
                                                "10px",
                                            fontWeight:
                                                "600",
                                            cursor:
                                                "pointer",
                                        }}
                                    >

                                        {forgotLoading
                                            ? "Sending OTP..."
                                            : "Send Reset OTP"}

                                    </button>

                                </form>
                            )}


                        {/* =================================================
                            RESET STEP
                        ================================================= */}

                        {forgotStep ===
                            "reset" && (

                                <form
                                    onSubmit={
                                        handleResetPassword
                                    }
                                >

                                    <div
                                        style={{
                                            marginBottom:
                                                "12px",
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "9px",
                                        }}
                                    >
                                        OTP sent for:
                                        <strong
                                            style={{
                                                color:
                                                    "#374151",
                                                marginLeft:
                                                    "4px",
                                            }}
                                        >
                                            {forgotEmail}
                                        </strong>
                                    </div>


                                    <label
                                        style={{
                                            display:
                                                "block",
                                            marginBottom:
                                                "6px",
                                            color:
                                                "#374151",
                                            fontSize:
                                                "10px",
                                            fontWeight:
                                                "600",
                                        }}
                                    >
                                        OTP
                                    </label>

                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) =>
                                            setOtp(
                                                e.target.value.replace(
                                                    /\D/g,
                                                    ""
                                                )
                                            )
                                        }
                                        placeholder="6-digit OTP"
                                        disabled={
                                            forgotLoading
                                        }
                                        style={{
                                            width:
                                                "100%",
                                            height:
                                                "40px",
                                            boxSizing:
                                                "border-box",
                                            padding:
                                                "0 11px",
                                            border:
                                                "1px solid #dbe2ea",
                                            borderRadius:
                                                "7px",
                                            outline:
                                                "none",
                                            fontSize:
                                                "11px",
                                            letterSpacing:
                                                "3px",
                                            marginBottom:
                                                "12px",
                                        }}
                                    />


                                    <label
                                        style={{
                                            display:
                                                "block",
                                            marginBottom:
                                                "6px",
                                            color:
                                                "#374151",
                                            fontSize:
                                                "10px",
                                            fontWeight:
                                                "600",
                                        }}
                                    >
                                        New Password
                                    </label>

                                    <input
                                        type="password"
                                        value={
                                            newPassword
                                        }
                                        onChange={(e) =>
                                            setNewPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Minimum 8 characters"
                                        autoComplete="new-password"
                                        disabled={
                                            forgotLoading
                                        }
                                        style={{
                                            width:
                                                "100%",
                                            height:
                                                "40px",
                                            boxSizing:
                                                "border-box",
                                            padding:
                                                "0 11px",
                                            border:
                                                "1px solid #dbe2ea",
                                            borderRadius:
                                                "7px",
                                            outline:
                                                "none",
                                            fontSize:
                                                "10px",
                                            marginBottom:
                                                "12px",
                                        }}
                                    />


                                    <label
                                        style={{
                                            display:
                                                "block",
                                            marginBottom:
                                                "6px",
                                            color:
                                                "#374151",
                                            fontSize:
                                                "10px",
                                            fontWeight:
                                                "600",
                                        }}
                                    >
                                        Confirm New Password
                                    </label>

                                    <input
                                        type="password"
                                        value={
                                            confirmPassword
                                        }
                                        onChange={(e) =>
                                            setConfirmPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Repeat new password"
                                        autoComplete="new-password"
                                        disabled={
                                            forgotLoading
                                        }
                                        style={{
                                            width:
                                                "100%",
                                            height:
                                                "40px",
                                            boxSizing:
                                                "border-box",
                                            padding:
                                                "0 11px",
                                            border:
                                                "1px solid #dbe2ea",
                                            borderRadius:
                                                "7px",
                                            outline:
                                                "none",
                                            fontSize:
                                                "10px",
                                            marginBottom:
                                                "15px",
                                        }}
                                    />


                                    <button
                                        type="submit"
                                        disabled={
                                            forgotLoading
                                        }
                                        style={{
                                            width:
                                                "100%",
                                            height:
                                                "40px",
                                            border:
                                                0,
                                            borderRadius:
                                                "8px",
                                            background:
                                                "#2563eb",
                                            color:
                                                "#ffffff",
                                            fontSize:
                                                "10px",
                                            fontWeight:
                                                "600",
                                            cursor:
                                                "pointer",
                                        }}
                                    >
                                        {forgotLoading
                                            ? "Resetting Password..."
                                            : "Reset Password"}
                                    </button>


                                    <button
                                        type="button"
                                        disabled={
                                            forgotLoading
                                        }
                                        onClick={() => {
                                            setForgotStep(
                                                "email"
                                            );
                                            setForgotMessage(
                                                ""
                                            );
                                            setForgotError(
                                                ""
                                            );
                                        }}
                                        style={{
                                            width:
                                                "100%",
                                            marginTop:
                                                "9px",
                                            height:
                                                "36px",
                                            border:
                                                "1px solid #dbe2ea",
                                            borderRadius:
                                                "8px",
                                            background:
                                                "#ffffff",
                                            color:
                                                "#64748b",
                                            fontSize:
                                                "9px",
                                            cursor:
                                                "pointer",
                                        }}
                                    >
                                        Request New OTP
                                    </button>

                                </form>
                            )}

                    </div>

                </div>
            )}

        </div>
    );
}

export default AdminLogin;