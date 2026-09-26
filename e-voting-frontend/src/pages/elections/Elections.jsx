import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboardLayout/DashboardLayout";
import { getElections } from "../../apis/authapi";
import LahoreHighCourt from "../../assets/Lahore-High-Court.jpg";
import "./Elections.css";

// ======================================================
// HELPERS
// ======================================================

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
};

const formatDateParts = (dateValue) => {
  if (!dateValue) {
    return {
      month: "N/A",
      day: "--",
      year: "----",
    };
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return {
      month: "N/A",
      day: "--",
      year: "----",
    };
  }

  return {
    month: date.toLocaleDateString("en-US", {
      month: "short",
    }).toUpperCase(),

    day: date.toLocaleDateString("en-US", {
      day: "2-digit",
    }),

    year: date.toLocaleDateString("en-US", {
      year: "numeric",
    }),
  };
};

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return "N/A";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDaysDifference = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  const target = new Date(dateValue);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const now = new Date();

  const difference =
    target.getTime() - now.getTime();

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );
};

const getElectionStatus = (election) => {
  const status = String(
    election.status || ""
  ).toLowerCase();

  const startDate = election.start_at
    ? new Date(election.start_at)
    : null;

  const endDate = election.end_at
    ? new Date(election.end_at)
    : null;

  const now = new Date();

  // Backend status has priority for explicitly completed/closed elections.
  if (
    ["completed", "closed", "inactive"].includes(status)
  ) {
    return "closed";
  }

  // If dates are valid, determine actual time state.
  if (
    startDate &&
    !Number.isNaN(startDate.getTime()) &&
    endDate &&
    !Number.isNaN(endDate.getTime())
  ) {
    if (now >= startDate && now <= endDate) {
      return "ongoing";
    }

    if (now < startDate) {
      return "upcoming";
    }

    if (now > endDate) {
      return "closed";
    }
  }

  // Fallback to backend status.
  if (
    ["active", "ongoing"].includes(status)
  ) {
    return "ongoing";
  }

  if (
    ["upcoming", "scheduled", "pending"].includes(status)
  ) {
    return "upcoming";
  }

  return "upcoming";
};

const normalizeElection = (election) => {
  const dateParts = formatDateParts(
    election.start_at
  );

  const state = getElectionStatus(election);

  const candidateCount =
    election.candidate_count ??
    election.candidateCount ??
    election.candidates ??
    0;

  const daysLeft = getDaysDifference(
    election.end_at
  );

  let closes = "Election period";

  if (state === "ongoing") {
    if (daysLeft === null) {
      closes = `Ends: ${formatDateTime(
        election.end_at
      )}`;
    } else if (daysLeft <= 0) {
      closes = "Closes today";
    } else if (daysLeft === 1) {
      closes = "Closes in 1 day";
    } else {
      closes = `Closes in ${daysLeft} days`;
    }
  }

  if (state === "upcoming") {
    const daysUntilStart = getDaysDifference(
      election.start_at
    );

    if (
      daysUntilStart !== null &&
      daysUntilStart <= 0
    ) {
      closes = "Starting soon";
    } else if (daysUntilStart === 1) {
      closes = "Starts in 1 day";
    } else if (daysUntilStart !== null) {
      closes = `Starts in ${daysUntilStart} days`;
    } else {
      closes = `Starts: ${formatDateTime(
        election.start_at
      )}`;
    }
  }

  return {
    ...election,

    displayStatus: state,

    month: dateParts.month,
    day: dateParts.day,
    year: dateParts.year,

    body:
      election.description ||
      election.type ||
      "District Bar Association Election",

    candidates: Number(candidateCount),

    closes,
  };
};

// ======================================================
// ELECTION ROW
// ======================================================

