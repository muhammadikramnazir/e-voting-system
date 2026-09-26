import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { resetPassword } from "../../apis/authapi";
import "../forgot_password/Forgotpassword.css";

function ResetPassword() {
    const navigate = useNavigate();

    const [email] = useState(
        () => sessionStorage.getItem("resetEmail") || ""
    );
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const savedEmail = sessionStorage.getItem("resetEmail");
        const otpVerified = sessionStorage.getItem("otpVerified");

        if (!savedEmail || otpVerified !== "true") {
            navigate("/forgot-password", {
                replace: true,
            });
            return;
        }

    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!newPassword || !confirmPassword) {
            setError("Please enter both password fields.");
            return;
        }

        if (newPassword.length < 8) {
            setError(
                "Password must be at least 8 characters long."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const data = await resetPassword(
                email,
                newPassword,
                confirmPassword
            );

            // Clear password reset session data
            sessionStorage.removeItem("resetEmail");
            sessionStorage.removeItem("otpVerified");

            // Go back to login
            navigate("/login", {
                replace: true,
                state: {
                    message:
                        data.message ||
                        "Password reset successfully. Please login.",
                },
            });

        } catch (error) {
            setError(
                error.message ||
                "Unable to reset password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            className="forgot-page"
            quote={
                <>
                    “Your Account
                    <br />
                    Your Stronger Voice”
                </>
            }
        >
            <div className="auth-card fp-card">

                <div className="fp-icon">
                    <i className="bi bi-shield-lock-fill" />
                </div>

                <div className="fp-heading">
                    <span>SECURE ACCOUNT</span>
                    <h2>Create New Password</h2>
                </div>

                <p>
                    Enter your new password below.
                    <br />
                    Your password will be updated securely.
                </p>


                {/* ERROR */}

                {error && (
                    <div
                        style={{
                            color: "#dc3545",
                            backgroundColor: "#fff1f1",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            marginBottom: "15px",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>
                )}


                <form onSubmit={handleSubmit}>

                    {/* NEW PASSWORD */}

                    <div className="auth-input-icon">

                        <i className="bi bi-lock" />

                        <input
                            className="auth-input"
                            type={
                                showNewPassword
                                    ? "text"
                                    : "password"
                            }
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(e.target.value)
                            }
                            placeholder="New Password"
                            autoComplete="new-password"
                            required
                            disabled={loading}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowNewPassword(
                                    !showNewPassword
                                )
                            }
                            style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                padding: "0 10px",
                            }}
                        >
                            <i
                                className={
                                    showNewPassword
                                        ? "bi bi-eye-slash"
                                        : "bi bi-eye"
                                }
                            />
                        </button>

                    </div>


                    {/* CONFIRM PASSWORD */}

                    <div className="auth-input-icon">

                        <i className="bi bi-lock-fill" />

                        <input
                            className="auth-input"
                            type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                            }
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Confirm New Password"
                            autoComplete="new-password"
                            required
                            disabled={loading}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword(
                                    !showConfirmPassword
                                )
                            }
                            style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                padding: "0 10px",
                            }}
                        >
                            <i
                                className={
                                    showConfirmPassword
                                        ? "bi bi-eye-slash"
                                        : "bi bi-eye"
                                }
                            />
                        </button>

                    </div>


                    {/* SUBMIT */}

                    <button
                        type="submit"
                        className="auth-btn fp-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Updating Password..."
                            : "Update Password"}
                    </button>

                </form>


                <Link
                    to="/login"
                    className="auth-link fp-back"
                >
                    Back to Login
                </Link>

            </div>
        </AuthLayout>
    );
}

export default ResetPassword;