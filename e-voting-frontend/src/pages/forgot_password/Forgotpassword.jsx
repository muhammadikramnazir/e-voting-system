import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { forgotPassword } from "../../apis/authapi";
import "./Forgotpassword.css";

function ForgotPassword() {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        const email = value.trim();

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        try {
            setLoading(true);

            const data = await forgotPassword(email);

            // Save email for OTP verification
            sessionStorage.setItem("resetEmail", email);

            // Clear previous OTP verification state
            sessionStorage.removeItem("otpVerified");

            navigate("/email-verification", {
                state: {
                    email: email,
                    message: data.message,
                },
            });
        } catch (error) {
            setError(
                error.message ||
                "Unable to send reset OTP. Please try again."
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
                    “Access Restored
                    <br />
                    for a Stronger Voice”
                </>
            }
        >
            <div className="auth-card fp-card">

                {/* Icon */}
                <div className="fp-icon">
                    <i className="bi bi-key-fill" />
                </div>

                {/* Heading */}
                <div className="fp-heading">
                    <span>ACCOUNT RECOVERY</span>

                    <h2>Reset Your Password</h2>

                    <p>
                        Enter your registered email address
                        <br />
                        to receive a secure OTP.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="fp-message fp-error">
                        <i className="bi bi-exclamation-circle-fill" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* Email Input */}
                    <div className="fp-field">

                        <label htmlFor="reset-email">
                            Email Address
                        </label>

                        <div className="fp-input-wrapper">

                            <i className="bi bi-envelope" />

                            <input
                                id="reset-email"
                                type="email"
                                value={value}
                                onChange={(e) =>
                                    setValue(e.target.value)
                                }
                                placeholder="Enter your registered email"
                                autoComplete="email"
                                disabled={loading}
                                required
                            />

                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="fp-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="fp-spinner" />
                                Sending OTP...
                            </>
                        ) : (
                            <>
                                Send Reset OTP
                                <i className="bi bi-arrow-right" />
                            </>
                        )}
                    </button>

                </form>

                {/* Back */}
                <Link
                    to="/login"
                    className="fp-back"
                >
                    <i className="bi bi-arrow-left" />
                    Back to Login
                </Link>

            </div>
        </AuthLayout>
    );
}

export default ForgotPassword;