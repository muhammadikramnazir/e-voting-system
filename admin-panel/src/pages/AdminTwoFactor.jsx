import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminTwoFactor.css";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";

function AdminTwoFactor() {
    const navigate = useNavigate();
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState(() => {
        const sentAt = Number(sessionStorage.getItem("admin2FAOtpSentAt") || 0);
        return sentAt && Date.now() - sentAt < 60000
            ? "A verification code has already been sent to your administrator email."
            : "";
    });
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [seconds, setSeconds] = useState(() => {
        const sentAt = Number(sessionStorage.getItem("admin2FAOtpSentAt") || 0);
        return sentAt && Date.now() - sentAt < 60000
            ? Math.ceil((60000 - (Date.now() - sentAt)) / 1000)
            : 0;
    });
    const [email] = useState(
        () => sessionStorage.getItem("admin2FAEmail") || ""
    );
    const [admin] = useState(() => {
        try {
            const pending = sessionStorage.getItem("admin2FAPending");
            return pending ? JSON.parse(pending) : null;
        } catch {
            return null;
        }
    });
    const otpRefs = useRef([]);
    const initializedRef = useRef(false);

    const sendOtp = async () => {
        const currentEmail = sessionStorage.getItem("admin2FAEmail") || "";
        if (!currentEmail) return;

        setSending(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/admin/2fa/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: currentEmail.toLowerCase() }),
            });

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(data.message || "Unable to send verification code.");
            }

            sessionStorage.setItem("admin2FAOtpSentAt", String(Date.now()));
            setSeconds(60);
            setMessage("A new verification code has been sent to your administrator email.");
            setOtp("");
            requestAnimationFrame(() => otpRefs.current[0]?.focus());
        } catch (err) {
            setError(err.message || "Unable to send verification code.");
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const pendingEmail = sessionStorage.getItem("admin2FAEmail");
        const pendingAdmin = sessionStorage.getItem("admin2FAPending");
        const sentAt = Number(sessionStorage.getItem("admin2FAOtpSentAt") || 0);

        if (!pendingEmail || !pendingAdmin || !admin) {
            navigate("/admin/login", { replace: true });
            return;
        }

        if (sentAt && Date.now() - sentAt < 60000) {
            requestAnimationFrame(() => otpRefs.current[0]?.focus());
        } else {
            const timer = setTimeout(() => {
                void sendOtp();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [navigate, admin]);

    useEffect(() => {
        if (seconds <= 0) return;
        const timer = setInterval(() => {
            setSeconds((value) => Math.max(value - 1, 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [seconds]);

    const handleVerify = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!/^\d{6}$/.test(otp)) {
            setError("Please enter the complete 6-digit verification code.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/admin/2fa/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.toLowerCase(), otp }),
            });

            const data = await response.json();

            if (!response.ok || !data.status || !data.token) {
                throw new Error(data.message || "Invalid verification code.");
            }

            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("admin", JSON.stringify(data.admin || admin));

            const remember = sessionStorage.getItem("admin2FARememberMe") === "true";
            if (remember) {
                localStorage.setItem("adminRememberMe", "true");
            } else {
                localStorage.removeItem("adminRememberMe");
            }

            sessionStorage.removeItem("admin2FAEmail");
            sessionStorage.removeItem("admin2FAPending");
            sessionStorage.removeItem("admin2FARememberMe");
            sessionStorage.removeItem("admin2FAOtpSentAt");

            navigate("/admin/dashboard", { replace: true });
        } catch (err) {
            setError(err.message || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const next = otp.split("");
        next[index] = digit;
        setOtp(next.join("").slice(0, 6));

        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleBack = () => {
        if (loading || sending) return;

        sessionStorage.removeItem("admin2FAEmail");
        sessionStorage.removeItem("admin2FAPending");
        sessionStorage.removeItem("admin2FARememberMe");
        sessionStorage.removeItem("admin2FAOtpSentAt");

        navigate("/admin/login", { replace: true });
    };

    return (
        <div className="admin-2fa-page">
            <div className="admin-2fa-orbit admin-2fa-orbit-one" />
            <div className="admin-2fa-orbit admin-2fa-orbit-two" />

            <div className="admin-2fa-card">
                <div className="admin-2fa-icon">
                    <i className="bi bi-shield-lock-fill" />
                </div>

                <div className="admin-2fa-badge">
                    <span />
                    TWO-FACTOR SECURITY
                </div>

                <h1>Verify your identity</h1>

                <p className="admin-2fa-description">
                    Enter the 6-digit verification code sent to
                    <strong>{email || "your administrator email"}</strong>.
                </p>

                {error && (
                    <div className="admin-2fa-alert error">
                        <i className="bi bi-exclamation-circle-fill" />
                        <span>{error}</span>
                    </div>
                )}

                {message && !error && (
                    <div className="admin-2fa-alert success">
                        <i className="bi bi-check-circle-fill" />
                        <span>{message}</span>
                    </div>
                )}

                <form onSubmit={handleVerify}>
                    <div className="admin-otp-boxes">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <input
                                key={index}
                                ref={(element) => {
                                    otpRefs.current[index] = element;
                                }}
                                className="admin-otp-box"
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={otp[index] || ""}
                                aria-label={`Verification digit ${index + 1}`}
                                autoComplete={index === 0 ? "one-time-code" : "off"}
                                disabled={loading || sending}
                                onChange={(event) => handleOtpChange(index, event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Backspace" && !otp[index] && index > 0) {
                                        otpRefs.current[index - 1]?.focus();
                                    }
                                    if (event.key === "ArrowLeft" && index > 0) {
                                        otpRefs.current[index - 1]?.focus();
                                    }
                                    if (event.key === "ArrowRight" && index < 5) {
                                        otpRefs.current[index + 1]?.focus();
                                    }
                                }}
                                onPaste={(event) => {
                                    event.preventDefault();
                                    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                                    if (!pasted) return;
                                    setOtp(pasted);
                                    requestAnimationFrame(() => {
                                        otpRefs.current[Math.min(pasted.length - 1, 5)]?.focus();
                                    });
                                }}
                            />
                        ))}
                    </div>

                    <button
                        className="admin-2fa-verify"
                        type="submit"
                        disabled={loading || sending}
                    >
                        {loading ? (
                            <>
                                <span className="admin-2fa-spinner" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-shield-check" />
                                Verify & Continue
                            </>
                        )}
                    </button>
                </form>

                <div className="admin-2fa-actions">
                    <button
                        type="button"
                        className="admin-2fa-resend"
                        onClick={sendOtp}
                        disabled={loading || sending || seconds > 0}
                    >
                        <i className="bi bi-arrow-clockwise" />
                        {seconds > 0 ? `Resend code in ${seconds}s` : "Resend verification code"}
                    </button>

                    <button
                        type="button"
                        className="admin-2fa-back"
                        onClick={handleBack}
                        disabled={loading || sending}
                    >
                        <i className="bi bi-arrow-left" />
                        Back to administrator login
                    </button>
                </div>

                <div className="admin-2fa-security">
                    <i className="bi bi-lock-fill" />
                    <span>Your verification code is time-limited and can only be used once.</span>
                </div>
            </div>
        </div>
    );
}

export default AdminTwoFactor;
