import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import { verifyRegistrationOtp } from "../apis/authapi";
import "./Registrationverification.css";

function RegistrationVerification() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState([
        "",
        "",
        "",
        "",
        "",
        "",
    ]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const inputRefs = useRef([]);

    // ======================================================
    // LOAD EMAIL
    // ======================================================

    useEffect(() => {
        const stateEmail = location.state?.email;
        const savedEmail =
            sessionStorage.getItem("registrationEmail");

        const currentEmail =
            stateEmail || savedEmail || "";

        setEmail(currentEmail);

        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 200);
    }, [location.state]);

    // ======================================================
    // OTP INPUT
    // ======================================================

    const handleOtpChange = (index, value) => {
        const numericValue =
            value.replace(/\D/g, "");

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
                    updatedOtp[index + offset] =
                        digit;
                });

            setOtp(updatedOtp);

            const nextIndex = Math.min(
                index + numericValue.length,
                5
            );

            setTimeout(() => {
                inputRefs.current[
                    nextIndex
                ]?.focus();
            }, 0);

            return;
        }

        // Single digit
        const updatedOtp = [...otp];

        updatedOtp[index] = numericValue;

        setOtp(updatedOtp);

        // Move to next box
        if (index < 5) {
            inputRefs.current[
                index + 1
            ]?.focus();
        }
    };

    // ======================================================
    // KEYBOARD CONTROL
    // ======================================================

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
                inputRefs.current[
                    index - 1
                ]?.focus();

                const updatedOtp = [...otp];

                updatedOtp[index - 1] = "";

                setOtp(updatedOtp);
            }

            return;
        }

        // Arrow Left
        if (
            e.key === "ArrowLeft" &&
            index > 0
        ) {
            e.preventDefault();

            inputRefs.current[
                index - 1
            ]?.focus();

            return;
        }

        // Arrow Right
        if (
            e.key === "ArrowRight" &&
            index < 5
        ) {
            e.preventDefault();

            inputRefs.current[
                index + 1
            ]?.focus();

            return;
        }
    };

    // ======================================================
    // PASTE
    // ======================================================

    const handlePaste = (e) => {
        e.preventDefault();

        const pastedText =
            e.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, 6);

        if (!pastedText) return;

        const updatedOtp = [
            "",
            "",
            "",
            "",
            "",
            "",
        ];

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
            inputRefs.current[
                focusIndex
            ]?.focus();
        }, 0);
    };

    // ======================================================
    // SUBMIT
    // ======================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const currentEmail =
            email.trim() ||
            sessionStorage.getItem(
                "registrationEmail"
            );

        const currentOtp =
            otp.join("");

        if (!currentEmail) {
            setError(
                "Registration email not found. Please register again."
            );

            return;
        }

        if (currentOtp.length !== 6) {
            setError(
                "Please enter the complete 6-digit OTP."
            );

            return;
        }

        try {
            setLoading(true);

            const data =
                await verifyRegistrationOtp(
                    currentEmail,
                    currentOtp
                );

            setSuccess(
                data.message ||
                "Email verified successfully."
            );

            // Registration is now verified
            sessionStorage.removeItem(
                "registrationEmail"
            );

            setTimeout(() => {
                navigate("/login", {
                    state: {
                        message:
                            "Account verified successfully. You can now login.",
                    },
                });
            }, 1000);
        } catch (error) {
            setError(
                error.message ||
                "Invalid or expired OTP. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // ======================================================
    // UI
    // ======================================================

    return (
        <AuthLayout
            className="registration-verify-page"
            quote={
                <>
                    “Your Voice
                    <br />
                    Begins with
                    <br />
                    Verification”
                </>
            }
        >
            <div className="auth-card rv-card">

                {/* ICON */}

                <div className="rv-icon">
                    <i className="bi bi-person-check-fill" />
                </div>

                {/* HEADING */}

                <div className="rv-heading">
                    <span>
                        ACCOUNT VERIFICATION
                    </span>

                    <h2>
                        Verify Your Email
                    </h2>

                    <p>
                        Enter the 6-digit OTP sent to
                        <br />

                        <strong>
                            {email ||
                                "your registered email"}
                        </strong>
                    </p>
                </div>

                {/* ERROR */}

                {error && (
                    <div className="rv-message rv-error">
                        <i className="bi bi-exclamation-circle-fill" />

                        <span>
                            {error}
                        </span>
                    </div>
                )}

                {/* SUCCESS */}

                {success && (
                    <div className="rv-message rv-success">
                        <i className="bi bi-check-circle-fill" />

                        <span>
                            {success}
                        </span>
                    </div>
                )}

                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                >
                    <div
                        className="rv-otp-wrapper"
                        onPaste={handlePaste}
                    >
                        {otp.map(
                            (digit, index) => (
                                <input
                                    key={index}
                                    ref={(element) => {
                                        inputRefs.current[
                                            index
                                        ] = element;
                                    }}
                                    className={`rv-otp-box ${digit
                                        ? "rv-otp-filled"
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
                                    disabled={
                                        loading
                                    }
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
                            )
                        )}
                    </div>

                    {/* SUBMIT */}

                    <button
                        type="submit"
                        className="rv-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="rv-spinner" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                Verify Email
                                <i className="bi bi-arrow-right" />
                            </>
                        )}
                    </button>
                </form>

                {/* BACK */}

                <Link
                    to="/login"
                    className="rv-back"
                >
                    <i className="bi bi-arrow-left" />
                    Back to Login
                </Link>

            </div>
        </AuthLayout>
    );
}

export default RegistrationVerification;