import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboardLayout/DashboardLayout";
import { getProfile } from "../../apis/authapi";
import { submitVerification } from "../../apis/verificationapi";
import "./Verification.css";

const STEPS = [
    {
        number: 1,
        title: "Personal Information",
        icon: "bi-person",
    },
    {
        number: 2,
        title: "Professional Details",
        icon: "bi-briefcase",
    },
    {
        number: 3,
        title: "Document Verification",
        icon: "bi-file-earmark-check",
    },
    {
        number: 4,
        title: "Review & Submit",
        icon: "bi-check2-circle",
    },
];

const emptyFiles = {
    cnicFront: null,
    cnicBack: null,
    license: null,
    barCard: null,
    additionalDocument: null,
};

function Verification() {
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        cnicNumber: "",
        barRegistrationNo: "",
        licenseNumber: "",
        barAssociation: "District Bar Association",
        practiceArea: "",
        yearsOfPractice: "",
        chamberAddress: "",
    });

    const [files, setFiles] = useState(emptyFiles);

    // ==================================================
    // GET TOKEN
    // ==================================================

    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            sessionStorage.getItem("token")
        );
    };

    // ==================================================
    // LOAD PROFILE
    // ==================================================

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                setError("");

                const token = getToken();

                if (!token) {
                    setError("Please login first.");
                    return;
                }

                const data = await getProfile(token);
                const profile = data?.user || {};

                setUser(profile);

                setFormData({
                    fullName: profile.full_name || "",
                    email: profile.email || "",
                    phoneNumber: profile.phone_number || "",
                    cnicNumber: profile.cnic_number || "",

                    barRegistrationNo:
                        profile.bar_registration_no || "",

                    licenseNumber:
                        profile.license_number || "",

                    barAssociation:
                        profile.bar_association ||
                        "District Bar Association",

                    practiceArea:
                        profile.practice_area || "",

                    yearsOfPractice:
                        profile.years_of_practice ?? "",

                    chamberAddress:
                        profile.chamber_address || "",
                });
            } catch (requestError) {
                console.error(
                    "VERIFICATION PROFILE ERROR:",
                    requestError
                );

                setError(
                    requestError.message ||
                    "Unable to load your profile."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    // ==================================================
    // FORM CHANGE
    // ==================================================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError("");
        setSuccess("");
    };

    // ==================================================
    // FILE CHANGE
    // ==================================================

    const handleFileChange = (event, key) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "application/pdf",
        ];

        if (!allowedTypes.includes(file.type)) {
            setError(
                "Only JPG, PNG or PDF documents are allowed."
            );

            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError(
                "Each document must be 5 MB or smaller."
            );

            event.target.value = "";
            return;
        }

        setFiles((previous) => ({
            ...previous,
            [key]: file,
        }));

        setError("");
        setSuccess("");
    };

    // ==================================================
    // REMOVE FILE
    // ==================================================

    const removeFile = (key) => {
        setFiles((previous) => ({
            ...previous,
            [key]: null,
        }));

        setError("");
    };

    // ==================================================
    // VALIDATE STEP
    // ==================================================

    const validateStep = () => {
        setError("");

        if (currentStep === 1) {
            if (
                !formData.fullName.trim() ||
                !formData.email.trim() ||
                !formData.phoneNumber.trim() ||
                !formData.cnicNumber.trim()
            ) {
                setError(
                    "Please complete all required personal information."
                );

                return false;
            }
        }

        if (currentStep === 2) {
            if (
                !formData.barRegistrationNo.trim() ||
                !formData.licenseNumber.trim() ||
                !formData.barAssociation.trim()
            ) {
                setError(
                    "Please complete all required professional details."
                );

                return false;
            }
        }

        if (currentStep === 3) {
            if (
                !files.cnicFront ||
                !files.cnicBack ||
                !files.license ||
                !files.barCard
            ) {
                setError(
                    "Please upload all required verification documents."
                );

                return false;
            }
        }

        return true;
    };

    // ==================================================
    // NEXT
    // ==================================================

    const goNext = () => {
        if (!validateStep()) {
            return;
        }

        setSuccess("");

        setCurrentStep((previous) =>
            Math.min(
                previous + 1,
                STEPS.length
            )
        );
    };

    // ==================================================
    // BACK
    // ==================================================

    const goBack = () => {
        setError("");
        setSuccess("");

        setCurrentStep((previous) =>
            Math.max(previous - 1, 1)
        );
    };

    // ==================================================
    // REAL API SUBMIT
    // ==================================================

    const handleSubmit = async () => {
        if (!validateStep()) {
            return;
        }

        try {
            setError("");
            setSuccess("");
            setSubmitting(true);

            const token = getToken();

            if (!token) {
                setError("Please login first.");
                return;
            }

            const data = await submitVerification(
                token,
                formData,
                files
            );

            console.log(
                "VERIFICATION SUBMITTED:",
                data
            );

            setSubmitted(true);

            setSuccess(
                data.message ||
                "Your verification request has been submitted successfully."
            );
        } catch (requestError) {
            console.error(
                "VERIFICATION SUBMIT ERROR:",
                requestError
            );

            setError(
                requestError.message ||
                "Unable to submit verification request."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ==================================================
    // PROGRESS
    // ==================================================

    const progress = useMemo(
        () =>
            (currentStep / STEPS.length) * 100,
        [currentStep]
    );

    // ==================================================
    // FILE BOX
    // ==================================================

    const renderFileBox = (
        key,
        label,
        description,
        required = true
    ) => {
        const file = files[key];

        return (
            <div className="verification-file-card">
                <div className="verification-file-icon">
                    <i className="bi bi-cloud-arrow-up"></i>
                </div>

                <div className="verification-file-content">
                    <div className="verification-file-title-row">
                        <div>
                            <h4>{label}</h4>
                            <p>{description}</p>
                        </div>

                        <span
                            className={`verification-required ${required
                                    ? "required"
                                    : "optional"
                                }`}
                        >
                            {required
                                ? "Required"
                                : "Optional"}
                        </span>
                    </div>

                    {file ? (
                        <div className="verification-selected-file">
                            <span>
                                <i className="bi bi-file-earmark-check"></i>
                                {file.name}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    removeFile(key)
                                }
                                aria-label={`Remove ${label}`}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                    ) : (
                        <label className="verification-upload-btn">
                            <i className="bi bi-upload"></i>
                            Choose File

                            <input
                                type="file"
                                accept="image/jpeg,image/png,application/pdf"
                                onChange={(event) =>
                                    handleFileChange(
                                        event,
                                        key
                                    )
                                }
                                hidden
                            />
                        </label>
                    )}
                </div>
            </div>
        );
    };

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <DashboardLayout>
                <div className="verification-page">
                    <div className="verification-shell">
                        <div className="verification-loading">
                            <i className="bi bi-shield-check"></i>

                            <h2>
                                Loading Verification...
                            </h2>

                            <p>
                                Please wait while we load
                                your membership information.
                            </p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // ==================================================
    // PROFILE ERROR
    // ==================================================

    if (error && !user) {
        return (
            <DashboardLayout>
                <div className="verification-page">
                    <div className="verification-shell">
                        <div className="verification-loading">
                            <i className="bi bi-exclamation-circle"></i>

                            <h2>
                                Verification Error
                            </h2>

                            <p>{error}</p>

                            <button
                                type="button"
                                className="verification-primary-btn"
                                onClick={() =>
                                    navigate("/my-profile")
                                }
                            >
                                Back to My Profile
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // ==================================================
    // MAIN PAGE
    // ==================================================

    return (
        <DashboardLayout>
            <div className="verification-page">
                <div className="verification-shell">

                    {/* HEADER */}
                    <div className="verification-header">
                        <div>
                            <div className="verification-eyebrow">
                                ACCOUNT VERIFICATION
                            </div>

                            <div className="verification-title-row">
                                <span className="verification-title-icon">
                                    <i className="bi bi-shield-check"></i>
                                </span>

                                <div>
                                    <h1 className="dba-page-title">
                                        Verify Your Account
                                    </h1>

                                    <p className="dba-page-sub">
                                        Complete your professional
                                        verification to secure your
                                        District Bar Association
                                        membership.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="verification-back-btn"
                            onClick={() =>
                                navigate("/my-profile")
                            }
                        >
                            <i className="bi bi-arrow-left"></i>
                            My Profile
                        </button>
                    </div>

                    {/* PROGRESS */}
                    <div className="verification-progress-card">
                        <div className="verification-progress-top">
                            <span>
                                Verification Progress
                            </span>

                            <strong>
                                Step {currentStep} of{" "}
                                {STEPS.length}
                            </strong>
                        </div>

                        <div className="verification-progress-track">
                            <div
                                className="verification-progress-fill"
                                style={{
                                    width: `${progress}%`,
                                }}
                            ></div>
                        </div>

                        <div className="verification-steps">
                            {STEPS.map((step) => (
                                <button
                                    type="button"
                                    key={step.number}
                                    className={`verification-step ${currentStep ===
                                            step.number
                                            ? "active"
                                            : currentStep >
                                                step.number
                                                ? "completed"
                                                : ""
                                        }`}
                                    onClick={() => {
                                        if (
                                            step.number <
                                            currentStep
                                        ) {
                                            setError("");
                                            setSuccess("");

                                            setCurrentStep(
                                                step.number
                                            );
                                        }
                                    }}
                                    disabled={
                                        step.number >
                                        currentStep
                                    }
                                >
                                    <span className="verification-step-icon">
                                        <i
                                            className={`bi ${currentStep >
                                                    step.number
                                                    ? "bi-check-lg"
                                                    : step.icon
                                                }`}
                                        ></i>
                                    </span>

                                    <span className="verification-step-text">
                                        <small>
                                            Step{" "}
                                            {step.number}
                                        </small>

                                        <strong>
                                            {step.title}
                                        </strong>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ERROR */}
                    {error && (
                        <div className="verification-alert verification-alert-error">
                            <i className="bi bi-exclamation-circle"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* SUCCESS */}
                    {success && (
                        <div className="verification-alert verification-alert-success">
                            <i className="bi bi-check-circle"></i>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* MAIN CARD */}
                    <section className="verification-card">

                        {/* STEP 1 */}
                        {currentStep === 1 && (
                            <div className="verification-section">
                                <div className="verification-section-heading">
                                    <div>
                                        <span>
                                            STEP 01
                                        </span>

                                        <h2>
                                            Personal Information
                                        </h2>

                                        <p>
                                            Confirm the personal
                                            information linked
                                            to your member
                                            account.
                                        </p>
                                    </div>

                                    <i className="bi bi-person-badge"></i>
                                </div>

                                <div className="verification-form-grid">

                                    <div className="verification-field full">
                                        <label>
                                            Full Name *
                                        </label>

                                        <input
                                            type="text"
                                            name="fullName"
                                            value={
                                                formData.fullName
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div className="verification-field">
                                        <label>
                                            Email Address *
                                        </label>

                                        <input
                                            type="email"
                                            name="email"
                                            value={
                                                formData.email
                                            }
                                            readOnly
                                            aria-readonly="true"
                                            className="verification-readonly"
                                        />

                                        <small className="verification-field-note">
                                            This email is linked
                                            to your login account
                                            and cannot be changed.
                                        </small>
                                    </div>

                                    <div className="verification-field">
                                        <label>
                                            Phone Number *
                                        </label>

                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={
                                                formData.phoneNumber
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="03XX XXXXXXX"
                                        />
                                    </div>

                                    <div className="verification-field full">
                                        <label>
                                            CNIC Number *
                                        </label>

                                        <input
                                            type="text"
                                            name="cnicNumber"
                                            value={
                                                formData.cnicNumber
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="XXXXX-XXXXXXX-X"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2 */}
                        {currentStep === 2 && (
                            <div className="verification-section">
                                <div className="verification-section-heading">
                                    <div>
                                        <span>
                                            STEP 02
                                        </span>

                                        <h2>
                                            Professional Details
                                        </h2>

                                        <p>
                                            Confirm your legal
                                            practice and Bar
                                            Association information.
                                        </p>
                                    </div>

                                    <i className="bi bi-briefcase"></i>
                                </div>

                                <div className="verification-form-grid">

                                    <div className="verification-field">
                                        <label>
                                            Bar Registration No. *
                                        </label>

                                        <input
                                            type="text"
                                            name="barRegistrationNo"
                                            value={
                                                formData.barRegistrationNo
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter registration number"
                                        />
                                    </div>

                                    <div className="verification-field">
                                        <label>
                                            License Number *
                                        </label>

                                        <input
                                            type="text"
                                            name="licenseNumber"
                                            value={
                                                formData.licenseNumber
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter license number"
                                        />
                                    </div>

                                    <div className="verification-field">
                                        <label>
                                            Bar Association *
                                        </label>

                                        <input
                                            type="text"
                                            name="barAssociation"
                                            value={
                                                formData.barAssociation
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />
                                    </div>

                                    <div className="verification-field">
                                        <label>
                                            Practice Area
                                        </label>

                                        <input
                                            type="text"
                                            name="practiceArea"
                                            value={
                                                formData.practiceArea
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="e.g. Civil, Criminal, Corporate"
                                        />
                                    </div>

                                    <div className="verification-field">
                                        <label>
                                            Years of Practice
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            name="yearsOfPractice"
                                            value={
                                                formData.yearsOfPractice
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="verification-field">
                                        <label>
                                            Chamber Address
                                        </label>

                                        <input
                                            type="text"
                                            name="chamberAddress"
                                            value={
                                                formData.chamberAddress
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter chamber address"
                                        />
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* STEP 3 */}
                        {currentStep === 3 && (
                            <div className="verification-section">
                                <div className="verification-section-heading">
                                    <div>
                                        <span>
                                            STEP 03
                                        </span>

                                        <h2>
                                            Document Verification
                                        </h2>

                                        <p>
                                            Upload clear documents
                                            for administrative
                                            verification. Maximum
                                            5 MB per file.
                                        </p>
                                    </div>

                                    <i className="bi bi-file-earmark-check"></i>
                                </div>

                                <div className="verification-files-grid">

                                    {renderFileBox(
                                        "cnicFront",
                                        "CNIC Front",
                                        "Clear front side of your CNIC"
                                    )}

                                    {renderFileBox(
                                        "cnicBack",
                                        "CNIC Back",
                                        "Clear back side of your CNIC"
                                    )}

                                    {renderFileBox(
                                        "license",
                                        "Lawyer License",
                                        "Valid professional license"
                                    )}

                                    {renderFileBox(
                                        "barCard",
                                        "Bar Registration Card",
                                        "Current Bar Association card"
                                    )}

                                    {renderFileBox(
                                        "additionalDocument",
                                        "Additional Document",
                                        "Any supporting document if required",
                                        false
                                    )}

                                </div>
                            </div>
                        )}

                        {/* STEP 4 */}
                        {currentStep === 4 && (
                            <div className="verification-section">
                                <div className="verification-section-heading">
                                    <div>
                                        <span>
                                            STEP 04
                                        </span>

                                        <h2>
                                            Review & Submit
                                        </h2>

                                        <p>
                                            Review your information
                                            before sending your
                                            verification request.
                                        </p>
                                    </div>

                                    <i className="bi bi-clipboard-check"></i>
                                </div>

                                {submitted ? (
                                    <div className="verification-submitted">

                                        <div className="verification-submitted-icon">
                                            <i className="bi bi-check-lg"></i>
                                        </div>

                                        <h3>
                                            Verification Request Submitted
                                        </h3>

                                        <p>
                                            Your verification request
                                            has been submitted successfully
                                            and is now pending administrative
                                            review. The verification email
                                            is locked to your logged-in
                                            account email.
                                        </p>

                                        <button
                                            type="button"
                                            className="verification-primary-btn"
                                            onClick={() =>
                                                navigate(
                                                    "/my-profile"
                                                )
                                            }
                                        >
                                            Return to My Profile
                                        </button>

                                    </div>
                                ) : (
                                    <>
                                        <div className="verification-review-grid">

                                            <div className="verification-review-card">
                                                <div className="verification-review-card-heading">
                                                    <i className="bi bi-person"></i>

                                                    <strong>
                                                        Personal Information
                                                    </strong>
                                                </div>

                                                <p>
                                                    <span>
                                                        Name
                                                    </span>

                                                    <strong>
                                                        {formData.fullName ||
                                                            "N/A"}
                                                    </strong>
                                                </p>

                                                <p>
                                                    <span>
                                                        Email
                                                    </span>

                                                    <strong>
                                                        {formData.email ||
                                                            "N/A"}
                                                    </strong>
                                                </p>

                                                <p>
                                                    <span>
                                                        Phone
                                                    </span>

                                                    <strong>
                                                        {formData.phoneNumber ||
                                                            "N/A"}
                                                    </strong>
                                                </p>

                                                <p>
                                                    <span>
                                                        CNIC
                                                    </span>

                                                    <strong>
                                                        {formData.cnicNumber ||
                                                            "N/A"}
                                                    </strong>
                                                </p>
                                            </div>

                                            <div className="verification-review-card">
                                                <div className="verification-review-card-heading">
                                                    <i className="bi bi-briefcase"></i>

                                                    <strong>
                                                        Professional Details
                                                    </strong>
                                                </div>

                                                <p>
                                                    <span>
                                                        Bar Registration
                                                    </span>

                                                    <strong>
                                                        {formData.barRegistrationNo ||
                                                            "N/A"}
                                                    </strong>
                                                </p>

                                                <p>
                                                    <span>
                                                        License
                                                    </span>

                                                    <strong>
                                                        {formData.licenseNumber ||
                                                            "N/A"}
                                                    </strong>
                                                </p>

                                                <p>
                                                    <span>
                                                        Bar Association
                                                    </span>

                                                    <strong>
                                                        {formData.barAssociation ||
                                                            "N/A"}
                                                    </strong>
                                                </p>

                                                <p>
                                                    <span>
                                                        Practice Area
                                                    </span>

                                                    <strong>
                                                        {formData.practiceArea ||
                                                            "N/A"}
                                                    </strong>
                                                </p>
                                            </div>

                                        </div>

                                        <div className="verification-review-documents">

                                            <div className="verification-review-card-heading">
                                                <i className="bi bi-file-earmark-check"></i>

                                                <strong>
                                                    Documents
                                                </strong>
                                            </div>

                                            <div className="verification-review-files">

                                                {Object.entries(
                                                    files
                                                ).map(
                                                    ([
                                                        key,
                                                        file,
                                                    ]) => (
                                                        <div
                                                            key={
                                                                key
                                                            }
                                                            className="verification-review-file"
                                                        >
                                                            <i
                                                                className={`bi ${file
                                                                        ? "bi-check-circle-fill"
                                                                        : "bi-x-circle"
                                                                    }`}
                                                            ></i>

                                                            <span>
                                                                {key ===
                                                                    "cnicFront" &&
                                                                    "CNIC Front"}

                                                                {key ===
                                                                    "cnicBack" &&
                                                                    "CNIC Back"}

                                                                {key ===
                                                                    "license" &&
                                                                    "Lawyer License"}

                                                                {key ===
                                                                    "barCard" &&
                                                                    "Bar Registration Card"}

                                                                {key ===
                                                                    "additionalDocument" &&
                                                                    "Additional Document"}
                                                            </span>

                                                            <small>
                                                                {file?.name ||
                                                                    "Not selected"}
                                                            </small>
                                                        </div>
                                                    )
                                                )}

                                            </div>
                                        </div>

                                        <div className="verification-review-note">
                                            <i className="bi bi-info-circle"></i>

                                            <p>
                                                Please make sure all
                                                information and documents
                                                are accurate. Your documents
                                                should be clear and readable
                                                for the Bar Association
                                                administration.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ACTIONS */}
                        {!submitted && (
                            <div className="verification-actions">

                                <button
                                    type="button"
                                    className="verification-secondary-btn"
                                    onClick={
                                        currentStep === 1
                                            ? () =>
                                                navigate(
                                                    "/my-profile"
                                                )
                                            : goBack
                                    }
                                >
                                    <i className="bi bi-arrow-left"></i>

                                    {currentStep === 1
                                        ? "Cancel"
                                        : "Previous"}
                                </button>

                                {currentStep <
                                    STEPS.length ? (
                                    <button
                                        type="button"
                                        className="verification-primary-btn"
                                        onClick={goNext}
                                    >
                                        Continue

                                        <i className="bi bi-arrow-right"></i>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="verification-primary-btn"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <i className="bi bi-arrow-repeat"></i>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Submit Verification Request

                                                <i className="bi bi-shield-check"></i>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                    </section>

                    {/* SECURITY NOTE */}
                    <div className="verification-security-note">
                        <i className="bi bi-shield-lock"></i>

                        <div>
                            <strong>
                                Your information is protected
                            </strong>

                            <span>
                                Verification documents are intended
                                only for authorized District Bar
                                Association administration.
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}

export default Verification;