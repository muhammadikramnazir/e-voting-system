import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { registerUser } from "../../apis/authapi";
import "./Register.css";


const fields = [
    ["fullName", "Full Name", "bi-person"],
    ["email", "Email Address", "bi-envelope"],
    ["barRegistrationNo", "Bar Registration No.", "bi-card-text"],
    ["licenseNumber", "License Number", "bi-patch-check"],
    ["cnicNumber", "CNIC Number", "bi-person-vcard"],
    ["phoneNumber", "Phone Number", "bi-telephone"],
];


function Register() {

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        barRegistrationNo: "",
        licenseNumber: "",
        cnicNumber: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
    });

    const [show, setShow] = useState(false);
    const [agree, setAgree] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const navigate = useNavigate();


    /* =====================================================
       UPDATE FORM
    ===================================================== */

    const update = (key, value) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));

        // Clear old messages while user is correcting input
        if (error) {
            setError("");
        }

        if (success) {
            setSuccess("");
        }
    };


    /* =====================================================
       SUBMIT REGISTRATION
    ===================================================== */

    const submit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");


        /* ---------------------------------------------
           TERMS
        --------------------------------------------- */

        if (!agree) {
            setError(
                "Please agree to the terms and conditions."
            );
            return;
        }


        /* ---------------------------------------------
           PASSWORD MATCH
        --------------------------------------------- */

        if (form.password !== form.confirmPassword) {
            setError(
                "Password and confirm password do not match."
            );
            return;
        }


        /* ---------------------------------------------
           PASSWORD LENGTH
        --------------------------------------------- */

        if (form.password.length < 8) {
            setError(
                "Password must be at least 8 characters long."
            );
            return;
        }


        try {

            setLoading(true);


            const data = await registerUser({
                ...form,
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                barRegistrationNo:
                    form.barRegistrationNo.trim(),
                licenseNumber:
                    form.licenseNumber.trim(),
                cnicNumber:
                    form.cnicNumber.trim(),
                phoneNumber:
                    form.phoneNumber.trim(),
            });


            /* ---------------------------------------------
               VERIFY API RESPONSE
            --------------------------------------------- */

            if (!data?.status) {
                setError(
                    data?.message ||
                    "Registration failed. Please try again."
                );

                return;
            }


            /* ---------------------------------------------
               SUCCESS
            --------------------------------------------- */

            // Save registration email for OTP verification
            sessionStorage.setItem(
                "registrationEmail",
                data.email || form.email.trim()
            );

            setSuccess(
                data?.message ||
                "Registration successful. A verification OTP has been sent to your email."
            );

            // Go to registration OTP verification page
            setTimeout(() => {
                navigate("/registration-verification", {
                    state: {
                        email: data.email || form.email.trim(),
                        message: data.message,
                    },
                });
            }, 800);


        } catch (error) {

            console.error(
                "REGISTRATION ERROR:",
                error
            );

            setError(
                error?.message ||
                "Registration failed. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };


    return (
        <AuthLayout
            className="register-page"
            quote={
                <>
                    “Together
                    <br />
                    for a Fairer
                    <br />
                    Tomorrow”
                </>
            }
        >

            <div className="register-card">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="register-heading">

                    <span className="register-heading-icon">
                        <i className="bi bi-person-plus-fill" />
                    </span>

                    <div>

                        <h2>
                            Create Your Account
                        </h2>

                        <p>
                            Join the District Bar Association E-Voting System
                        </p>

                    </div>

                </div>


                {/* =================================================
                    FORM
                ================================================= */}

                <form onSubmit={submit}>

                    {/* ---------------------------------------------
                        PERSONAL INFORMATION
                    --------------------------------------------- */}

                    <div className="register-section-title">

                        <span>
                            Personal Information
                        </span>

                        <i className="bi bi-person-lines-fill" />

                    </div>


                    <div className="reg-grid">

                        {fields.map(
                            ([key, label, icon]) => (

                                <div
                                    className="register-field"
                                    key={key}
                                >

                                    <label>
                                        {label}
                                    </label>

                                    <div className="auth-input-icon">

                                        <i
                                            className={`bi ${icon}`}
                                        />

                                        <input
                                            className="auth-input"
                                            type={
                                                key === "email"
                                                    ? "email"
                                                    : "text"
                                            }
                                            value={form[key]}
                                            onChange={(e) =>
                                                update(
                                                    key,
                                                    e.target.value
                                                )
                                            }
                                            placeholder={`Enter ${label}`}
                                            autoComplete={
                                                key === "email"
                                                    ? "email"
                                                    : "off"
                                            }
                                            disabled={loading}
                                            required
                                        />

                                    </div>

                                </div>

                            )
                        )}


                        {/* =================================================
                            PASSWORD
                        ================================================= */}

                        <div className="register-field">

                            <label>
                                Create Password
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
                                    value={form.password}
                                    onChange={(e) =>
                                        update(
                                            "password",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Create a password"
                                    autoComplete="new-password"
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


                        {/* =================================================
                            CONFIRM PASSWORD
                        ================================================= */}

                        <div className="register-field">

                            <label>
                                Confirm Password
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
                                    value={form.confirmPassword}
                                    onChange={(e) =>
                                        update(
                                            "confirmPassword",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Confirm your password"
                                    autoComplete="new-password"
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

                    </div>


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (

                        <div className="auth-error">

                            <i className="bi bi-exclamation-circle-fill"></i>

                            <span>
                                {error}
                            </span>

                        </div>

                    )}


                    {/* =================================================
                        SUCCESS
                    ================================================= */}

                    {success && (

                        <div className="auth-success">

                            <i className="bi bi-check-circle-fill"></i>

                            <span>
                                {success}
                            </span>

                        </div>

                    )}


                    {/* =================================================
                        TERMS
                    ================================================= */}

                    <label className="reg-terms">

                        <input
                            type="checkbox"
                            checked={agree}
                            onChange={(e) =>
                                setAgree(
                                    e.target.checked
                                )
                            }
                            disabled={loading}
                            required
                        />

                        <span>
                            I agree to the{" "}
                            <b>
                                terms and conditions
                            </b>
                        </span>

                    </label>


                    {/* =================================================
                        BUTTON
                    ================================================= */}

                    <button
                        className="auth-btn reg-submit"
                        type="submit"
                        disabled={loading}
                    >

                        <span>
                            {loading
                                ? "Creating Account..."
                                : "Create Account"}
                        </span>

                        {!loading && (
                            <i className="bi bi-arrow-right" />
                        )}

                    </button>

                </form>

            </div>

        </AuthLayout>
    );
}

export default Register;