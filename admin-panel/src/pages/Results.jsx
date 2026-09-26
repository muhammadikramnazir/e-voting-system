import { useEffect, useMemo, useState } from "react";
import "./Results.css";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";

const getHeaders = () => {
    const token = localStorage.getItem("adminToken");

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

function Results() {
    const [elections, setElections] = useState([]);
    const [rawResults, setRawResults] = useState([]);

    const [selectedElection, setSelectedElection] =
        useState("");

    const [published, setPublished] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [publishing, setPublishing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    /* =========================================================
       FETCH ELECTIONS + RESULTS
    ========================================================= */

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                electionsResponse,
                resultsResponse,
            ] = await Promise.all([
                fetch(
                    `${API_URL}/admin/elections`,
                    {
                        method: "GET",
                        headers: getHeaders(),
                    }
                ),

                fetch(
                    `${API_URL}/admin/results`,
                    {
                        method: "GET",
                        headers: getHeaders(),
                    }
                ),
            ]);

            const electionsData =
                await electionsResponse.json();

            const resultsData =
                await resultsResponse.json();

            if (
                !electionsResponse.ok ||
                !electionsData.status
            ) {
                throw new Error(
                    electionsData.message ||
                    "Failed to load elections."
                );
            }

            if (
                !resultsResponse.ok ||
                !resultsData.status
            ) {
                throw new Error(
                    resultsData.message ||
                    "Failed to load results."
                );
            }

            const electionList =
                Array.isArray(
                    electionsData.elections
                )
                    ? electionsData.elections
                    : [];

            const resultList =
                Array.isArray(
                    resultsData.results
                )
                    ? resultsData.results
                    : [];

            setElections(electionList);
            setRawResults(resultList);

            /* Select first election automatically */

            if (electionList.length > 0) {
                setSelectedElection(
                    (current) => {
                        if (
                            current &&
                            electionList.some(
                                (election) =>
                                    String(
                                        election.id
                                    ) ===
                                    String(
                                        current
                                    )
                            )
                        ) {
                            return current;
                        }

                        return String(
                            electionList[0].id
                        );
                    }
                );
            } else {
                setSelectedElection("");
            }
        } catch (err) {
            console.error(
                "RESULTS FETCH ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to load results."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    /* =========================================================
       SELECTED ELECTION
    ========================================================= */

    const selectedElectionData =
        useMemo(() => {
            return (
                elections.find(
                    (election) =>
                        String(
                            election.id
                        ) ===
                        String(
                            selectedElection
                        )
                ) || null
            );
        }, [
            elections,
            selectedElection,
        ]);

    /* =========================================================
       RESULTS FOR SELECTED ELECTION
    ========================================================= */

    const results = useMemo(() => {
        if (!selectedElection) {
            return [];
        }

        const electionResults =
            rawResults.filter(
                (item) =>
                    String(
                        item.election_id
                    ) ===
                    String(
                        selectedElection
                    )
            );

        const grouped = {};

        electionResults.forEach(
            (item) => {
                const positionId =
                    item.position_id;

                if (!grouped[positionId]) {
                    grouped[positionId] = {
                        positionId:
                            item.position_id,

                        position:
                            item.position,

                        candidates: [],

                        /*
                         * Backend provides these
                         * election-level values
                         * with every result row.
                         */
                        eligibleVoters:
                            Number(
                                item.eligible_voters ||
                                0
                            ),

                        uniqueVoters:
                            Number(
                                item.unique_voters ||
                                0
                            ),

                        totalElectionVotes:
                            Number(
                                item.total_election_votes ||
                                0
                            ),
                    };
                }

                grouped[
                    positionId
                ].candidates.push({
                    id:
                        item.candidate_id,

                    name:
                        item.candidate,

                    votes:
                        Number(
                            item.votes ||
                            0
                        ),
                });
            }
        );

        return Object.values(
            grouped
        ).map(
            (positionData) => {
                const totalVotes =
                    positionData.candidates.reduce(
                        (
                            sum,
                            candidate
                        ) =>
                            sum +
                            candidate.votes,
                        0
                    );

                const sortedCandidates =
                    [
                        ...positionData.candidates,
                    ]
                        .sort(
                            (a, b) =>
                                b.votes -
                                a.votes
                        )
                        .map(
                            (
                                candidate,
                                index
                            ) => {
                                const percentage =
                                    totalVotes >
                                        0
                                        ? Number(
                                            (
                                                (candidate.votes /
                                                    totalVotes) *
                                                100
                                            ).toFixed(
                                                1
                                            )
                                        )
                                        : 0;

                                return {
                                    ...candidate,

                                    percentage,

                                    status:
                                        index ===
                                            0 &&
                                            candidate.votes >
                                            0
                                            ? "Leading"
                                            : "",
                                };
                            }
                        );

                return {
                    ...positionData,

                    candidates:
                        sortedCandidates,

                    totalVotes,
                };
            }
        );
    }, [
        rawResults,
        selectedElection,
    ]);

    /* =========================================================
       ELECTION STATISTICS
    ========================================================= */

    const electionStatistics =
        useMemo(() => {
            if (!selectedElection) {
                return {
                    eligibleVoters: 0,
                    uniqueVoters: 0,
                    totalVotes: 0,
                    turnout: 0,
                    candidates: 0,
                };
            }

            const electionRows =
                rawResults.filter(
                    (item) =>
                        String(
                            item.election_id
                        ) ===
                        String(
                            selectedElection
                        )
                );

            if (!electionRows.length) {
                return {
                    eligibleVoters: 0,
                    uniqueVoters: 0,
                    totalVotes: 0,
                    turnout: 0,
                    candidates: 0,
                };
            }

            const firstRow =
                electionRows[0];

            const eligibleVoters =
                Number(
                    firstRow.eligible_voters ||
                    0
                );

            const uniqueVoters =
                Number(
                    firstRow.unique_voters ||
                    0
                );

            const totalVotes =
                Number(
                    firstRow.total_election_votes ||
                    0
                );

            const candidates =
                new Set(
                    electionRows.map(
                        (item) =>
                            item.candidate_id
                    )
                ).size;

            const turnout =
                eligibleVoters > 0
                    ? Number(
                        (
                            (uniqueVoters /
                                eligibleVoters) *
                            100
                        ).toFixed(1)
                    )
                    : 0;

            return {
                eligibleVoters,
                uniqueVoters,
                totalVotes,
                turnout,
                candidates,
            };
        }, [
            rawResults,
            selectedElection,
        ]);

    const {
        eligibleVoters,
        uniqueVoters,
        totalVotes,
        turnout,
        candidates: totalCandidates,
    } = electionStatistics;

    /* =========================================================
       PUBLISHED STATUS
    ========================================================= */

    useEffect(() => {
        if (!selectedElectionData) {
            setPublished(false);
            return;
        }

        setPublished(
            Boolean(
                selectedElectionData.results_published ===
                1 ||
                selectedElectionData.results_published ===
                true
            )
        );
    }, [
        selectedElectionData,
    ]);

    /* =========================================================
       PUBLISH / UNPUBLISH
    ========================================================= */

    const handlePublish = async () => {
        if (!selectedElectionData) {
            return;
        }

        try {
            setPublishing(true);
            setError("");
            setSuccess("");

            const newPublishedStatus =
                !published;

            const response =
                await fetch(
                    `${API_URL}/admin/results/${selectedElectionData.id}/publish`,
                    {
                        method: "PATCH",

                        headers:
                            getHeaders(),

                        body: JSON.stringify({
                            published:
                                newPublishedStatus,
                        }),
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.status
            ) {
                throw new Error(
                    data.message ||
                    "Failed to update publish status."
                );
            }

            setPublished(
                newPublishedStatus
            );

            setElections(
                (current) =>
                    current.map(
                        (election) =>
                            String(
                                election.id
                            ) ===
                                String(
                                    selectedElectionData.id
                                )
                                ? {
                                    ...election,

                                    results_published:
                                        newPublishedStatus
                                            ? 1
                                            : 0,
                                }
                                : election
                    )
            );

            setSuccess(
                newPublishedStatus
                    ? "Results published successfully."
                    : "Results unpublished successfully."
            );

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error(
                "PUBLISH RESULTS ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to update result publish status."
            );
        } finally {
            setPublishing(false);
        }
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <div className="results-page">

                <div
                    style={{
                        padding:
                            "60px 20px",

                        textAlign:
                            "center",

                        color:
                            "#64748b",
                    }}
                >
                    <i
                        className="bi bi-arrow-repeat"
                        style={{
                            fontSize:
                                "24px",

                            display:
                                "block",

                            marginBottom:
                                "10px",
                        }}
                    ></i>

                    <span>
                        Loading election results...
                    </span>
                </div>

            </div>
        );
    }

    return (
        <div className="results-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="results-page-header">

                <div>

                    <span className="results-overline">
                        ELECTION RESULTS
                    </span>

                    <h1>
                        Results Management
                    </h1>

                    <p>
                        View, verify and publish election results.
                    </p>

                </div>

                <div className="results-header-actions">

                    <div
                        className={`results-publish-status ${published
                                ? "published"
                                : "draft"
                            }`}
                    >
                        <span></span>

                        {published
                            ? "Results Published"
                            : "Results Unpublished"}
                    </div>

                    <button
                        type="button"
                        className="results-publish-btn"
                        onClick={
                            handlePublish
                        }
                        disabled={
                            !selectedElectionData ||
                            publishing
                        }
                        style={{
                            opacity:
                                !selectedElectionData ||
                                    publishing
                                    ? 0.65
                                    : 1,

                            cursor:
                                !selectedElectionData ||
                                    publishing
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        <i
                            className={
                                publishing
                                    ? "bi bi-arrow-repeat"
                                    : published
                                        ? "bi bi-eye-slash"
                                        : "bi bi-megaphone"
                            }
                        ></i>

                        {publishing
                            ? "Updating..."
                            : published
                                ? "Unpublish Results"
                                : "Publish Results"}
                    </button>

                </div>

            </div>


            {/* =================================================
                SUCCESS / ERROR
            ================================================= */}

            {error && (
                <div
                    style={{
                        marginBottom:
                            "15px",

                        padding:
                            "11px 14px",

                        borderRadius:
                            "8px",

                        background:
                            "#fef2f2",

                        border:
                            "1px solid #fecaca",

                        color:
                            "#b91c1c",

                        fontSize:
                            "11px",
                    }}
                >
                    <i
                        className="bi bi-exclamation-circle"
                        style={{
                            marginRight:
                                "7px",
                        }}
                    ></i>

                    {error}
                </div>
            )}

            {success && (
                <div
                    style={{
                        marginBottom:
                            "15px",

                        padding:
                            "11px 14px",

                        borderRadius:
                            "8px",

                        background:
                            "#ecfdf5",

                        border:
                            "1px solid #a7f3d0",

                        color:
                            "#047857",

                        fontSize:
                            "11px",
                    }}
                >
                    <i
                        className="bi bi-check-circle"
                        style={{
                            marginRight:
                                "7px",
                        }}
                    ></i>

                    {success}
                </div>
            )}


            {/* =================================================
                ELECTION SELECTOR
            ================================================= */}

            <div className="results-selector-card">

                <div className="results-selector-left">

                    <div className="results-selector-icon">

                        <i className="bi bi-bar-chart-line"></i>

                    </div>

                    <div>

                        <span>
                            SELECT ELECTION
                        </span>

                        <h3>
                            Election Results
                        </h3>

                    </div>

                </div>

                <div className="results-selector-control">

                    <label>
                        Election
                    </label>

                    <select
                        value={
                            selectedElection
                        }
                        onChange={(e) =>
                            setSelectedElection(
                                e.target.value
                            )
                        }
                        disabled={
                            elections.length ===
                            0
                        }
                    >
                        {elections.length ===
                            0 ? (
                            <option value="">
                                No elections available
                            </option>
                        ) : (
                            elections.map(
                                (
                                    election
                                ) => (
                                    <option
                                        key={
                                            election.id
                                        }
                                        value={String(
                                            election.id
                                        )}
                                    >
                                        {
                                            election.title
                                        }
                                    </option>
                                )
                            )
                        )}
                    </select>

                </div>

            </div>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="results-stats">

                {/* ELIGIBLE VOTERS */}

                <div className="results-stat-card">

                    <div className="results-stat-icon blue">

                        <i className="bi bi-people"></i>

                    </div>

                    <div className="results-stat-content">

                        <span>
                            ELIGIBLE VOTERS
                        </span>

                        <strong>
                            {eligibleVoters.toLocaleString()}
                        </strong>

                    </div>

                </div>


                {/* TOTAL VOTES */}

                <div className="results-stat-card">

                    <div className="results-stat-icon green">

                        <i className="bi bi-check2-circle"></i>

                    </div>

                    <div className="results-stat-content">

                        <span>
                            TOTAL VOTES
                        </span>

                        <strong>
                            {totalVotes.toLocaleString()}
                        </strong>

                    </div>

                </div>


                {/* TURNOUT */}

                <div className="results-stat-card">

                    <div className="results-stat-icon purple">

                        <i className="bi bi-bar-chart"></i>

                    </div>

                    <div className="results-stat-content">

                        <span>
                            TURNOUT
                        </span>

                        <strong>
                            {turnout}%
                        </strong>

                    </div>

                </div>


                {/* CANDIDATES */}

                <div className="results-stat-card">

                    <div className="results-stat-icon orange">

                        <i className="bi bi-person-badge"></i>

                    </div>

                    <div className="results-stat-content">

                        <span>
                            CANDIDATES
                        </span>

                        <strong>
                            {totalCandidates}
                        </strong>

                    </div>

                </div>

            </div>


            {/* =================================================
                UNIQUE VOTERS INFORMATION
            ================================================= */}

            <div
                style={{
                    marginTop:
                        "-5px",

                    marginBottom:
                        "18px",

                    padding:
                        "0 4px",

                    color:
                        "#64748b",

                    fontSize:
                        "11px",
                }}
            >
                <i
                    className="bi bi-info-circle"
                    style={{
                        marginRight:
                            "6px",
                    }}
                ></i>

                {uniqueVoters.toLocaleString()} unique
                voter
                {uniqueVoters === 1
                    ? ""
                    : "s"}{" "}
                cast votes in this election.
            </div>


            {/* =================================================
                EMPTY STATE / RESULTS
            ================================================= */}

            {results.length ===
                0 ? (

                <div className="results-empty-card">

                    <div className="results-empty-icon">

                        <i className="bi bi-bar-chart"></i>

                    </div>

                    <h3>
                        No Results Available
                    </h3>

                    <p>
                        Results for this election have not been
                        recorded yet.
                    </p>

                </div>

            ) : (

                <div className="results-positions">

                    {/* RESULTS BY POSITION */}

                    {results.map(
                        (
                            positionData
                        ) => (

                            <div
                                className="results-position-card"
                                key={
                                    positionData.positionId
                                }
                            >

                                <div className="results-position-header">

                                    <div>

                                        <span className="results-position-label">
                                            ELECTION POSITION
                                        </span>

                                        <h3>
                                            {
                                                positionData.position
                                            }
                                        </h3>

                                    </div>

                                    <div className="results-position-total">

                                        <span>
                                            Total Votes
                                        </span>

                                        <strong>
                                            {positionData.totalVotes.toLocaleString()}
                                        </strong>

                                    </div>

                                </div>


                                <div className="results-candidate-list">

                                    {positionData.candidates.map(
                                        (
                                            candidate,
                                            index
                                        ) => (

                                            <div
                                                className={`result-candidate-row ${candidate.status ===
                                                        "Leading"
                                                        ? "leading"
                                                        : ""
                                                    }`}
                                                key={
                                                    candidate.id
                                                }
                                            >

                                                <div className="candidate-rank">
                                                    {index +
                                                        1}
                                                </div>

                                                <div className="candidate-result-info">

                                                    <div className="candidate-result-top">

                                                        <div className="candidate-result-name">

                                                            <div className="candidate-result-avatar">

                                                                {candidate.name
                                                                    ? candidate.name
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()
                                                                    : "?"}

                                                            </div>

                                                            <div>

                                                                <strong>
                                                                    {
                                                                        candidate.name
                                                                    }
                                                                </strong>

                                                                {candidate.status && (
                                                                    <span className="leading-badge">

                                                                        <i className="bi bi-trophy"></i>

                                                                        Leading

                                                                    </span>
                                                                )}

                                                            </div>

                                                        </div>


                                                        <div className="candidate-result-votes">

                                                            <strong>
                                                                {candidate.votes.toLocaleString()}
                                                            </strong>

                                                            <span>
                                                                votes
                                                            </span>

                                                        </div>

                                                    </div>


                                                    <div className="candidate-result-progress-row">

                                                        <div className="candidate-result-progress">

                                                            <div
                                                                style={{
                                                                    width: `${candidate.percentage}%`,
                                                                }}
                                                            ></div>

                                                        </div>

                                                        <span>
                                                            {
                                                                candidate.percentage
                                                            }
                                                            %
                                                        </span>

                                                    </div>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>

                        )
                    )}

                </div>

            )}


            {/* =================================================
                TURNOUT CARD
            ================================================= */}

            <div className="results-turnout-card">

                <div className="turnout-left">

                    <div className="turnout-icon">

                        <i className="bi bi-pie-chart"></i>

                    </div>

                    <div>

                        <h3>
                            Voter Turnout
                        </h3>

                        <p>
                            Percentage of eligible lawyers who cast
                            their vote.
                        </p>

                    </div>

                </div>

                <div className="turnout-progress-wrapper">

                    <div className="turnout-progress-bar">

                        <div
                            style={{
                                width: `${Math.min(
                                    turnout,
                                    100
                                )}%`,
                            }}
                        ></div>

                    </div>

                    <strong>
                        {turnout}%
                    </strong>

                </div>

            </div>


            {/* =================================================
                FOOTER NOTE
            ================================================= */}

            <div className="results-security-note">

                <i className="bi bi-shield-check"></i>

                <div>

                    <strong>
                        Election results security
                    </strong>

                    <span>
                        Results should be verified before publishing.
                        Published results are visible to authorized
                        users according to election settings.
                    </span>

                </div>

            </div>

        </div>
    );
}

export default Results;