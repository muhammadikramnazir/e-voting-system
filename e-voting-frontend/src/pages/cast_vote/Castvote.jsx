import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import DashboardLayout from "../../components/dashboardLayout/DashboardLayout";
import LahoreHighCourt from "../../assets/Lahore-High-Court.jpg";

import {
    getElectionById,
    getElectionCandidates,
    castVote,
} from "../../apis/authapi";

import "./Castvote.css";

const steps = [
    "Select Position",
    "Choose Candidate",
    "Review",
    "Confirm",
];

const API_ORIGIN =
    (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/api\/v1\/?$/, "");

function CastVote() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const topRef = useRef(null);

    const electionId = searchParams.get("electionId");

    const [step, setStep] = useState(1);

    const [election, setElection] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [positions, setPositions] = useState([]);

    const [selectedPositionId, setSelectedPositionId] = useState(null);
    const [selected, setSelected] = useState(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /*
    ============================================================
    SCROLL TO TOP
    ============================================================
    Whenever:
    - step changes
    - error appears
    - success appears

    scrollIntoView is used instead of only window.scrollTo()
    so it also works when DashboardLayout has a scroll container.
    ============================================================
    */
    useEffect(() => {
        requestAnimationFrame(() => {
            if (topRef.current) {
                topRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            } else {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });
            }
        });
    }, [step, error, success]);

    /*
    ============================================================
    LOAD ELECTION + CANDIDATES
    ============================================================
    */
    useEffect(() => {
        const loadElectionData = async () => {
            try {
                setLoading(true);
                setError("");
                setSuccess("");

                const token =
                    localStorage.getItem("token") ||
                    sessionStorage.getItem("token");

                if (!token) {
                    navigate("/login");
                    return;
                }

                if (!electionId) {
                    setError("Election ID is missing.");
                    return;
                }

                const electionResponse = await getElectionById(
                    token,
                    electionId
                );

                const electionData =
                    electionResponse?.election ||
                    electionResponse?.data?.election ||
                    electionResponse?.data ||
                    electionResponse;

                if (!electionData) {
                    setError("Election information could not be loaded.");
                    return;
                }

                setElection(electionData);

                const candidateResponse =
                    await getElectionCandidates(
                        token,
                        electionId
                    );

                const candidateData =
                    candidateResponse?.candidates ||
                    candidateResponse?.data?.candidates ||
                    candidateResponse?.data ||
                    [];

                const normalizedCandidates = Array.isArray(candidateData)
                    ? candidateData
                    : [];

                setCandidates(normalizedCandidates);

                /*
                ------------------------------------------------
                BUILD POSITIONS
                ------------------------------------------------
                */
                let normalizedPositions = [];

                if (Array.isArray(electionData.positions)) {
                    normalizedPositions = electionData.positions.map(
                        (position) => ({
                            id:
                                position.id ??
                                position.position_id ??
                                position.positionId,

                            name:
                                position.name ||
                                position.position_name ||
                                position.positionName ||
                                "Position",
                        })
                    );
                }

                /*
                If election.positions is not available,
                create positions from candidates.
                */
                if (normalizedPositions.length === 0) {
                    const positionMap = new Map();

                    normalizedCandidates.forEach((candidate) => {
                        const positionId =
                            candidate.position_id ??
                            candidate.positionId;

                        const positionName =
                            candidate.position_name ||
                            candidate.positionName ||
                            candidate.position ||
                            "Position";

                        if (
                            positionId !== undefined &&
                            positionId !== null &&
                            !positionMap.has(String(positionId))
                        ) {
                            positionMap.set(String(positionId), {
                                id: positionId,
                                name: positionName,
                            });
                        }
                    });

                    normalizedPositions = Array.from(
                        positionMap.values()
                    );
                }

                setPositions(normalizedPositions);

                /*
                Select first position automatically.
                */
                if (normalizedPositions.length > 0) {
                    setSelectedPositionId(
                        normalizedPositions[0].id
                    );
                }

                /*
                Select first candidate for first position.
                */
                if (normalizedCandidates.length > 0) {
                    const firstPositionId =
                        normalizedPositions.length > 0
                            ? normalizedPositions[0].id
                            : null;

                    const firstCandidate =
                        normalizedCandidates.find(
                            (candidate) =>
                                String(
                                    candidate.position_id ??
                                    candidate.positionId
                                ) === String(firstPositionId)
                        ) ||
                        normalizedCandidates[0];

                    setSelected(firstCandidate?.id ?? null);
                }
            } catch (err) {
                console.error(
                    "CAST VOTE LOAD ERROR:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to load election information."
                );
            } finally {
                setLoading(false);
            }
        };

        loadElectionData();
    }, [electionId, navigate]);

    /*
    ============================================================
    POSITION CANDIDATES
    ============================================================
    */
    const positionCandidates = candidates.filter(
        (candidate) =>
            String(
                candidate.position_id ??
                candidate.positionId
            ) === String(selectedPositionId)
    );

    /*
    ============================================================
    POSITION CHANGE
    ============================================================
    */
    const handlePositionChange = (positionId) => {
        setSelectedPositionId(positionId);
        setSelected(null);
        setError("");
        setSuccess("");

        const candidatesForPosition = candidates.filter(
            (candidate) =>
                String(
                    candidate.position_id ??
                    candidate.positionId
                ) === String(positionId)
        );

        if (candidatesForPosition.length > 0) {
            setSelected(
                candidatesForPosition[0].id
            );
        }

        setStep(2);
    };

    /*
    ============================================================
    NEXT
    ============================================================
    */
    const next = () => {
        setError("");
        setSuccess("");

        if (step === 1) {
            if (!selectedPositionId) {
                setError("Please select a position first.");
                return;
            }

            setStep(2);
            return;
        }

        if (step === 2) {
            if (!selected) {
                setError("Please select a candidate first.");
                return;
            }

            setStep(3);
            return;
        }

        if (step === 3) {
            if (!selectedPositionId || !selected) {
                setError(
                    "Please select a position and candidate."
                );
                return;
            }

            setStep(4);
            return;
        }

        /*
        Step 4 → submit vote
        */
        submitVote();
    };

    /*
    ============================================================
    PREVIOUS
    ============================================================
    */
    const previous = () => {
        setError("");
        setSuccess("");

        if (step > 1) {
            setStep(step - 1);
        } else {
            navigate("/elections");
        }
    };

    /*
    ============================================================
    SUBMIT VOTE
    ============================================================
    */
    const submitVote = async () => {
        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            const token =
                localStorage.getItem("token") ||
                sessionStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            if (!electionId) {
                setError("Election ID is missing.");
                return;
            }

            if (!selectedPositionId) {
                setError("Please select a position.");
                return;
            }

            if (!selected) {
                setError("Please select a candidate.");
                return;
            }

            const response = await castVote(
                token,
                electionId,
                selectedPositionId,
                selected
            );

            if (response?.status === false) {
                setError(
                    response?.message ||
                    "Unable to cast your vote."
                );
                return;
            }

            setSuccess(
                response?.message ||
                "Your vote has been cast successfully."
            );
        } catch (err) {
            console.error(
                "CAST VOTE ERROR:",
                err
            );

            setError(
                err?.message ||
                "Unable to cast your vote."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /*
    ============================================================
    FIND SELECTED DATA
    ============================================================
    */
    const selectedCandidate =
        candidates.find(
            (candidate) =>
                String(candidate.id) ===
                String(selected)
        ) || null;

    const selectedPosition =
        positions.find(
            (position) =>
                String(position.id) ===
                String(selectedPositionId)
        ) || null;

    /*
    ============================================================
    CANDIDATE IMAGE
    ============================================================
    */
    const getCandidatePhoto = (candidate) => {
        if (!candidate?.photo) {
            return "/images/topbarprofile.jpg";
        }

        if (
            candidate.photo.startsWith("http://") ||
            candidate.photo.startsWith("https://")
        ) {
            return candidate.photo;
        }

        return `${API_ORIGIN}/uploads/${candidate.photo}`;
    };

    /*
    ============================================================
    ELECTION DATE
    ============================================================
    */
    const electionDate = election?.start_at
        ? new Date(election.start_at)
        : null;

    const formattedMonth = electionDate
        ? electionDate
            .toLocaleString("en-US", {
                month: "short",
            })
            .toUpperCase()
        : "---";

    const formattedDay = electionDate
        ? electionDate.getDate()
        : "--";

    const formattedYear = electionDate
        ? electionDate.getFullYear()
        : "----";

    /*
    ============================================================
    SUCCESS SCREEN
    ============================================================
    */
    if (success) {
        return (
            <DashboardLayout>
                <div ref={topRef}>
                    <section
                        className="cv-hero"
                        style={{
                            backgroundImage: `url(${LahoreHighCourt})`,
                        }}
                    >
                        <div className="cv-hero-overlay"></div>

                        <div className="cv-hero-content">
                            <div>
                                <span className="cv-hero-label">
                                    DISTRICT BAR ASSOCIATION
                                </span>

                                <h1>
                                    Vote Submitted
                                </h1>

                                <h2>
                                    Thank You for Participating
                                </h2>

                                <p>
                                    Your vote has been recorded
                                    successfully.
                                </p>
                            </div>

                            <div className="cv-hero-quote">
                                <span>“Together</span>
                                <span>for a Fairer</span>
                                <span>Tomorrow”</span>
                            </div>
                        </div>
                    </section>

                    <div
                        style={{
                            minHeight: "400px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            padding: "60px 20px",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "70px",
                                    marginBottom: "20px",
                                }}
                            >
                                <i className="bi bi-check-circle-fill"></i>
                            </div>

                            <h2>
                                Vote Cast Successfully
                            </h2>

                            <p>
                                Your vote has been securely
                                recorded.
                            </p>

                            <button
                                type="button"
                                className="cv-next"
                                onClick={() =>
                                    navigate("/results")
                                }
                            >
                                Continue
                                <i className="bi bi-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div ref={topRef}>

                {/* =====================================================
                    HERO
                ===================================================== */}
                <section
                    className="cv-hero"
                    style={{
                        backgroundImage: `url(${LahoreHighCourt})`,
                    }}
                >
                    <div className="cv-hero-overlay"></div>

                    <div className="cv-hero-content">
                        <div>
                            <span className="cv-hero-label">
                                DISTRICT BAR ASSOCIATION
                            </span>

                            <h1>
                                Cast Your Vote
                            </h1>

                            <h2>
                                Your Voice Shapes a Stronger Tomorrow
                            </h2>

                            <p>
                                Choose your trusted representative
                                for a better tomorrow.
                            </p>
                        </div>

                        <div className="cv-hero-quote">
                            <span>“Together</span>
                            <span>for a Fairer</span>
                            <span>Tomorrow”</span>
                        </div>
                    </div>
                </section>

                {/* =====================================================
                    PAGE INTRO
                ===================================================== */}
                <div className="cv-page-intro">
                    <div>
                        <h1 className="dba-page-title">
                            Cast Your Vote
                        </h1>

                        <p className="dba-page-sub">
                            Choose your trusted representative
                            for a better tomorrow.
                        </p>
                    </div>
                </div>

                {/* =====================================================
                    ERROR NOTICE
                ===================================================== */}
                {error && (
                    <div
                        style={{
                            margin: "20px auto",
                            maxWidth: "1200px",
                            padding: "15px 20px",
                            borderRadius: "10px",
                            border: "1px solid #dc3545",
                            background: "#fff5f5",
                            color: "#b02a37",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                        }}
                    >
                        <i className="bi bi-exclamation-triangle-fill"></i>

                        <strong>
                            {error}
                        </strong>
                    </div>
                )}

                {/* =====================================================
                    STEPS
                ===================================================== */}
                <div className="cv-steps">
                    {steps.map((label, index) => {
                        const number = index + 1;
                        const active = step === number;
                        const completed = step > number;

                        return (
                            <div
                                className={`cv-step ${active ? "active" : ""
                                    } ${completed
                                        ? "completed"
                                        : ""
                                    }`}
                                key={label}
                            >
                                <div className="cv-step-line-wrap">
                                    <span className="cv-step-number">
                                        {completed ? (
                                            <i className="bi bi-check-lg"></i>
                                        ) : (
                                            number
                                        )}
                                    </span>

                                    {index <
                                        steps.length - 1 && (
                                            <span
                                                className={`cv-step-line ${step > number
                                                        ? "completed"
                                                        : ""
                                                    }`}
                                            ></span>
                                        )}
                                </div>

                                <small>
                                    {label}
                                </small>
                            </div>
                        );
                    })}
                </div>

                {/* =====================================================
                    LOADING
                ===================================================== */}
                {loading ? (
                    <div
                        style={{
                            minHeight: "400px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            gap: "15px",
                        }}
                    >
                        <div
                            className="spinner-border"
                            role="status"
                        ></div>

                        <p>
                            Loading election information...
                        </p>
                    </div>
                ) : (
                    <>
                        {/* =================================================
                            ELECTION INFORMATION
                        ================================================= */}
                        <section className="cv-election-card">
                            <div className="cv-election-date">
                                <span>
                                    {formattedMonth}
                                </span>

                                <strong>
                                    {formattedDay}
                                </strong>

                                <small>
                                    {formattedYear}
                                </small>
                            </div>

                            <div className="cv-election-info">
                                <h2>
                                    {election?.title ||
                                        "Election"}
                                </h2>

                                <p>
                                    {election?.description ||
                                        "District Bar Association Election"}
                                </p>

                                <div className="cv-election-meta">
                                    <span>
                                        <i className="bi bi-people-fill"></i>

                                        {candidates.length}{" "}
                                        Candidates
                                    </span>

                                    <span>
                                        <i className="bi bi-shield-check"></i>

                                        Secure Voting
                                    </span>
                                </div>
                            </div>

                            <div className="cv-vote-matters">
                                <div className="cv-vote-icon">
                                    <i className="bi bi-hammer"></i>
                                </div>

                                <div>
                                    <strong>
                                        Your Vote Matters
                                    </strong>

                                    <small>
                                        A Stronger Bar, A Brighter Tomorrow
                                    </small>
                                </div>
                            </div>
                        </section>

                        {/* =================================================
                            STEP 1
                        ================================================= */}
                        {step === 1 && (
                            <section className="cv-candidates-section">
                                <div className="cv-section-heading">
                                    <div>
                                        <h2>
                                            Select Position
                                        </h2>

                                        <p>
                                            Select the position
                                            you want to vote for.
                                        </p>
                                    </div>

                                    <span className="cv-selected-status">
                                        <i className="bi bi-shield-check"></i>
                                        Secure Voting
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(auto-fit, minmax(220px, 1fr))",
                                        gap: "20px",
                                    }}
                                >
                                    {positions.map(
                                        (position) => (
                                            <button
                                                type="button"
                                                key={position.id}
                                                onClick={() =>
                                                    handlePositionChange(
                                                        position.id
                                                    )
                                                }
                                                style={{
                                                    padding:
                                                        "25px",
                                                    border:
                                                        selectedPositionId ===
                                                            position.id
                                                            ? "2px solid currentColor"
                                                            : "1px solid #ddd",
                                                    borderRadius:
                                                        "12px",
                                                    background:
                                                        "white",
                                                    cursor:
                                                        "pointer",
                                                    textAlign:
                                                        "left",
                                                }}
                                            >
                                                <strong>
                                                    {
                                                        position.name
                                                    }
                                                </strong>

                                                <div
                                                    style={{
                                                        marginTop:
                                                            "8px",
                                                        fontSize:
                                                            "14px",
                                                    }}
                                                >
                                                    Select this
                                                    position
                                                </div>
                                            </button>
                                        )
                                    )}
                                </div>
                            </section>
                        )}

                        {/* =================================================
                            STEP 2
                        ================================================= */}
                        {step === 2 && (
                            <section className="cv-candidates-section">
                                <div className="cv-section-heading">
                                    <div>
                                        <h2>
                                            Choose Your Candidate
                                        </h2>

                                        <p>
                                            Select one candidate
                                            to continue with
                                            your vote.
                                        </p>
                                    </div>

                                    <span className="cv-selected-status">
                                        <i className="bi bi-shield-check"></i>
                                        Secure Voting
                                    </span>
                                </div>

                                {positions.length > 0 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            flexWrap: "wrap",
                                            marginBottom:
                                                "25px",
                                        }}
                                    >
                                        {positions.map(
                                            (position) => (
                                                <button
                                                    type="button"
                                                    key={
                                                        position.id
                                                    }
                                                    onClick={() =>
                                                        handlePositionChange(
                                                            position.id
                                                        )
                                                    }
                                                    style={{
                                                        padding:
                                                            "8px 16px",
                                                        borderRadius:
                                                            "20px",
                                                        border:
                                                            selectedPositionId ===
                                                                position.id
                                                                ? "2px solid currentColor"
                                                                : "1px solid #ddd",
                                                        background:
                                                            "white",
                                                        cursor:
                                                            "pointer",
                                                    }}
                                                >
                                                    {
                                                        position.name
                                                    }
                                                </button>
                                            )
                                        )}
                                    </div>
                                )}

                                <div className="cv-grid">
                                    {positionCandidates.map(
                                        (candidate) => {
                                            const isSelected =
                                                String(
                                                    selected
                                                ) ===
                                                String(
                                                    candidate.id
                                                );

                                            return (
                                                <article
                                                    className={`cv-card ${isSelected
                                                            ? "selected"
                                                            : ""
                                                        }`}
                                                    key={
                                                        candidate.id
                                                    }
                                                    onClick={() =>
                                                        setSelected(
                                                            candidate.id
                                                        )
                                                    }
                                                >
                                                    <div className="cv-photo">
                                                        <img
                                                            src={getCandidatePhoto(
                                                                candidate
                                                            )}
                                                            alt={
                                                                candidate.name
                                                            }
                                                        />

                                                        <div className="cv-photo-overlay"></div>

                                                        <span className="cv-award">
                                                            <i className="bi bi-award-fill"></i>
                                                        </span>

                                                        {isSelected && (
                                                            <span className="cv-selected-icon">
                                                                <i className="bi bi-check-lg"></i>
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="cv-card-content">
                                                        <h3>
                                                            {
                                                                candidate.name
                                                            }
                                                        </h3>

                                                        <p className="cv-candidate-role">
                                                            {candidate.role ||
                                                                candidate.designation ||
                                                                "Lawyer"}
                                                        </p>

                                                        <blockquote>
                                                            “
                                                            {candidate.manifesto ||
                                                                candidate.nomination ||
                                                                "Candidate for the District Bar Association election."}
                                                            ”
                                                        </blockquote>

                                                        <button
                                                            type="button"
                                                            className={`cv-select-button ${isSelected
                                                                    ? "selected"
                                                                    : ""
                                                                }`}
                                                            onClick={(
                                                                event
                                                            ) => {
                                                                event.stopPropagation();

                                                                setSelected(
                                                                    candidate.id
                                                                );
                                                            }}
                                                        >
                                                            <i
                                                                className={`bi ${isSelected
                                                                        ? "bi-check-circle-fill"
                                                                        : "bi-circle"
                                                                    }`}
                                                            ></i>

                                                            {isSelected
                                                                ? "Selected"
                                                                : "Select Vote"}
                                                        </button>
                                                    </div>
                                                </article>
                                            );
                                        }
                                    )}
                                </div>

                                {positionCandidates.length ===
                                    0 && (
                                        <div
                                            style={{
                                                textAlign:
                                                    "center",
                                                padding:
                                                    "50px 20px",
                                            }}
                                        >
                                            <i className="bi bi-person-x"></i>

                                            <h3>
                                                No candidates
                                                available
                                            </h3>

                                            <p>
                                                There are no approved
                                                candidates for this
                                                position.
                                            </p>
                                        </div>
                                    )}
                            </section>
                        )}

                        {/* =================================================
                            STEP 3
                        ================================================= */}
                        {step === 3 && (
                            <section className="cv-candidates-section">
                                <div className="cv-section-heading">
                                    <div>
                                        <h2>
                                            Review Your Vote
                                        </h2>

                                        <p>
                                            Please review your
                                            selection before
                                            continuing.
                                        </p>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        maxWidth: "700px",
                                        margin: "0 auto",
                                        textAlign: "center",
                                    }}
                                >
                                    {selectedCandidate && (
                                        <>
                                            <img
                                                src={getCandidatePhoto(
                                                    selectedCandidate
                                                )}
                                                alt={
                                                    selectedCandidate.name
                                                }
                                                style={{
                                                    width: "160px",
                                                    height: "160px",
                                                    objectFit:
                                                        "cover",
                                                    borderRadius:
                                                        "50%",
                                                    marginBottom:
                                                        "20px",
                                                }}
                                            />

                                            <h2>
                                                {
                                                    selectedCandidate.name
                                                }
                                            </h2>

                                            <p>
                                                <strong>
                                                    Position:
                                                </strong>{" "}
                                                {selectedPosition?.name ||
                                                    "Position"}
                                            </p>

                                            <p>
                                                Your vote will
                                                be submitted for
                                                this candidate.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* =================================================
                            STEP 4
                        ================================================= */}
                        {step === 4 && (
                            <section className="cv-candidates-section">
                                <div className="cv-section-heading">
                                    <div>
                                        <h2>
                                            Confirm Your Vote
                                        </h2>

                                        <p>
                                            Please confirm that
                                            you want to cast this
                                            vote.
                                        </p>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        maxWidth: "700px",
                                        margin: "0 auto",
                                        padding: "30px",
                                        textAlign: "center",
                                    }}
                                >
                                    <i
                                        className="bi bi-shield-check"
                                        style={{
                                            fontSize:
                                                "60px",
                                        }}
                                    ></i>

                                    <h2>
                                        {
                                            selectedCandidate?.name
                                        }
                                    </h2>

                                    <p>
                                        Position:{" "}
                                        <strong>
                                            {
                                                selectedPosition?.name
                                            }
                                        </strong>
                                    </p>

                                    <p>
                                        Click{" "}
                                        <strong>
                                            Confirm & Cast Vote
                                        </strong>{" "}
                                        below to submit your
                                        vote.
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* =================================================
                            ACTION BUTTONS
                        ================================================= */}
                        <div className="cv-footer">
                            <button
                                type="button"
                                className="cv-previous"
                                onClick={previous}
                                disabled={submitting}
                            >
                                <i className="bi bi-arrow-left"></i>

                                Previous
                            </button>

                            <button
                                type="button"
                                className="cv-next"
                                onClick={next}
                                disabled={
                                    loading ||
                                    submitting ||
                                    (step === 1 &&
                                        !selectedPositionId) ||
                                    (step === 2 &&
                                        !selected)
                                }
                            >
                                {submitting ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm"
                                            role="status"
                                        ></span>

                                        Submitting...
                                    </>
                                ) : step === 4 ? (
                                    <>
                                        Confirm & Cast Vote
                                        <i className="bi bi-check-lg"></i>
                                    </>
                                ) : (
                                    <>
                                        Next Step
                                        <i className="bi bi-arrow-right"></i>
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* =====================================================
                    BOTTOM BANNER
                ===================================================== */}
                <section
                    className="cv-bottom-banner"
                    style={{
                        backgroundImage: `url(${LahoreHighCourt})`,
                    }}
                >
                    <div className="cv-bottom-overlay"></div>

                    <div className="cv-bottom-content">
                        <div className="cv-bottom-message">
                            <span className="cv-bottom-quote">
                                “
                            </span>

                            <div>
                                <h2>
                                    Your Vote Today
                                    <br />
                                    Builds a Stronger Tomorrow
                                </h2>

                                <p>
                                    District Bar Association
                                </p>
                            </div>
                        </div>

                        <div className="cv-bottom-features">
                            <div className="cv-feature">
                                <i className="bi bi-shield-check"></i>

                                <strong>
                                    Fair Process
                                </strong>

                                <span>
                                    Transparent Elections
                                </span>
                            </div>

                            <div className="cv-feature">
                                <i className="bi bi-people"></i>

                                <strong>
                                    Stronger Representation
                                </strong>

                                <span>
                                    A United Bar
                                </span>
                            </div>

                            <div className="cv-feature">
                                <i className="bi bi-bank"></i>

                                <strong>
                                    Better Tomorrow
                                </strong>

                                <span>
                                    For Our Community
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

export default CastVote;