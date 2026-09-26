import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/dashboardLayout/DashboardLayout";
import { updatePassword } from "../../apis/authapi";
import "./Settings.css";


function Settings() {
    const [email, setEmail] = useState(true);
    const [updates, setUpdates] = useState(true);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const topRef = useRef(null);


    /* =====================================================
       SCROLL TO TOP
    ===================================================== */

    const scrollToTop = () => {
        if (topRef.current) {
            topRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };


    /* =====================================================
       AUTO SCROLL FOR SUCCESS / ERROR
    ===================================================== */

    useEffect(() => {
        if (error || saved) {
            scrollToTop();
        }
    }, [error, saved]);


    /* =====================================================
       CHANGE PASSWORD
    ===================================================== */

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        setError("");
        setSaved(false);


        /* ---------------------------------------------
           BASIC VALIDATION
        --------------------------------------------- */

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            setError(
                "Please fill in all password fields."
            );
            return;
        }


        if (newPassword !== confirmPassword) {
            setError(
                "New password and confirm password do not match."
            );
            return;
        }


        if (newPassword.length < 8) {
            setError(
                "New password must be at least 8 characters long."
            );
            return;
        }


        /* ---------------------------------------------
           TOKEN
        --------------------------------------------- */

        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");


        if (!token) {
            setError(
                "Authentication required. Please login again."
            );
            return;
        }


        try {
            setLoading(true);


            const data = await updatePassword(
                token,
                currentPassword,
                newPassword,
                confirmPassword
            );


            if (!data?.status) {
                setError(
                    data?.message ||
                    "Unable to update your password."
                );
                return;
            }


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            setSaved(true);

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");


        } catch (err) {
            console.error(
                "PASSWORD UPDATE ERROR:",
                err
            );

            setError(
                "Unable to connect with the server. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <DashboardLayout>

            <div
                ref={topRef}
                className="settings-page"
            >


                {/* =====================================================
                    PAGE HEADER
                ===================================================== */}

                <div className="settings-header">

                    <div>

                        <span className="settings-eyebrow">
                            ACCOUNT & SECURITY
                        </span>

                        <h1 className="dba-page-title">
                            Settings
                        </h1>

                        <p className="dba-page-sub">
                            Manage your account, password and notification preferences.
                        </p>

                    </div>


                    <div className="settings-header-icon">
                        <i className="bi bi-gear-fill"></i>
                    </div>

                </div>


                {/* =====================================================
                    MAIN SETTINGS GRID
                ===================================================== */}

                <div className="settings-layout">


                    {/* =================================================
                        LEFT COLUMN
                    ================================================= */}

                    <div className="settings-left">


                        {/* =================================================
                            CHANGE PASSWORD
                        ================================================= */}

                        <section className="settings-password-card">

                            <div className="settings-card-heading">

                                <div className="settings-card-icon password-icon">
                                    <i className="bi bi-shield-lock-fill"></i>
                                </div>

                                <div>

                                    <h2>
                                        Change Password
                                    </h2>

                                    <p>
                                        Keep your account secure with a strong password.
                                    </p>

                                </div>

                            </div>


                            <form onSubmit={handlePasswordUpdate}>


                                {/* CURRENT PASSWORD */}

                                <div className="settings-field">

                                    <label htmlFor="currentPassword">
                                        Current Password
                                    </label>

                                    <div className="settings-input-wrap">

                                        <i className="bi bi-lock"></i>

                                        <input
                                            id="currentPassword"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) =>
                                                setCurrentPassword(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter your current password"
                                            disabled={loading}
                                        />

                                    </div>

                                </div>


                                {/* NEW PASSWORD */}

                                <div className="settings-field">

                                    <label htmlFor="newPassword">
                                        New Password
                                    </label>

                                    <div className="settings-input-wrap">

                                        <i className="bi bi-key"></i>

                                        <input
                                            id="newPassword"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) =>
                                                setNewPassword(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter a new password"
                                            disabled={loading}
                                        />

                                    </div>

                                </div>


                                {/* CONFIRM PASSWORD */}

                                <div className="settings-field">

                                    <label htmlFor="confirmPassword">
                                        Confirm New Password
                                    </label>

                                    <div className="settings-input-wrap">

                                        <i className="bi bi-check2-circle"></i>

                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Confirm your new password"
                                            disabled={loading}
                                        />

                                    </div>

                                </div>


                                {/* ERROR */}

                                {error && (

                                    <div className="settings-message error">

                                        <i className="bi bi-exclamation-circle-fill"></i>

                                        <span>
                                            {error}
                                        </span>

                                    </div>

                                )}


                                {/* SUCCESS */}

                                {saved && (

                                    <div className="settings-message success">

                                        <i className="bi bi-check-circle-fill"></i>

                                        <div>

                                            <strong>
                                                Password Updated
                                            </strong>

                                            <span>
                                                Your password has been updated successfully.
                                            </span>

                                        </div>

                                    </div>

                                )}


                                {/* FOOTER */}

                                <div className="settings-password-footer">

                                    <div className="password-tip">

                                        <i className="bi bi-info-circle"></i>

                                        <span>
                                            Use at least 8 characters with a mix of letters
                                            and numbers.
                                        </span>

                                    </div>


                                    <button
                                        className="settings-update-btn"
                                        type="submit"
                                        disabled={loading}
                                    >

                                        {loading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                ></span>

                                                Updating...

                                                <i className="bi bi-hourglass-split"></i>
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-shield-check"></i>

                                                Update Password

                                                <i className="bi bi-arrow-right"></i>
                                            </>
                                        )}

                                    </button>

                                </div>

                            </form>

                        </section>


                        {/* =================================================
                            ACCOUNT NOTIFICATIONS
                        ================================================= */}

                        <section className="settings-account-card">

                            <div className="settings-card-heading">

                                <div className="settings-card-icon notification-icon">
                                    <i className="bi bi-bell-fill"></i>
                                </div>

                                <div>

                                    <h2>
                                        Account Preferences
                                    </h2>

                                    <p>
                                        Choose which notifications you would like to receive.
                                    </p>

                                </div>

                            </div>


                            <div className="settings-options">


                                {/* EMAIL */}

                                <div className="settings-option">

                                    <div className="settings-option-info">

                                        <div className="settings-option-small-icon">
                                            <i className="bi bi-envelope-fill"></i>
                                        </div>

                                        <div>

                                            <strong>
                                                Email Notifications
                                            </strong>

                                            <small>
                                                Receive important account notifications.
                                            </small>

                                        </div>

                                    </div>


                                    <button
                                        type="button"
                                        aria-label="Toggle email notifications"
                                        className={`settings-switch ${email ? "on" : ""
                                            }`}
                                        onClick={() =>
                                            setEmail(!email)
                                        }
                                    >
                                        <span></span>
                                    </button>

                                </div>


                                {/* ELECTION UPDATES */}

                                <div className="settings-option">

                                    <div className="settings-option-info">

                                        <div className="settings-option-small-icon gold">
                                            <i className="bi bi-calendar-check-fill"></i>
                                        </div>

                                        <div>

                                            <strong>
                                                Election Updates
                                            </strong>

                                            <small>
                                                Get updates about elections and voting.
                                            </small>

                                        </div>

                                    </div>


                                    <button
                                        type="button"
                                        aria-label="Toggle election updates"
                                        className={`settings-switch ${updates ? "on" : ""
                                            }`}
                                        onClick={() =>
                                            setUpdates(!updates)
                                        }
                                    >
                                        <span></span>
                                    </button>

                                </div>


                            </div>

                        </section>

                    </div>


                    {/* =================================================
                        RIGHT COLUMN
                    ================================================= */}

                    <aside className="settings-right">


                        {/* SECURITY CARD */}

                        <div className="settings-security-card">

                            <div className="security-top">

                                <div className="security-icon">
                                    <i className="bi bi-shield-check"></i>
                                </div>

                                <span className="security-status">
                                    SECURE
                                </span>

                            </div>


                            <h3>
                                Your Account Security
                            </h3>

                            <p>
                                Your account security is important to us.
                                Keep your login information private and
                                update your password regularly.
                            </p>


                            <div className="security-list">

                                <div>
                                    <i className="bi bi-check-circle-fill"></i>
                                    <span>Password protection enabled</span>
                                </div>

                                <div>
                                    <i className="bi bi-check-circle-fill"></i>
                                    <span>Secure member access</span>
                                </div>

                                <div>
                                    <i className="bi bi-check-circle-fill"></i>
                                    <span>Private account information</span>
                                </div>

                            </div>

                        </div>


                        {/* PRIVACY CARD */}

                        <div className="settings-privacy-card">

                            <div className="privacy-icon">
                                <i className="bi bi-person-lock"></i>
                            </div>

                            <h3>
                                Your Privacy Matters
                            </h3>

                            <p>
                                Your membership information is handled
                                responsibly and securely.
                            </p>

                            <div className="privacy-line">
                                <span></span>
                                <small>
                                    Protected Member Account
                                </small>
                            </div>

                        </div>

                    </aside>

                </div>


                {/* =====================================================
                    BOTTOM INFORMATION BANNER
                ===================================================== */}

                <section className="settings-bottom-banner">

                    <div className="settings-banner-overlay"></div>

                    <div className="settings-banner-content">

                        <div className="settings-banner-text">

                            <span className="settings-banner-mark">
                                “
                            </span>

                            <div>

                                <h2>
                                    Secure Your Account.
                                    <br />
                                    Strengthen Your Community.
                                </h2>

                                <p>
                                    A secure account helps create a trusted,
                                    transparent and stronger Bar Association.
                                </p>

                            </div>

                        </div>


                        <div className="settings-banner-badge">

                            <i className="bi bi-shield-fill-check"></i>

                            <div>

                                <strong>
                                    Safe & Secure
                                </strong>

                                <small>
                                    Member Protection
                                </small>

                            </div>

                        </div>

                    </div>

                </section>


            </div>

        </DashboardLayout>
    );
}

export default Settings;