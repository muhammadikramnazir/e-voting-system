import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboardLayout/DashboardLayout";
import {
  getProfile,
  getElections,
  getNotices,
} from "../../apis/authapi";
import LahoreHighCourt from "../../assets/Lahore-High-Court.jpg";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [elections, setElections] = useState([]);
  const [notices, setNotices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("token") ||
          sessionStorage.getItem("token");

        if (!token) {
          setError("Please login first.");
          setLoading(false);
          return;
        }

        const [
          profileData,
          electionsData,
          noticesData,
        ] = await Promise.all([
          getProfile(token),
          getElections(token),
          getNotices(token),
        ]);

        setUser(profileData?.user || null);
        setElections(electionsData?.elections || []);
        setNotices(noticesData?.notices || []);

      } catch (error) {
        console.error(
          "DASHBOARD ERROR:",
          error
        );

        setError(
          error.message ||
          "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="db-list">
          <div className="db-row">
            <div className="db-row-text">
              <h4>Loading Dashboard...</h4>
              <p>
                Please wait while your dashboard data is loading.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <DashboardLayout>
        <div className="db-list">
          <div className="db-row">
            <div className="db-row-text">
              <h4>Dashboard Error</h4>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =====================================================
  // CURRENT USER
  // =====================================================

  const userName =
    user?.full_name ||
    "Member";

  // =====================================================
  // CURRENT DATE
  // =====================================================

  const now = new Date();

  // =====================================================
  // ACTIVE / ONGOING ELECTIONS
  // =====================================================

  const ongoing = elections.filter((election) => {

    if (election.status !== "Active") {
      return false;
    }

    const startDate = new Date(
      election.start_at
    );

    const endDate = new Date(
      election.end_at
    );

    return (
      !Number.isNaN(startDate.getTime()) &&
      !Number.isNaN(endDate.getTime()) &&
      startDate <= now &&
      endDate >= now
    );
  });

  // =====================================================
  // DASHBOARD STATS
  // =====================================================

  const activeElectionCount =
    ongoing.length;

  const totalCandidateCount =
    elections.reduce(
      (total, election) =>
        total +
        Number(
          election.candidate_count || 0
        ),
      0
    );

  const noticeCount =
    notices.length;

  const dashboardStats = [
    {
      label: "Active Elections",
      value: activeElectionCount,
      icon: "bi-briefcase-fill",
      tone: "gold",
    },
    {
      label: "Total Candidates",
      value: totalCandidateCount,
      icon: "bi-people-fill",
      tone: "blue",
    },
    {
      label: "Notices",
      value: noticeCount,
      icon: "bi-file-earmark-text-fill",
      tone: "blue",
    },
  ];

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const getElectionDate = (dateValue) => {

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return {
        month: "---",
        day: "--",
        year: "----",
      };
    }

    return {
      month: date
        .toLocaleDateString("en-US", {
          month: "short",
        })
        .toUpperCase(),

      day: date
        .toLocaleDateString("en-US", {
          day: "2-digit",
        }),

      year: date
        .toLocaleDateString("en-US", {
          year: "numeric",
        }),
    };
  };

  // =====================================================
  // ELECTION CLOSING TEXT
  // =====================================================

  const getClosingText = (endDateValue) => {

    const endDate = new Date(
      endDateValue
    );

    if (Number.isNaN(endDate.getTime())) {
      return "Date unavailable";
    }

    const difference =
      endDate.getTime() -
      now.getTime();

    const days = Math.ceil(
      difference /
      (1000 * 60 * 60 * 24)
    );

    if (days <= 0) {
      return "Closes today";
    }

    if (days === 1) {
      return "Closes in 1 day";
    }

    return `Closes in ${days} days`;
  };

  return (
    <DashboardLayout>

      {/* ================= WELCOME SECTION ================= */}

      <section
        className="db-welcome"
        style={{
          backgroundImage: `url(${LahoreHighCourt})`,
        }}
      >

        <div className="db-welcome-overlay"></div>

        <div className="db-welcome-content">

          <p className="welcome-small">
            Welcome Back,
          </p>

          <h2>
            {userName}
          </h2>

          <span className="welcome-subtitle">
            District Bar Association
          </span>

        </div>

        <div className="db-welcome-quote">

          <span>
            “Law
          </span>

          <span>
            Unites Us”
          </span>

        </div>

      </section>

      {/* ================= STATS ================= */}

      <div className="row g-3 db-stats">

        {dashboardStats.map((stat) => (

          <div
            className="col-lg-4 col-md-6 col-sm-12"
            key={stat.label}
          >

            <article className="db-stat">

              <div
                className={`db-stat-icon ${stat.tone}`}
              >

                <i
                  className={`bi ${stat.icon}`}
                ></i>

              </div>

              <div className="db-stat-info">

                <small>
                  {stat.label}
                </small>

                <strong>
                  {stat.value}
                </strong>

              </div>

            </article>

          </div>

        ))}

      </div>

      {/* ================= SECTION HEADING ================= */}

      <div className="db-section-head">

        <div>

          <h3>
            Ongoing Elections
          </h3>

          <p>
            View and participate in active elections
          </p>

        </div>

        <Link
          to="/elections"
          className="dba-link-gold"
        >

          View All

          <i className="bi bi-arrow-right"></i>

        </Link>

      </div>

      {/* ================= ELECTION LIST ================= */}

      <div className="db-list">

        {ongoing.length === 0 ? (

          <article className="db-row">

            <div className="db-row-text">

              <h4>
                No Ongoing Elections
              </h4>

              <p>
                There are currently no active elections open for voting.
              </p>

            </div>

          </article>

        ) : (

          ongoing.map((election) => {

            const electionDate =
              getElectionDate(
                election.start_at
              );

            return (
              <article
                className="db-row"
                key={election.id}
              >

                {/* DATE */}

                <div className="dba-date">

                  <div className="m">
                    {electionDate.month}
                  </div>

                  <div className="d">
                    {electionDate.day}
                  </div>

                  <div className="y">
                    {electionDate.year}
                  </div>

                </div>

                {/* DETAILS */}

                <div className="db-row-text">

                  <h4>
                    {election.title}
                  </h4>

                  <p>
                    {election.description ||
                      election.type ||
                      "District Bar Association Election"}
                  </p>

                  <div className="db-election-meta">

                    <span>

                      <i className="bi bi-people-fill"></i>

                      {Number(
                        election.candidate_count || 0
                      )}{" "}
                      Candidates

                    </span>

                    <span>

                      <i className="bi bi-clock-fill"></i>

                      {getClosingText(
                        election.end_at
                      )}

                    </span>

                  </div>

                </div>

                {/* ACTION */}

                <button
                  className="dba-btn-gold db-row-btn"
                  onClick={() =>
                    navigate("/cast-vote")
                  }
                >

                  Cast Your Vote

                  <i className="bi bi-arrow-right"></i>

                </button>

              </article>
            );
          })
        )}

      </div>

    </DashboardLayout>
  );
}

export default Dashboard;