function ElectionRow({
  election,
  onView,
}) {
  const isOngoing =
    election.displayStatus === "ongoing";

  return (
    <article className="el-card">

      {/* Left Accent */}
      <div
        className={`el-accent ${isOngoing
            ? "ongoing"
            : "upcoming"
          }`}
      ></div>


      {/* Date */}
      <div className="el-date">

        <span>
          {election.month}
        </span>

        <strong>
          {election.day}
        </strong>

        <small>
          {election.year}
        </small>

      </div>


      {/* Main Information */}
      <div className="el-content">

        <div className="el-title-row">

          <div>

            <h3>
              {election.title}
            </h3>

            <p className="el-body">
              {election.body}
            </p>

          </div>


          <span
            className={`el-status ${isOngoing
                ? "active"
                : "upcoming"
              }`}
          >

            <i
              className={`bi ${isOngoing
                  ? "bi-broadcast-pin"
                  : "bi-calendar-event"
                }`}
            ></i>

            {isOngoing
              ? "Ongoing"
              : "Upcoming"}

          </span>

        </div>


        {/* Meta Information */}
        <div className="el-meta">

          <span>

            <i className="bi bi-people-fill"></i>

            <b>
              {election.candidates}
            </b>

            Candidates

          </span>


          <span>

            <i className="bi bi-clock-fill"></i>

            {election.closes}

          </span>


          <span>

            <i className="bi bi-shield-check"></i>

            Secure Voting

          </span>

        </div>

      </div>


      {/* Action */}
      <button
        className={`el-action ${!isOngoing
            ? "disabled"
            : ""
          }`}
        onClick={() =>
          onView(election)
        }
        disabled={!isOngoing}
      >

        <span>

          {isOngoing
            ? "View Details"
            : "Coming Soon"}

        </span>

        <i className="bi bi-arrow-right"></i>

      </button>

    </article>
  );
}


// ======================================================
// MAIN COMPONENT
// ======================================================

