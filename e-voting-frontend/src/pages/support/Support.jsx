import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/dashboardLayout/DashboardLayout";
import { createSupportRequest } from "../../apis/authapi";
import "./Support.css";


function Support() {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
       AUTO SCROLL FOR STATUS
    ===================================================== */

    useEffect(() => {
        if (error || sent) {
            scrollToTop();
        }
    }, [error, sent]);


    /* =====================================================
       SUBMIT SUPPORT REQUEST
    ===================================================== */

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSent(false);


        /* ---------------------------------------------
           VALIDATION
        --------------------------------------------- */

        if (!subject) {
            setError("Please select a subject.");
            return;
        }

        if (!message.trim()) {
            setError("Please enter your message.");
            return;
        }


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

            const data = await createSupportRequest(
                token,
                subject,
                message.trim()
            );


            if (!data?.status) {
                setError(
                    data?.message ||
                    "Unable to send your support request."
                );

                return;
            }


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            setSent(true);

            setSubject("");
            setMessage("");


        } catch (err) {
            console.error(
                "SUPPORT REQUEST ERROR:",
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
                className="support-page"
            >


                {/* =====================================================
                    WELCOME SUPPORT BANNER
                ===================================================== */}

                <section className="support-welcome">

                    <div className="support-welcome-icon">
                        <i className="bi bi-headset"></i>
                    </div>


                    <div className="support-welcome-content">

                        <span className="support-label">
                            MEMBER SUPPORT CENTER
                        </span>

                        <h1>
                            We're Here to Help
                        </h1>

                        <p>
                            Welcome to our support center. If you have a question,
                            voting issue, account problem, or need assistance,
                            our team is here to guide you.
                        </p>


                        <div className="support-points">

                            <span>
                                <i className="bi bi-check-circle-fill"></i>
                                Quick Assistance
                            </span>

                            <span>
                                <i className="bi bi-check-circle-fill"></i>
                                Professional Support
                            </span>

                            <span>
                                <i className="bi bi-check-circle-fill"></i>
                                Member Focused
                            </span>

                        </div>

                    </div>


                    <div className="support-welcome-badge">

                        <i className="bi bi-chat-square-heart-fill"></i>

                        <strong>
                            Your Voice
                        </strong>

                        <small>
                            Matters to us
                        </small>

                    </div>

                </section>


                {/* =====================================================
                    PAGE HEADING
                ===================================================== */}

                <div className="support-heading">

                    <div>

                        <h2>
                            How Can We Help You?
                        </h2>

                        <p>
                            Tell us what you need and our support team will
                            help you find the right solution.
                        </p>

                    </div>


                    <div className="support-available">

                        <div className="support-available-icon">
                            <i className="bi bi-clock-history"></i>
                        </div>

                        <div>

                            <strong>
                                Support Available
                            </strong>

                            <small>
                                We're ready to assist
                            </small>

                        </div>

                    </div>

                </div>


                {/* =====================================================
                    MAIN CONTENT
                ===================================================== */}

                <div className="support-main">


                    {/* =================================================
                        CONTACT FORM
                    ================================================= */}

                    <section className="support-form-card">

                        <div className="support-card-header">

                            <div className="support-card-icon">
                                <i className="bi bi-envelope-paper-fill"></i>
                            </div>

                            <div>

                                <h3>
                                    Send Us a Message
                                </h3>

                                <p>
                                    Describe your question or problem below.
                                </p>

                            </div>

                        </div>


                        <form onSubmit={handleSubmit}>

                            {/* -----------------------------------------
                                SUBJECT
                            ----------------------------------------- */}

                            <div className="support-field">

                                <label htmlFor="support-subject">
                                    Subject
                                </label>

                                <div className="support-input-box">

                                    <i className="bi bi-list-ul"></i>

                                    <select
                                        id="support-subject"
                                        value={subject}
                                        onChange={(e) =>
                                            setSubject(e.target.value)
                                        }
                                        disabled={loading}
                                    >

                                        <option value="">
                                            Select Subject
                                        </option>

                                        <option value="Voting Issue">
                                            Voting Issue
                                        </option>

                                        <option value="Account Problem">
                                            Account Problem
                                        </option>

                                        <option value="Candidate Query">
                                            Candidate Query
                                        </option>

                                        <option value="Election Information">
                                            Election Information
                                        </option>

                                        <option value="Profile / Membership">
                                            Profile / Membership
                                        </option>

                                        <option value="Other">
                                            Other
                                        </option>

                                    </select>

                                </div>

                            </div>


                            {/* -----------------------------------------
                                MESSAGE
                            ----------------------------------------- */}

                            <div className="support-field">

                                <label htmlFor="support-message">
                                    Message
                                </label>

                                <div className="support-textarea-box">

                                    <i className="bi bi-chat-left-text"></i>

                                    <textarea
                                        id="support-message"
                                        value={message}
                                        onChange={(e) =>
                                            setMessage(e.target.value)
                                        }
                                        placeholder="Tell us how we can help you..."
                                        disabled={loading}
                                    ></textarea>

                                </div>

                            </div>


                            {/* -----------------------------------------
                                ERROR
                            ----------------------------------------- */}

                            {error && (

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "10px",
                                        padding: "14px 16px",
                                        marginBottom: "16px",
                                        borderRadius: "10px",
                                        background: "#fff1f1",
                                        border: "1px solid #f0b7b7",
                                        color: "#b42318",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                    }}
                                >

                                    <i className="bi bi-exclamation-circle-fill"></i>

                                    <span>
                                        {error}
                                    </span>

                                </div>

                            )}


                            {/* -----------------------------------------
                                SUCCESS
                            ----------------------------------------- */}

                            {sent && (

                                <div className="support-success">

                                    <i className="bi bi-check-circle-fill"></i>

                                    <div>

                                        <strong>
                                            Message Sent Successfully
                                        </strong>

                                        <small>
                                            Thank you for contacting us. Our support
                                            team will assist you.
                                        </small>

                                    </div>

                                </div>

                            )}


                            {/* -----------------------------------------
                                SUBMIT
                            ----------------------------------------- */}

                            <button
                                type="submit"
                                className="support-submit"
                                disabled={loading}
                            >

                                {loading ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm"
                                            role="status"
                                            aria-hidden="true"
                                        ></span>

                                        Sending...

                                        <i className="bi bi-hourglass-split"></i>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-send-fill"></i>

                                        Send Message

                                        <i className="bi bi-arrow-right"></i>
                                    </>
                                )}

                            </button>

                        </form>

                    </section>


                    {/* =================================================
                        RIGHT SUPPORT CARDS
                    ================================================= */}

                    <div className="support-side">


                        <div className="support-info-card">

                            <div className="support-info-icon blue">
                                <i className="bi bi-shield-check"></i>
                            </div>

                            <h3>
                                Trusted Support
                            </h3>

                            <p>
                                Your concerns are handled with care,
                                privacy and professionalism.
                            </p>

                            <div className="support-divider"></div>

                            <div className="support-check">
                                <i className="bi bi-check2"></i>
                                Secure communication
                            </div>

                            <div className="support-check">
                                <i className="bi bi-check2"></i>
                                Member-focused assistance
                            </div>

                            <div className="support-check">
                                <i className="bi bi-check2"></i>
                                Clear guidance
                            </div>

                        </div>


                        <div className="support-info-card support-gold-card">

                            <div className="support-info-icon gold">
                                <i className="bi bi-question-circle-fill"></i>
                            </div>

                            <h3>
                                Need Quick Help?
                            </h3>

                            <p>
                                Check our frequently asked questions
                                for common issues and quick answers.
                            </p>

                            <button type="button">
                                Explore FAQ
                                <i className="bi bi-arrow-right"></i>
                            </button>

                        </div>

                    </div>

                </div>


                {/* =====================================================
                    OTHER HELP
                ===================================================== */}

                <section className="support-other">

                    <div className="support-other-heading">

                        <div>

                            <span>
                                SUPPORT OPTIONS
                            </span>

                            <h2>
                                Other Ways We Can Help
                            </h2>

                        </div>

                        <p>
                            Choose the option that best matches your needs.
                        </p>

                    </div>


                    <div className="support-help-grid">


                        <button
                            type="button"
                            className="support-help-card"
                        >

                            <div className="support-help-icon blue">
                                <i className="bi bi-question-lg"></i>
                            </div>

                            <div className="support-help-content">

                                <h3>
                                    Frequently Asked Questions
                                </h3>

                                <p>
                                    Find answers to common questions.
                                </p>

                            </div>

                            <span className="support-help-arrow">
                                <i className="bi bi-arrow-right"></i>
                            </span>

                        </button>


                        <button
                            type="button"
                            className="support-help-card"
                        >

                            <div className="support-help-icon green">
                                <i className="bi bi-headset"></i>
                            </div>

                            <div className="support-help-content">

                                <h3>
                                    Contact Administration
                                </h3>

                                <p>
                                    Get in touch with the administration.
                                </p>

                            </div>

                            <span className="support-help-arrow">
                                <i className="bi bi-arrow-right"></i>
                            </span>

                        </button>


                        <button
                            type="button"
                            className="support-help-card"
                        >

                            <div className="support-help-icon gold">
                                <i className="bi bi-info-circle-fill"></i>
                            </div>

                            <div className="support-help-content">

                                <h3>
                                    Election Assistance
                                </h3>

                                <p>
                                    Get help with voting and elections.
                                </p>

                            </div>

                            <span className="support-help-arrow">
                                <i className="bi bi-arrow-right"></i>
                            </span>

                        </button>


                    </div>

                </section>


                {/* =====================================================
                    BOTTOM PROFESSIONAL BANNER
                ===================================================== */}

                <section className="support-bottom-banner">

                    <div className="support-bottom-overlay"></div>

                    <div className="support-bottom-content">

                        <div className="support-bottom-left">

                            <span className="support-quote">
                                “
                            </span>

                            <div>

                                <h2>
                                    Your Questions.
                                    <br />
                                    Our Support.
                                </h2>

                                <p>
                                    We're committed to making your experience
                                    simple, secure and stress-free.
                                </p>

                            </div>

                        </div>


                        <div className="support-bottom-service">

                            <div className="support-heart">
                                <i className="bi bi-heart-fill"></i>
                            </div>

                            <div>

                                <strong>
                                    Member First
                                </strong>

                                <small>
                                    Service with care
                                </small>

                            </div>

                        </div>

                    </div>

                </section>


            </div>

        </DashboardLayout>
    );
}

export default Support;