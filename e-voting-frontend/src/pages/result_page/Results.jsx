import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../../components/dashboardLayout/DashboardLayout";
import { getResults } from "../../apis/authapi";
import "./Results.css";

const BAR_CLASSES = [
    "gold",
    "blue",
    "green",
    "red",
];

function Results() {
    const [position, setPosition] = useState("");
    const [results, setResults] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const topRef = useRef(null);

    const scrollToTop = () => {
        if (topRef.current) {
            topRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                setError("");

                const token =
                    localStorage.getItem("token") ||
                    sessionStorage.getItem("token");

                if (!token) {
                    setError("Authentication required. Please login again.");
                    return;
                }

                const data = await getResults(token);

                if (!data?.status) {
                    setError(
                        data?.message || "Unable to load election results."
                    );
                    return;
                }

                const rows = Array.isArray(data.results)
                    ? data.results
                    : [];

                setResults(rows);

                const uniquePositions = [
                    ...new Set(
                        rows
                            .map((item) => item.position)
                            .filter(Boolean)
                    ),
                ];

                setPositions(uniquePositions);

                if (uniquePositions.length > 0) {
                    setPosition((current) =>
                        uniquePositions.includes(current)
                            ? current
                            : uniquePositions[0]
                    );
                } else {
                    setPosition("");
                }
            } catch (err) {
                console.error("RESULTS FETCH ERROR:", err);
                setError(
                    "Unable to connect with the server. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, []);

    useEffect(() => {
        if (error) {
            scrollToTop();
        }
    }, [error]);

    const filteredResults = useMemo(() => {
        return results.filter(
            (item) => item.position === position
        );
    }, [results, position]);

    const total = useMemo(() => {
        return filteredResults.reduce(
            (sum, item) => sum + Number(item.votes || 0),
            0
        );
    }, [filteredResults]);

    const maxVotes = useMemo(() => {
        const highest = Math.max(
            ...filteredResults.map((item) =>
                Number(item.votes || 0)
            ),
            0
        );

        return highest > 0 ? highest : 1;
    }, [filteredResults]);

    return (
        <DashboardLayout>
            <div ref={topRef}>

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div className="rs-head">
                    <div>
                        <h1 className="dba-page-title">
                            Election Results
                        </h1>

                        <p className="dba-page-sub">
                            Official results for completed elections.
                        </p>
                    </div>

                    {positions.length > 0 && (
                        <select
                            className="dba-select"
                            value={position}
                            onChange={(e) =>
                                setPosition(e.target.value)
                            }
                        >
                            {positions.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    )}
                </div>


                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (
                    <div
                        style={{
                            marginBottom: "20px",
                            padding: "15px 18px",
                            borderRadius: "10px",
                            background: "#fff1f1",
                            border: "1px solid #f0b7b7",
                            color: "#b42318",
                            fontSize: "14px",
                            fontWeight: "600",
                        }}
                    >
                        <i
                            className="bi bi-exclamation-circle-fill"
                            style={{ marginRight: "8px" }}
                        ></i>

                        {error}
                    </div>
                )}


                {/* =====================================================
                    LOADING
                ===================================================== */}

                {loading && (
                    <div
                        style={{
                            padding: "60px 20px",
                            textAlign: "center",
                            color: "#64748b",
                        }}
                    >
                        <div
                            className="spinner-border"
                            role="status"
                            style={{
                                width: "2rem",
                                height: "2rem",
                                marginBottom: "12px",
                            }}
                        ></div>

                        <div>
                            Loading election results...
                        </div>
                    </div>
                )}


                {/* =====================================================
                    RESULTS NOT AVAILABLE
                ===================================================== */}

                {!loading &&
                    !error &&
                    results.length === 0 && (
                        <div
                            className="dba-card"
                            style={{
                                padding: "55px 25px",
                                textAlign: "center",
                            }}
                        >
                            <i
                                className="bi bi-bar-chart-line"
                                style={{
                                    fontSize: "42px",
                                    color: "#c89b35",
                                    display: "block",
                                    marginBottom: "15px",
                                }}
                            ></i>

                            <h2
                                style={{
                                    marginBottom: "10px",
                                    color: "#173047",
                                }}
                            >
                                Results Not Available
                            </h2>

                            <p
                                style={{
                                    margin: 0,
                                    color: "#718096",
                                    lineHeight: "1.7",
                                }}
                            >
                                Live vote counts are not displayed during
                                the voting period. Official results will
                                be available after the election ends and
                                results are published.
                            </p>
                        </div>
                    )}


                {/* =====================================================
                    CHART
                ===================================================== */}

                {!loading &&
                    !error &&
                    filteredResults.length > 0 && (
                        <>
                            <div className="rs-chart-card dba-card">

                                <div className="rs-chart">

                                    <div className="rs-y">
                                        {[250, 200, 150, 100, 50, 0].map(
                                            (n) => (
                                                <span key={n}>
                                                    {n}
                                                </span>
                                            )
                                        )}
                                    </div>

                                    <div className="rs-plot-wrap">

                                        <div className="rs-plot">

                                            <div className="rs-grid">
                                                {[250, 200, 150, 100, 50, 0].map(
                                                    (n) => (
                                                        <i key={n}></i>
                                                    )
                                                )}
                                            </div>

                                            <div className="rs-cols">

                                                {filteredResults.map(
                                                    (item, index) => {
                                                        const votes =
                                                            Number(
                                                                item.votes || 0
                                                            );

                                                        const height =
                                                            Math.max(
                                                                8,
                                                                (votes /
                                                                    maxVotes) *
                                                                100
                                                            );

                                                        return (
                                                            <div
                                                                className="rs-col"
                                                                key={
                                                                    item.candidate_id ||
                                                                    item.candidate ||
                                                                    index
                                                                }
                                                            >
                                                                <b>
                                                                    {votes}
                                                                </b>

                                                                <div
                                                                    className={`rs-bar ${BAR_CLASSES[
                                                                        index %
                                                                        BAR_CLASSES.length
                                                                        ]
                                                                        }`}
                                                                    style={{
                                                                        height: `${height}%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        );
                                                    }
                                                )}

                                            </div>
                                        </div>

                                        <div className="rs-names">
                                            {filteredResults.map(
                                                (item, index) => (
                                                    <span
                                                        key={
                                                            item.candidate_id ||
                                                            item.candidate ||
                                                            index
                                                        }
                                                    >
                                                        {item.candidate}
                                                    </span>
                                                )
                                            )}
                                        </div>

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                SUMMARY
                            ================================================= */}

                            <div className="rs-summary dba-card">

                                <div>
                                    <i className="bi bi-check2-square gold"></i>

                                    <span>
                                        <small>
                                            Total Votes Cast
                                        </small>

                                        <b>
                                            {total}
                                        </b>
                                    </span>
                                </div>

                                <div>
                                    <i className="bi bi-people-fill blue"></i>

                                    <span>
                                        <small>
                                            Registered Voters
                                        </small>

                                        <b>
                                            —
                                        </b>
                                    </span>
                                </div>

                                <div>
                                    <i className="bi bi-bar-chart-fill green"></i>

                                    <span>
                                        <small>
                                            Voter Turnout
                                        </small>

                                        <b>
                                            —
                                        </b>
                                    </span>
                                </div>

                            </div>


                            {/* =================================================
                                QUOTE
                            ================================================= */}

                            <div className="dba-quote-band rs-band">
                                <span>
                                    “Transparent Elections
                                    <br />
                                    Stronger Bars”
                                </span>
                            </div>
                        </>
                    )}

            </div>
        </DashboardLayout>
    );
}

export default Results;