function Elections() {

  const navigate = useNavigate();

  const [tab, setTab] =
    useState("ongoing");

  const [elections, setElections] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ======================================================
  // LOAD ELECTIONS
  // ======================================================

  useEffect(() => {

    const loadElections = async () => {

      try {

        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {

          setError(
            "Authentication token is missing. Please login again."
          );

          return;
        }

        const data =
          await getElections(token);

        const apiElections =
          Array.isArray(data.elections)
            ? data.elections
            : [];

        const normalized =
          apiElections.map(
            normalizeElection
          );

        setElections(normalized);

      } catch (error) {

        console.error(
          "ELECTIONS ERROR:",
          error
        );

        setError(
          error.message ||
          "Unable to load elections."
        );

      } finally {

        setLoading(false);

      }

    };

    loadElections();

  }, []);


  // ======================================================
  // FILTER CURRENT TAB
  // ======================================================

  const list = useMemo(() => {

    return elections.filter(
      (election) =>
        election.displayStatus === tab
    );

  }, [elections, tab]);


  // ======================================================
  // TAB COUNTS
  // ======================================================

  const ongoingCount =
    elections.filter(
      (election) =>
        election.displayStatus ===
        "ongoing"
    ).length;

  const upcomingCount =
    elections.filter(
      (election) =>
        election.displayStatus ===
        "upcoming"
    ).length;


  // ======================================================
  // VIEW ELECTION
  // ======================================================

  const handleView = (election) => {

    if (
      election.displayStatus !==
      "ongoing"
    ) {
      return;
    }

    // Pass election ID to Cast Vote page.
    navigate(
      `/cast-vote?electionId=${election.id}`
    );

  };


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <DashboardLayout>

      {/* ================= HEADER ================= */}

      <section className="el-page-header">

        <div>

          <div className="el-title-with-icon">

            <div className="el-heading-icon">

              <i className="bi bi-check2-square"></i>

            </div>


            <div>

              <h1 className="dba-page-title">
                Elections
              </h1>

              <p className="dba-page-sub">
                View ongoing and upcoming elections.
              </p>

            </div>

          </div>

        </div>


        <div className="el-header-info">

          <i className="bi bi-shield-check"></i>

          <div>

            <strong>
              Secure Elections
            </strong>

            <small>
              Fair & transparent voting
            </small>

          </div>

        </div>

      </section>


      {/* ================= TABS ================= */}

      <div className="el-tabs-wrapper">

        <div className="dba-tabs el-tabs">

          <button
            className={`dba-tab ${tab === "ongoing"
                ? "active"
                : ""
              }`}
            onClick={() =>
              setTab("ongoing")
            }
          >

            <i className="bi bi-broadcast-pin"></i>

            Ongoing Elections

            {tab === "ongoing" && (

              <span className="el-tab-count">
                {ongoingCount}
              </span>

            )}

          </button>


          <button
            className={`dba-tab ${tab === "upcoming"
                ? "active"
                : ""
              }`}
            onClick={() =>
              setTab("upcoming")
            }
          >

            <i className="bi bi-calendar-event"></i>

            Upcoming Elections

            {tab === "upcoming" && (

              <span className="el-tab-count">
                {upcomingCount}
              </span>

            )}

          </button>

        </div>

      </div>


      {/* ================= SUMMARY ================= */}

      <div className="el-summary">

        <div className="el-summary-text">

          <span className="el-summary-dot"></span>

          {tab === "ongoing"
            ? "Elections currently open for members"
            : "Elections scheduled for upcoming dates"}

        </div>


        <span className="el-summary-count">

          {list.length} Election
          {list.length !== 1
            ? "s"
            : ""}

        </span>

      </div>


      {/* ================= LOADING ================= */}

      {loading && (

        <section className="el-list">

          <div className="el-empty">

            <div className="el-empty-icon">

              <i className="bi bi-hourglass-split"></i>

            </div>

            <h3>
              Loading Elections...
            </h3>

            <p>
              Please wait while we fetch the latest election information.
            </p>

          </div>

        </section>

      )}


      {/* ================= ERROR ================= */}

      {!loading && error && (

        <section className="el-list">

          <div className="el-empty">

            <div className="el-empty-icon">

              <i className="bi bi-exclamation-triangle"></i>

            </div>

            <h3>
              Unable to Load Elections
            </h3>

            <p>
              {error}
            </p>

          </div>

        </section>

      )}


      {/* ================= ELECTION LIST ================= */}

      {!loading &&
        !error && (

          <section className="el-list">

            {list.length > 0 ? (

              list.map(
                (election) => (

                  <ElectionRow
                    key={election.id}
                    election={election}
                    onView={handleView}
                  />

                )
              )

            ) : (

              <div className="el-empty">

                <div className="el-empty-icon">

                  <i className="bi bi-calendar-x"></i>

                </div>

                <h3>
                  No Elections Found
                </h3>

                <p>

                  There are no elections available
                  in this category at the moment.

                </p>

              </div>

            )}

          </section>

        )}


      {/* ================= INFORMATION STRIP ================= */}

      <section className="el-info-strip">

        <div className="el-info-icon">

          <i className="bi bi-info-circle-fill"></i>

        </div>


        <div>

          <strong>
            Your vote matters.
          </strong>

          <p>

            Participate in the election and help
            shape the future of your Bar Association.

          </p>

        </div>


        <i className="bi bi-arrow-up-right-circle-fill"></i>

      </section>


      {/* ================= IMAGE BANNER ================= */}

      <section
        className="el-band"
        style={{
          backgroundImage:
            `url(${LahoreHighCourt})`,
        }}
      >

        <div className="el-band-overlay"></div>


        <div className="el-band-content">

          <span className="el-band-mark">
            “
          </span>


          <div>

            <h2>

              Fair Elections
              <br />
              Stronger Representation

            </h2>

            <p>
              Together for a fairer tomorrow.
            </p>

          </div>

        </div>


        <i className="bi bi-bank el-band-icon"></i>

      </section>

    </DashboardLayout>

  );
}

export default Elections;