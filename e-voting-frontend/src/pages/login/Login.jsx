import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { loginUser } from "../../apis/authapi";
import "./Login.css";

function Login() {

    const [show, setShow] = useState(false);
    const [remember, setRemember] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const location = useLocation();
    const navigate = useNavigate();


    useEffect(() => {
        const message = location.state?.message;

        if (message) {
            setSuccess(message);

            // Prevent the message from reappearing on refresh/back navigation.
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);


    /* =====================================================
       LOGIN
       No auto-scroll on error
    ===================================================== */

    const submit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const loginValue = email.trim();

        if (!loginValue) {
            setError(
                "Please enter your email or registration number."
            );
            return;
        }

        if (!password) {
            setError(
                "Please enter your password."
            );
            return;
        }

        try {
            setLoading(true);

            const data = await loginUser({
                email: loginValue,
                password,
            });


            /* ---------------------------------------------
               VERIFY API RESPONSE
            --------------------------------------------- */

            if (!data?.status) {
                setError(
                    data?.message ||
                    "Login failed. Please check your credentials."
                );

                return;
            }


            if (!data?.token) {
                setError(
                    "Login was successful but authentication token was not received."
                );

                return;
            }


            /* ---------------------------------------------
               SAVE JWT
            --------------------------------------------- */

            if (remember) {
                localStorage.setItem(
                    "token",
                    data.token
                );

                sessionStorage.removeItem("token");

            } else {
                sessionStorage.setItem(
                    "token",
                    data.token
                );

                localStorage.removeItem("token");
            }


            /* ---------------------------------------------
               SAVE USER
            --------------------------------------------- */

            if (data.user) {
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );
            }


            /* ---------------------------------------------
               GO TO DASHBOARD
            --------------------------------------------- */

            navigate("/");

        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );

            setError(
                error?.message ||
                "Login failed. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };


    return (
        <AuthLayout
            className="login-page"
            quote={
                <>
                    “Your Vote. Your Voice.
                    <br />
                    A Stronger Bar.”
                </>
            }
        >

            <div className="login-card">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="login-heading">

                    <span className="login-heading-icon">
                        <i className="bi bi-box-arrow-in-right" />
                    </span>

                    <div>

                        <h2>
                            Welcome Back
                        </h2>

                        <p>
                            Sign in to continue to your account
                        </p>

                    </div>

                </div>


                {/* =================================================
                    FORM
                ================================================= */}

                <form onSubmit={submit}>

                    {/* ---------------------------------------------
                        EMAIL / REGISTRATION
                    --------------------------------------------- */}

                    <div className="login-field">

                        <label>
                            Email or Registration No.
                        </label>

                        <div className="auth-input-icon">

                            <i className="bi bi-envelope" />

                            <input
                                className="auth-input"
                                type="text"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="Enter your email or registration no."
                                autoComplete="username"
                                disabled={loading}
                                required
                            />

                        </div>

                    </div>


                    {/* ---------------------------------------------
                        PASSWORD
                    --------------------------------------------- */}

                    <div className="login-field">

                        <label>
                            Password
                        </label>

                        <div className="auth-input-icon">

                            <i className="bi bi-lock-fill" />

                            <input
                                className="auth-input"
                                type={
                                    show
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={loading}
                                required
                            />

                            <button
                                className="auth-eye"
                                type="button"
                                onClick={() =>
                                    setShow(!show)
                                }
                                aria-label={
                                    show
                                        ? "Hide password"
                                        : "Show password"
                                }
                                disabled={loading}
                            >

                                <i
                                    className={`bi ${show
                                            ? "bi-eye-slash"
                                            : "bi-eye"
                                        }`}
                                />

                            </button>

                        </div>

                    </div>


                    {/* ---------------------------------------------
                        ERROR
                    --------------------------------------------- */}

                    {success && (

                        <div className="auth-success">

                            <i className="bi bi-check-circle-fill"></i>

                            <span>{success}</span>

                        </div>
                    )}

                    {error && (

                        <div className="auth-error">

                            <i className="bi bi-exclamation-circle-fill"></i>

                            <span>
                                {error}
                            </span>

                        </div>

                    )}


                    {/* =================================================
                        OPTIONS
                    ================================================= */}

                    <div className="login-options">

                        <label>

                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) =>
                                    setRemember(
                                        e.target.checked
                                    )
                                }
                                disabled={loading}
                            />

                            <span>
                                Remember me
                            </span>

                        </label>


                        <Link
                            to="/forgot-password"
                            className="auth-link"
                        >
                            Forgot Password?
                        </Link>

                    </div>


                    {/* =================================================
                        BUTTON
                    ================================================= */}

                    <button
                        className="auth-btn login-submit"
                        type="submit"
                        disabled={loading}
                    >

                        <span>
                            {loading
                                ? "Signing In..."
                                : "Sign In"}
                        </span>

                        {!loading && (
                            <i className="bi bi-arrow-right" />
                        )}

                    </button>

                </form>


                {/* =================================================
                    SECURITY
                ================================================= */}

                <div className="login-security">

                    <i className="bi bi-shield-check" />

                    <span>
                        Your account is protected with secure
                        authentication.
                    </span>

                </div>

            </div>

        </AuthLayout>
    );
}

export default Login;