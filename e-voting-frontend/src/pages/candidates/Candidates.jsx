import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/dashboardLayout/DashboardLayout";
import LahoreHighCourt from "../../assets/Lahore-High-Court.jpg";

import {
    getElections,
    getElectionCandidates,
} from "../../apis/authapi";

import "./Candidates.css";

/*
============================================================
CANDIDATE CARD
============================================================
*/

const API_ORIGIN =
    (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/api\/v1\/?$/, "");

function CandidateCard({
    candidate,
    onViewProfile,
    onViewManifesto,
}) {
    const getCandidatePhoto = () => {
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

    return (
        <article className="cd-card">

            <div className="cd-photo-wrap">
                <img
                    src={getCandidatePhoto()}
                    alt={candidate.name || "Candidate"}
                    className="cd-photo"
                />

                <div className="cd-photo-overlay"></div>

                <span className="cd-award">
                    <i className="bi bi-award-fill"></i>
                </span>

                <span className="cd-candidate-label">
                    Candidate
                </span>
            </div>

            <div className="cd-info">

                <div className="cd-name-row">
                    <div>
                        <h3>
                            {candidate.name || "Candidate"}
                        </h3>

                        <p className="cd-role">
                            {candidate.role ||
                                candidate.designation ||
                                "Lawyer"}
                        </p>
                    </div>

                    <span className="cd-verified">
                        <i className="bi bi-patch-check-fill"></i>
                    </span>
                </div>

                <div className="cd-quote-box">
                    <i className="bi bi-quote"></i>

                    <p>
                        {candidate.manifesto ||
                            candidate.nomination ||
                            "Approved candidate for the District Bar Association election."}
                    </p>
                </div>

                <div className="cd-meta">

                    <span>
                        <i className="bi bi-shield-check"></i>
                        Verified Candidate
                    </span>

                    <span>
                        <i className="bi bi-person-badge"></i>
                        {candidate.position_name ||
                            candidate.positionName ||
                            candidate.position ||
                            "Bar Association"}
                    </span>

                </div>

                <div className="cd-actions">

                    <button
                        type="button"
                        className="cd-profile-btn"
                        onClick={() =>
                            onViewProfile(candidate)
                        }
                    >
                        <i className="bi bi-person-lines-fill"></i>
                        View Profile
                    </button>

                    <button
                        type="button"
                        className="cd-manifesto-btn"
                        onClick={() =>
                            onViewManifesto(candidate)
                        }
                    >
                        <i className="bi bi-file-earmark-text-fill"></i>
                        View Manifesto
                    </button>

                </div>

            </div>

        </article>
    );
}

/*
============================================================
MAIN CANDIDATES PAGE
============================================================
*/

function Candidates() {

    const topRef = useRef(null);

    const [active, setActive] = useState(null);

    const [elections, setElections] = useState([]);
    const [election, setElection] = useState(null);

    const [candidates, setCandidates] = useState([]);
    const [positions, setPositions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedCandidate, setSelectedCandidate] =
        useState(null);

    const [candidateModal, setCandidateModal] =
        useState(null);

    /*
    ========================================================
    AUTO SCROLL
    ========================================================
    */

    useEffect(() => {

        if (!loading || error) {

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

        }

    }, [loading, error, active]);

    /*
    ========================================================
    LOAD ACTIVE ELECTION + CANDIDATES
    ========================================================
    */

    useEffect(() => {

        const loadCandidates = async () => {

            try {

                setLoading(true);
                setError("");

                const token =
                    localStorage.getItem("token") ||
                    sessionStorage.getItem("token");

                if (!token) {
                    setError(
                        "Authentication session expired. Please login again."
                    );
                    return;
                }

                /*
                ------------------------------------------------
                GET ELECTIONS
                ------------------------------------------------
                */

                const electionResponse =
                    await getElections(token);

                const electionData =
                    electionResponse?.elections ||
                    electionResponse?.data?.elections ||
                    electionResponse?.data ||
                    [];

                const electionList =
                    Array.isArray(electionData)
                        ? electionData
                        : [];

                setElections(electionList);

                /*
                ------------------------------------------------
                FIND ACTIVE ELECTION
                ------------------------------------------------
                */

                const activeElection =
                    electionList.find(
                        (item) =>
                            String(item.status || "").toLowerCase() ===
                            "active"
                    ) || electionList[0];

                if (!activeElection) {

                    setElection(null);
                    setCandidates([]);
                    setPositions([]);

                    setError(
                        "No election is currently available."
                    );

                    return;
                }

                setElection(activeElection);

                /*
                ------------------------------------------------
                GET CANDIDATES
                ------------------------------------------------
                */

                const candidateResponse =
                    await getElectionCandidates(
                        token,
                        activeElection.id
                    );

                const candidateData =
                    candidateResponse?.candidates ||
                    candidateResponse?.data?.candidates ||
                    candidateResponse?.data ||
                    [];

                const candidateList =
                    Array.isArray(candidateData)
                        ? candidateData
                        : [];

                setCandidates(candidateList);

                /*
                ------------------------------------------------
                BUILD POSITION LIST
                ------------------------------------------------
                */

                const positionMap = new Map();

                candidateList.forEach((candidate) => {

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
                        positionId !== null
                    ) {

                        const key =
                            String(positionId);

                        if (!positionMap.has(key)) {

                            positionMap.set(
                                key,
                                {
                                    id: positionId,
                                    name: positionName,
                                }
                            );

                        }

                    }

                });

                const positionList =
                    Array.from(positionMap.values());

                setPositions(positionList);

                /*
                ------------------------------------------------
                SELECT FIRST POSITION
                ------------------------------------------------
                */

                if (positionList.length > 0) {

                    setActive(
                        String(positionList[0].id)
                    );

                }

            } catch (err) {

                console.error(
                    "CANDIDATES LOAD ERROR:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to load candidates."
                );

            } finally {

                setLoading(false);

            }

        };

        loadCandidates();

    }, []);

    /*
    ========================================================
    FILTER CANDIDATES
    ========================================================
    */

    const list = candidates.filter(
        (candidate) => {

            const candidatePositionId =
                candidate.position_id ??
                candidate.positionId;

            return (
                String(candidatePositionId) ===
                String(active)
            );

        }
    );

    /*
    ========================================================
    CLOSE CANDIDATE MODAL
    ========================================================
    */

    const closeCandidateModal = () => {
        setSelectedCandidate(null);
        setCandidateModal(null);
    };

    /*
    ========================================================
    CANDIDATE PHOTO URL
    ========================================================
    */

    const getModalCandidatePhoto = () => {

        if (!selectedCandidate?.photo) {
            return "/images/topbarprofile.jpg";
        }

        if (
            selectedCandidate.photo.startsWith("http://") ||
            selectedCandidate.photo.startsWith("https://")
        ) {
            return selectedCandidate.photo;
        }

        return `${API_ORIGIN}/uploads/${selectedCandidate.photo}`;
    };

    return (
        <DashboardLayout>

            <div ref={topRef}>

                {/* =====================================================
                    HERO
                ===================================================== */}

                <section
                    className="cd-hero"
                    style={{
                        backgroundImage:
                            `url(${LahoreHighCourt})`,
                    }}
                >

                    <div className="cd-hero-overlay"></div>

                    <div className="cd-hero-content">

                        <div>

                            <span className="cd-hero-label">
                                DISTRICT BAR ASSOCIATION
                            </span>

                            <h1>
                                Meet the Candidates
                            </h1>

                            <p>
                                Know their experience, vision and commitment
                                to a stronger Bar Association.
                            </p>

                        </div>

                        <div className="cd-hero-quote">

                            <span>
                                “Leadership
                            </span>

                            <span>
                                Through
                            </span>

                            <span>
                                Service”
                            </span>

                        </div>

                    </div>

                </section>

                {/* =====================================================
                    PAGE HEADER
                ===================================================== */}

                <div className="cd-page-header">

                    <div className="cd-heading">

                        <div className="cd-heading-icon">
                            <i className="bi bi-people-fill"></i>
                        </div>

                        <div>

                            <h1 className="dba-page-title">
                                Candidates
                            </h1>

                            <p className="dba-page-sub">
                                Meet the leaders. Know their vision.
                            </p>

                        </div>

                    </div>

                    <div className="cd-header-status">

                        <i className="bi bi-shield-check"></i>

                        <div>

                            <strong>
                                Transparent Elections
                            </strong>

                            <small>
                                Know before you vote
                            </small>

                        </div>

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
                    CURRENT ELECTION INFO
                ===================================================== */}

                {election && (

                    <div
                        style={{
                            maxWidth: "1200px",
                            margin: "0 auto 20px",
                            padding: "0 20px",
                        }}
                    >

                        <small>
                            Showing candidates for:{" "}
                            <strong>
                                {election.title}
                            </strong>
                        </small>

                    </div>

                )}

                {/* =====================================================
                    POSITION TABS
                ===================================================== */}

                <section className="cd-position-section">

                    <div className="cd-position-title">

                        <div>

                            <h2>
                                Select Position
                            </h2>

                            <p>
                                Browse candidates contesting for each position.
                            </p>

                        </div>

                        <span className="cd-position-count">
                            {list.length} Candidate
                            {list.length !== 1 ? "s" : ""}
                        </span>

                    </div>

                    <div className="cd-tabs">

                        {positions.map(
                            (position) => (

                                <button
                                    key={position.id}
                                    type="button"
                                    className={`cd-tab ${String(active) ===
                                            String(position.id)
                                            ? "active"
                                            : ""
                                        }`}
                                    onClick={() => {

                                        setError("");

                                        setActive(
                                            String(position.id)
                                        );

                                    }}
                                >

                                    <i
                                        className={`bi ${String(active) ===
                                                String(position.id)
                                                ? "bi-person-fill"
                                                : "bi-person"
                                            }`}
                                    ></i>

                                    <span>
                                        {position.name}
                                    </span>

                                </button>

                            )
                        )}

                    </div>

                </section>

                {/* =====================================================
                    LOADING
                ===================================================== */}

                {loading ? (

                    <section className="cd-candidates-section">

                        <div
                            style={{
                                minHeight: "350px",
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
                                Loading candidates...
                            </p>

                        </div>

                    </section>

                ) : (

                    <>

                        {/* =================================================
                            CANDIDATES
                        ================================================= */}

                        <section className="cd-candidates-section">

                            {list.length > 0 ? (

                                <div className="cd-grid">

                                    {list.map(
                                        (candidate) => (

                                            <CandidateCard
                                                key={
                                                    candidate.id
                                                }
                                                candidate={
                                                    candidate
                                                }
                                                onViewProfile={
                                                    (item) => {
                                                        setSelectedCandidate(
                                                            item
                                                        );
                                                        setCandidateModal(
                                                            "profile"
                                                        );
                                                    }
                                                }
                                                onViewManifesto={
                                                    (item) => {
                                                        setSelectedCandidate(
                                                            item
                                                        );
                                                        setCandidateModal(
                                                            "manifesto"
                                                        );
                                                    }
                                                }
                                            />

                                        )
                                    )}

                                </div>

                            ) : (

                                <div className="cd-empty">

                                    <div className="cd-empty-icon">

                                        <i className="bi bi-person-x"></i>

                                    </div>

                                    <h3>
                                        No Candidates Announced
                                    </h3>

                                    <p>
                                        Candidates for this position
                                        have not been announced yet.
                                    </p>

                                </div>

                            )}

                        </section>

                        {/* =================================================
                            INFORMATION STRIP
                        ================================================= */}

                        <section className="cd-info-strip">

                            <div className="cd-info-strip-icon">

                                <i className="bi bi-lightbulb-fill"></i>

                            </div>

                            <div>

                                <strong>
                                    Know the candidate before you vote.
                                </strong>

                                <p>
                                    Review each candidate's experience
                                    and vision before making your choice.
                                </p>

                            </div>

                            <i className="bi bi-arrow-right-circle-fill"></i>

                        </section>

                    </>

                )}

                {/* =====================================================
                    BOTTOM BANNER
                ===================================================== */}

                <section
                    className="cd-bottom-banner"
                    style={{
                        backgroundImage:
                            `url(${LahoreHighCourt})`,
                    }}
                >

                    <div className="cd-bottom-overlay"></div>

                    <div className="cd-bottom-content">

                        <div className="cd-bottom-message">

                            <span className="cd-bottom-mark">
                                “
                            </span>

                            <div>

                                <h2>
                                    Choose Leadership
                                    <br />
                                    With Vision & Integrity
                                </h2>

                                <p>
                                    Fair Elections • Stronger Representation
                                </p>

                            </div>

                        </div>

                        <div className="cd-bottom-features">

                            <div className="cd-feature">

                                <i className="bi bi-award-fill"></i>

                                <strong>
                                    Experience
                                </strong>

                                <span>
                                    Professional Leadership
                                </span>

                            </div>

                            <div className="cd-feature">

                                <i className="bi bi-eye-fill"></i>

                                <strong>
                                    Vision
                                </strong>

                                <span>
                                    A Better Tomorrow
                                </span>

                            </div>

                            <div className="cd-feature">

                                <i className="bi bi-shield-check"></i>

                                <strong>
                                    Integrity
                                </strong>

                                <span>
                                    Transparent Service
                                </span>

                            </div>

                        </div>

                    </div>

                </section>

            </div>

            {/* =====================================================
                CANDIDATE PROFILE / MANIFESTO MODAL
            ===================================================== */}

            {selectedCandidate && candidateModal && (

                <div
                    className="cd-modal-backdrop"
                    onClick={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeCandidateModal();
                        }

                    }}
                >

                    <div className="cd-modal">

                        <button
                            type="button"
                            className="cd-modal-close"
                            onClick={closeCandidateModal}
                            aria-label="Close"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>

                        <div className="cd-modal-header">

                            <img
                                src={getModalCandidatePhoto()}
                                alt={
                                    selectedCandidate.name ||
                                    "Candidate"
                                }
                                className="cd-modal-photo"
                            />

                            <div>

                                <h2>
                                    {selectedCandidate.name ||
                                        "Candidate"}
                                </h2>

                                <p>
                                    {selectedCandidate.position ||
                                        selectedCandidate.position_name ||
                                        selectedCandidate.positionName ||
                                        "District Bar Association"}
                                </p>

                            </div>

                        </div>

                        {candidateModal === "profile" ? (

                            <div className="cd-modal-content">

                                <div className="cd-detail-row">

                                    <span>
                                        Bar Number
                                    </span>

                                    <strong>
                                        {selectedCandidate.bar_number ||
                                            selectedCandidate.barNumber ||
                                            "Not provided"}
                                    </strong>

                                </div>

                                <div className="cd-detail-row">

                                    <span>
                                        Position
                                    </span>

                                    <strong>
                                        {selectedCandidate.position ||
                                            selectedCandidate.position_name ||
                                            selectedCandidate.positionName ||
                                            "Not provided"}
                                    </strong>

                                </div>

                                <div className="cd-detail-block">

                                    <span>
                                        Nomination
                                    </span>

                                    <p>
                                        {selectedCandidate.nomination ||
                                            "No nomination details provided."}
                                    </p>

                                </div>

                                <div className="cd-detail-block">

                                    <span>
                                        Manifesto
                                    </span>

                                    <p>
                                        {selectedCandidate.manifesto ||
                                            "No manifesto provided."}
                                    </p>

                                </div>

                            </div>

                        ) : (

                            <div className="cd-modal-content">

                                <div className="cd-manifesto-title">

                                    <i className="bi bi-file-earmark-text-fill"></i>

                                    <span>
                                        Candidate Manifesto
                                    </span>

                                </div>

                                <p className="cd-manifesto-full">
                                    {selectedCandidate.manifesto ||
                                        "No manifesto has been provided by this candidate."}
                                </p>

                            </div>

                        )}

                    </div>

                </div>

            )}

        </DashboardLayout>
    );
}

export default Candidates;