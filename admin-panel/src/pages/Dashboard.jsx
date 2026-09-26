import { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";

function getAdminToken() {
    return localStorage.getItem("adminToken");
}

function formatDate(dateValue) {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // FETCH DASHBOARD
    // =====================================================

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getAdminToken();

            if (!token) {
                throw new Error(
                    "Admin session not found. Please login again."
                );
            }

            const response = await fetch(
                `${API_URL}/admin/dashboard`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    "Failed to load dashboard."
                );
            }

            setDashboardData(data);
        } catch (err) {
            console.error(
                "DASHBOARD FETCH ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to load dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    // =====================================================
    // DATA
    // =====================================================

    const statsData = dashboardData?.stats || {};

    const votingOverview =
        dashboardData?.votingOverview || {
            eligibleVoters: 0,
            votesCast: 0,
            uniqueVoters: 0,
            notVoted: 0,
            turnout: 0,
        };

    const activeElection =
        dashboardData?.activeElection || null;

    const recentLawyers =
        dashboardData?.recentLawyers || [];

    // =====================================================
    // STATISTICS
    // =====================================================

    const stats = useMemo(
        () => [
            {
                title: "Total Lawyers",
                value: Number(
                    statsData.registeredLawyers || 0
                ).toLocaleString(),
                change: "Registered members",
                changeType: "neutral",
                icon: "bi-people",
                iconClass: "blue",
            },
            {
                title: "Active Elections",
                value: String(
                    statsData.activeElections || 0
                ).padStart(2, "0"),
                change:
                    statsData.activeElections > 0
                        ? "Currently active"
                        : "No active election",
                changeType:
                    statsData.activeElections > 0
                        ? "positive"
                        : "neutral",
                icon: "bi-check2-square",
                iconClass: "green",
            },
            {
                title: "Candidates",
                value: Number(
                    statsData.candidates || 0
                ).toLocaleString(),
                change: "Total candidates",
                changeType: "neutral",
                icon: "bi-person-badge",
                iconClass: "purple",
            },
            {
                title: "Total Votes",
                value: Number(
                    statsData.votesCast || 0
                ).toLocaleString(),
                change: "Valid votes",
                changeType: "neutral",
                icon: "bi-check-circle",
                iconClass: "orange",
            },
        ],
        [statsData]
    );

    // =====================================================
    // QUICK ACTIONS
    // =====================================================

    const quickActions = [
        {
            title: "Create Election",
            description: "Start a new election",
            icon: "bi-plus-circle",
            className: "blue",
            link: "/admin/elections",
        },
        {
            title: "Add Candidate",
            description: "Register a candidate",
            icon: "bi-person-plus",
            className: "purple",
            link: "/admin/candidates",
        },
        {
            title: "View Results",
            description: "Check election results",
            icon: "bi-bar-chart",
            className: "green",
            link: "/admin/results",
        },
        {
            title: "Support Requests",
            description: "Review pending requests",
            icon: "bi-headset",
            className: "orange",
            link: "/admin/support",
        },
    ];

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-intro">
                    <div>
                        <span className="dashboard-overline">
                            ADMINISTRATION OVERVIEW
                        </span>

                        <h2>
                            Welcome to E-Voting
                        </h2>

                        <p>
                            Loading dashboard data...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-intro">
                    <div>
                        <span className="dashboard-overline">
                            ADMINISTRATION OVERVIEW
                        </span>

                        <h2>
                            Welcome to E-Voting
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={fetchDashboard}
                            style={{
                                marginTop: "15px",
                                padding: "10px 18px",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // =====================================================
    // MAIN DASHBOARD
    // =====================================================

    return (
        <div className="dashboard-page">

            {/* =================================================
              PAGE INTRO
            ================================================= */}

            <div className="dashboard-intro">

                <div>
                    <span className="dashboard-overline">
                        ADMINISTRATION OVERVIEW
                    </span>

                    <h2>
                        Welcome to E-Voting
                    </h2>

                    <p>
                        Here's what's happening in your voting
                        system today.
                    </p>
                </div>

            </div>


            {/* =================================================
              STATISTICS
            ================================================= */}

            <div className="dashboard-stats">

                {stats.map((stat) => (
                    <div
                        className="dashboard-stat-card"
                        key={stat.title}
                    >

                        <div className="stat-card-top">

                            <div
                                className={`stat-icon ${stat.iconClass}`}
                            >
                                <i
                                    className={`bi ${stat.icon}`}
                                ></i>
                            </div>


                        </div>


                        <div className="stat-card-content">

                            <span className="stat-title">
                                {stat.title}
                            </span>

                            <strong className="stat-value">
                                {stat.value}
                            </strong>

                            <div
                                className={`stat-change ${stat.changeType}`}
                            >

                                {stat.changeType === "positive" && (
                                    <i className="bi bi-arrow-up"></i>
                                )}

                                {stat.changeType === "neutral" && (
                                    <i className="bi bi-info-circle"></i>
                                )}

                                <span>
                                    {stat.change}
                                </span>

                            </div>

                        </div>

                    </div>
                ))}

            </div>


            {/* =================================================
              MAIN DASHBOARD GRID
            ================================================= */}

            <div className="dashboard-main-grid">

                {/* ===============================================
                    VOTING OVERVIEW
                =============================================== */}

                <div className="dashboard-card voting-overview-card">

                    <div className="dashboard-card-header">

                        <div>
                            <h3>
                                Voting Overview
                            </h3>

                            <p>
                                {activeElection
                                    ? "Current election participation"
                                    : "Current voting participation"}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="dashboard-card-menu"
                        >
                            <i className="bi bi-three-dots"></i>
                        </button>

                    </div>


                    <div className="voting-overview-content">

                        {/* Progress */}

                        <div className="voting-progress-wrapper">

                            <div
                                className="voting-progress"
                                style={{
                                    "--progress": `${votingOverview.turnout}%`,
                                }}
                            >
                                <div className="voting-progress-inner">

                                    <strong>
                                        {votingOverview.turnout}%
                                    </strong>

                                    <span>
                                        Turnout
                                    </span>

                                </div>
                            </div>

                        </div>


                        {/* Details */}

                        <div className="voting-details">

                            <div className="voting-detail-item">

                                <span className="detail-dot total"></span>

                                <div>
                                    <strong>
                                        {Number(
                                            votingOverview.eligibleVoters || 0
                                        ).toLocaleString()}
                                    </strong>

                                    <span>
                                        Eligible Lawyers
                                    </span>
                                </div>

                            </div>


                            <div className="voting-detail-item">

                                <span className="detail-dot voted"></span>

                                <div>
                                    <strong>
                                        {Number(
                                            votingOverview.votesCast || 0
                                        ).toLocaleString()}
                                    </strong>

                                    <span>
                                        Votes Cast
                                    </span>
                                </div>

                            </div>


                            <div className="voting-detail-item">

                                <span className="detail-dot remaining"></span>

                                <div>
                                    <strong>
                                        {Number(
                                            votingOverview.notVoted || 0
                                        ).toLocaleString()}
                                    </strong>

                                    <span>
                                        Not Voted
                                    </span>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ===============================================
                    ACTIVE ELECTION
                =============================================== */}

                <div className="dashboard-card active-election-card">

                    <div className="dashboard-card-header">

                        <div>
                            <h3>
                                Active Election
                            </h3>

                            <p>
                                Current election status
                            </p>
                        </div>

                        {activeElection ? (
                            <span className="election-live-badge">
                                <span></span>
                                LIVE
                            </span>
                        ) : (
                            <span className="election-live-badge">
                                <span></span>
                                NO ACTIVE
                            </span>
                        )}

                    </div>


                    <div className="active-election-content">

                        <div className="election-icon">
                            <i className="bi bi-check2-square"></i>
                        </div>

                        <h4>
                            {activeElection
                                ? activeElection.title
                                : "No Active Election"}
                        </h4>

                        <p>
                            {activeElection
                                ? activeElection.type ||
                                "Election"
                                : "There is currently no active election."}
                        </p>


                        <div className="election-dates">

                            <div>
                                <span>Started</span>

                                <strong>
                                    {activeElection
                                        ? formatDate(
                                            activeElection.start_at
                                        )
                                        : "-"}
                                </strong>
                            </div>

                            <div>
                                <span>Ends</span>

                                <strong>
                                    {activeElection
                                        ? formatDate(
                                            activeElection.end_at
                                        )
                                        : "-"}
                                </strong>
                            </div>

                        </div>


                        <div className="election-progress-section">

                            <div className="election-progress-label">

                                <span>
                                    Voting Progress
                                </span>

                                <strong>
                                    {votingOverview.turnout}%
                                </strong>

                            </div>

                            <div className="election-progress-bar">

                                <div
                                    style={{
                                        width: `${votingOverview.turnout}%`,
                                    }}
                                ></div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
              BOTTOM GRID
            ================================================= */}

            <div className="dashboard-bottom-grid">

                {/* ===============================================
                    RECENT LAWYERS
                =============================================== */}

                <div className="dashboard-card recent-lawyers-card">

                    <div className="dashboard-card-header">

                        <div>
                            <h3>
                                Recent Lawyers
                            </h3>

                            <p>
                                Recently registered members
                            </p>
                        </div>

                        <a
                            href="/admin/lawyers"
                            className="view-all-link"
                        >
                            View All
                            <i className="bi bi-arrow-right"></i>
                        </a>

                    </div>


                    <div className="recent-lawyers-table-wrapper">

                        <table className="recent-lawyers-table">

                            <thead>

                                <tr>
                                    <th>Lawyer</th>
                                    <th>Registration No.</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>

                            </thead>


                            <tbody>

                                {recentLawyers.length > 0 ? (
                                    recentLawyers.map((lawyer) => (
                                        <tr key={lawyer.id}>

                                            <td>

                                                <div className="lawyer-table-user">

                                                    <div className="lawyer-avatar">
                                                        {(lawyer.name || "?")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {lawyer.name || "-"}
                                                        </strong>

                                                        <span>
                                                            {lawyer.email || "-"}
                                                        </span>
                                                    </div>

                                                </div>

                                            </td>


                                            <td>
                                                <span className="registration-number">
                                                    {lawyer.registration || "-"}
                                                </span>
                                            </td>


                                            <td>
                                                <span className="lawyer-date">
                                                    {formatDate(
                                                        lawyer.date
                                                    )}
                                                </span>
                                            </td>


                                            <td>

                                                <span
                                                    className={`lawyer-status ${lawyer.status === "Verified"
                                                        ? "active"
                                                        : "pending"
                                                        }`}
                                                >
                                                    <span></span>

                                                    {lawyer.status || "-"}
                                                </span>

                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            style={{
                                                textAlign: "center",
                                                padding: "25px",
                                            }}
                                        >
                                            No lawyers found.
                                        </td>
                                    </tr>
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>


                {/* ===============================================
                    QUICK ACTIONS
                =============================================== */}

                <div className="dashboard-card quick-actions-card">

                    <div className="dashboard-card-header">

                        <div>
                            <h3>
                                Quick Actions
                            </h3>

                            <p>
                                Frequently used actions
                            </p>
                        </div>

                    </div>


                    <div className="quick-actions-list">

                        {quickActions.map((action) => (
                            <a
                                key={action.title}
                                href={action.link}
                                className="quick-action-item"
                            >

                                <div
                                    className={`quick-action-icon ${action.className}`}
                                >
                                    <i
                                        className={`bi ${action.icon}`}
                                    ></i>
                                </div>


                                <div className="quick-action-text">

                                    <strong>
                                        {action.title}
                                    </strong>

                                    <span>
                                        {action.description}
                                    </span>

                                </div>


                                <i className="bi bi-chevron-right quick-action-arrow"></i>

                            </a>
                        ))}

                    </div>

                </div>

            </div>


            {/* =================================================
              SYSTEM STATUS
            ================================================= */}

            <div className="dashboard-system-status">

                <div className="system-status-left">

                    <span className="system-status-dot"></span>

                    <div>
                        <strong>
                            System Operational
                        </strong>

                        <span>
                            All e-voting services are running normally.
                        </span>
                    </div>

                </div>


                <span className="system-status-time">
                    Last checked: Just now
                </span>

            </div>

        </div>
    );
}

export default Dashboard;