import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { verifyOtp } from "../../apis/authapi";
import "./Emailverification.css";

function EmailVerification() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const inputRefs = useRef([]);

    useEffect(() => {
        const stateEmail = location.state?.email;
        const savedEmail = sessionStorage.getItem("resetEmail");

        setEmail(stateEmail || savedEmail || "");

        // Focus first OTP box
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 200);
    }, [location.state]);

    /* =====================================================
       OTP INPUT
    ===================================================== */

    const handleOtpChange = (index, value) => {
        const numericValue = value.replace(/\D/g, "");

        // Empty value
        if (!numericValue) {
            const updatedOtp = [...otp];
            updatedOtp[index] = "";
            setOtp(updatedOtp);
            return;
        }

        // Paste / multiple digits
        if (numericValue.length > 1) {
            const updatedOtp = [...otp];

            numericValue
                .slice(0, 6 - index)
                .split("")
                .forEach((digit, offset) => {
                    updatedOtp[index + offset] = digit;
                });

            setOtp(updatedOtp);

            const nextIndex = Math.min(
                index + numericValue.length,
                5
            );

            setTimeout(() => {
                inputRefs.current[nextIndex]?.focus();
            }, 0);

            return;
        }

        // Single digit
        const updatedOtp = [...otp];

        updatedOtp[index] = numericValue;

        setOtp(updatedOtp);

        // Move to next box
        if (index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    /* =====================================================
       KEYBOARD CONTROL
    ===================================================== */

    const handleKeyDown = (index, e) => {

        // Backspace
        if (e.key === "Backspace") {

            if (otp[index]) {
                const updatedOtp = [...otp];

                updatedOtp[index] = "";

                setOtp(updatedOtp);

                return;
            }

            if (index > 0) {
                inputRefs.current[index - 1]?.focus();

                const updatedOtp = [...otp];

                updatedOtp[index - 1] = "";

                setOtp(updatedOtp);
            }

            return;
        }

        // Arrow Left
        if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();

            inputRefs.current[index - 1]?.focus();

            return;
        }

        // Arrow Right
        if (e.key === "ArrowRight" && index < 5) {
            e.preventDefault();

            inputRefs.current[index + 1]?.focus();

            return;
        }
    };

    /* =====================================================
       PASTE
    ===================================================== */

    const handlePaste = (e) => {
        e.preventDefault();

        const pastedText =
            e.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, 6);

        if (!pastedText) return;

        const updatedOtp = ["", "", "", "", "", ""];

        pastedText
            .split("")
            .forEach((digit, index) => {
                updatedOtp[index] = digit;
            });

        setOtp(updatedOtp);

        const focusIndex = Math.min(
            pastedText.length,
            5
        );

        setTimeout(() => {
            inputRefs.current[focusIndex]?.focus();
        }, 0);
    };

    /* =====================================================
       SUBMIT
    ===================================================== */

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const currentEmail =
            email.trim() ||
            sessionStorage.getItem("resetEmail");

        const currentOtp = otp.join("");

        if (!currentEmail) {
            setError(
                "Email not found. Please start the password reset process again."
            );
            return;
        }

        if (currentOtp.length !== 6) {
            setError("Please enter the complete 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);

            const data = await verifyOtp(
                currentEmail,
                currentOtp
            );

            sessionStorage.setItem(
                "resetEmail",
                currentEmail
            );

            sessionStorage.setItem(
                "otpVerified",
                "true"
            );

            setSuccess(
                data.message ||
                "OTP verified successfully."
            );

            setTimeout(() => {
                navigate("/reset-password");
            }, 800);

        } catch (error) {
            setError(
                error.message ||
                "Invalid OTP. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            className="verify-page"
            quote={
                <>
                    “One Step Closer
                    <br />
                    to a Stronger Bar”
                </>
            }
        >
            <div className="auth-card ev-card">

                {/* =================================================
                    ICON
                ================================================= */}

                <div className="ev-icon">
                    <i className="bi bi-envelope-check-fill" />
                </div>


                {/* =================================================
                    HEADING
                ================================================= */}

                <div className="ev-heading">

                    <span>SECURITY VERIFICATION</span>

                    <h2>Verify OTP</h2>

                    <p>
                        Enter the 6-digit OTP sent to
                        <br />

                        <strong>
                            {email || "your registered email"}
                        </strong>
                    </p>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div className="ev-message ev-error">
                        <i className="bi bi-exclamation-circle-fill" />

                        <span>
                            {error}
                        </span>
                    </div>
                )}


                {/* =================================================
                    SUCCESS
                ================================================= */}

                {success && (
                    <div className="ev-message ev-success">
                        <i className="bi bi-check-circle-fill" />

                        <span>
                            {success}
                        </span>
                    </div>
                )}


                {/* =================================================
                    FORM
                ================================================= */}

                <form onSubmit={handleSubmit}>

                    <div
                        className="otp-wrapper"
                        onPaste={handlePaste}
                    >

                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(element) => {
                                    inputRefs.current[index] =
                                        element;
                                }}
                                className={`otp-box ${digit
                                        ? "otp-filled"
                                        : ""
                                    }`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                autoComplete={
                                    index === 0
                                        ? "one-time-code"
                                        : "off"
                                }
                                disabled={loading}
                                aria-label={`OTP digit ${index + 1
                                    }`}
                                onChange={(e) =>
                                    handleOtpChange(
                                        index,
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) =>
                                    handleKeyDown(
                                        index,
                                        e
                                    )
                                }
                            />
                        ))}

                    </div>


                    {/* =================================================
                        SUBMIT
                    ================================================= */}

                    <button
                        type="submit"
                        className="ev-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="ev-spinner" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                Verify OTP
                                <i className="bi bi-arrow-right" />
                            </>
                        )}
                    </button>

                </form>


                {/* =================================================
                    BACK
                ================================================= */}

                <Link
                    to="/login"
                    className="ev-back"
                >
                    <i className="bi bi-arrow-left" />
                    Back to Login
                </Link>

            </div>
        </AuthLayout>
    );
}

export default EmailVerification;