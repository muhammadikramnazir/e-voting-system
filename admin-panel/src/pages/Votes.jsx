import { useEffect, useMemo, useState } from "react";
import "./Votes.css";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";

function Votes() {
    const [votes, setVotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [electionFilter, setElectionFilter] =
        useState("All Elections");
    const [positionFilter, setPositionFilter] =
        useState("All Positions");
    const [statusFilter, setStatusFilter] =
        useState("All Status");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    /* =========================
       AUTH HEADERS
    ========================= */

    const getHeaders = () => {
        const token = localStorage.getItem("adminToken");

        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    };

    /* =========================
       LOAD VOTES
    ========================= */

    const fetchVotes = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/admin/votes`,
                {
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message || "Failed to load votes."
                );
            }

            setVotes(data.votes || []);
        } catch (err) {
            console.error("FETCH VOTES ERROR:", err);

            setError(
                err.message || "Failed to load voting records."
            );
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       INITIAL LOAD
    ========================= */

    useEffect(() => {
        fetchVotes();
    }, []);

    /* =========================
       NORMALIZE VOTE
    ========================= */

    const normalizeVote = (vote) => ({
        id: vote.id,

        voter:
            vote.voter_name ||
            vote.voter ||
            "Unknown Voter",

        voterId:
            vote.voter_bar_number ||
            vote.voter_id ||
            "N/A",

        election:
            vote.election ||
            "Unknown Election",

        electionId:
            vote.election_id,

        position:
            vote.position ||
            "Unknown Position",

        positionId:
            vote.position_id,

        candidate:
            vote.candidate ||
            "Unknown Candidate",

        candidateId:
            vote.candidate_id,

        votedAt:
            vote.created_at,

        status:
            vote.status ||
            "Valid",
    });

    /* =========================
       NORMALIZED DATA
    ========================= */

    const normalizedVotes = useMemo(() => {
        return votes.map(normalizeVote);
    }, [votes]);

    /* =========================
       ELECTION OPTIONS
    ========================= */

    const electionOptions = useMemo(() => {
        const unique = new Map();

        normalizedVotes.forEach((vote) => {
            if (vote.election) {
                unique.set(
                    String(vote.electionId),
                    vote.election
                );
            }
        });

        return Array.from(unique.entries()).map(
            ([id, title]) => ({
                id,
                title,
            })
        );
    }, [normalizedVotes]);

    /* =========================
       POSITION OPTIONS
    ========================= */

    const positionOptions = useMemo(() => {
        const unique = new Map();

        normalizedVotes.forEach((vote) => {
            if (vote.position) {
                unique.set(
                    String(vote.positionId),
                    vote.position
                );
            }
        });

        return Array.from(unique.entries()).map(
            ([id, name]) => ({
                id,
                name,
            })
        );
    }, [normalizedVotes]);

    /* =========================
       STATS
    ========================= */

    const stats = useMemo(() => {
        const validVotes = normalizedVotes.filter(
            (vote) => vote.status === "Valid"
        ).length;

        const invalidVotes = normalizedVotes.filter(
            (vote) => vote.status === "Invalid"
        ).length;

        const uniqueVoters = new Set(
            normalizedVotes.map(
                (vote) => vote.voterId
            )
        ).size;

        return {
            total: normalizedVotes.length,
            valid: validVotes,
            invalid: invalidVotes,
            voters: uniqueVoters,
        };
    }, [normalizedVotes]);

    /* =========================
       FILTER
    ========================= */

    const filteredVotes = useMemo(() => {
        return normalizedVotes.filter((vote) => {
            const searchText =
                search.toLowerCase().trim();

            const searchMatch =
                !searchText ||
                vote.voter
                    .toLowerCase()
                    .includes(searchText) ||
                String(vote.voterId)
                    .toLowerCase()
                    .includes(searchText) ||
                vote.position
                    .toLowerCase()
                    .includes(searchText) ||
                vote.election
                    .toLowerCase()
                    .includes(searchText);

            const electionMatch =
                electionFilter === "All Elections" ||
                String(vote.electionId) ===
                String(electionFilter);

            const positionMatch =
                positionFilter === "All Positions" ||
                String(vote.positionId) ===
                String(positionFilter);

            const statusMatch =
                statusFilter === "All Status" ||
                vote.status === statusFilter;

            return (
                searchMatch &&
                electionMatch &&
                positionMatch &&
                statusMatch
            );
        });
    }, [
        normalizedVotes,
        search,
        electionFilter,
        positionFilter,
        statusFilter,
    ]);

    /* =========================
       INITIALS
    ========================= */

    const getInitials = (name = "") => {
        return name
            .split(" ")
            .filter(Boolean)
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    /* =========================
       DATE FORMAT
    ========================= */

    const formatDateTime = (dateValue) => {
        if (!dateValue) {
            return "N/A";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return String(dateValue);
        }

        return date.toLocaleString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    /* =========================
       UPDATE STATUS
    ========================= */

    const updateVoteStatus = async (id, status) => {
        try {
            setUpdatingId(id);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/admin/votes/${id}/status`,
                {
                    method: "PATCH",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        status,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    "Failed to update vote status."
                );
            }

            setSuccess(
                `Vote marked ${status.toLowerCase()} successfully.`
            );

            await fetchVotes();

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error(
                "UPDATE VOTE STATUS ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to update vote status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    /* =========================
       DELETE
       
       Backend currently does NOT
       expose a DELETE /votes/:id
       endpoint, so we do not send
       a fake request.
    ========================= */
    const deleteVote = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to permanently delete this vote record?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");
            setUpdatingId(id);

            const response = await fetch(
                `${API_URL}/admin/votes/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    "Failed to delete vote."
                );
            }

            setSuccess(
                "Vote deleted successfully."
            );

            await fetchVotes();

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error(
                "DELETE VOTE ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to delete vote."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="votes-page">

            {/* ================= HEADER ================= */}

            <div className="votes-header">

                <div>
                    <h2>Votes</h2>

                    <p>
                        Monitor voting activity and vote records.
                    </p>
                </div>

                <div className="votes-header-badge">
                    <i className="bi bi-shield-check"></i>
                    Secure Voting System
                </div>

            </div>

            {/* ================= ERROR ================= */}

            {error && (
                <div
                    style={{
                        background: "#fef2f2",
                        color: "#b91c1c",
                        border: "1px solid #fecaca",
                        padding: "12px 15px",
                        borderRadius: "8px",
                        marginBottom: "18px",
                        fontSize: "13px",
                    }}
                >
                    {error}
                </div>
            )}

            {/* ================= SUCCESS ================= */}

            {success && (
                <div
                    style={{
                        background: "#ecfdf5",
                        color: "#047857",
                        border: "1px solid #a7f3d0",
                        padding: "12px 15px",
                        borderRadius: "8px",
                        marginBottom: "18px",
                        fontSize: "13px",
                    }}
                >
                    {success}
                </div>
            )}

            {/* ================= STATS ================= */}

            <div className="votes-stats">

                <div className="vote-stat-card">

                    <div className="vote-stat-icon blue">
                        <i className="bi bi-check2-square"></i>
                    </div>

                    <div>
                        <span>Total Votes</span>
                        <h3>{stats.total}</h3>
                    </div>

                </div>

                <div className="vote-stat-card">

                    <div className="vote-stat-icon green">
                        <i className="bi bi-check-circle"></i>
                    </div>

                    <div>
                        <span>Valid Votes</span>
                        <h3>{stats.valid}</h3>
                    </div>

                </div>

                <div className="vote-stat-card">

                    <div className="vote-stat-icon red">
                        <i className="bi bi-x-circle"></i>
                    </div>

                    <div>
                        <span>Invalid Votes</span>
                        <h3>{stats.invalid}</h3>
                    </div>

                </div>

                <div className="vote-stat-card">

                    <div className="vote-stat-icon purple">
                        <i className="bi bi-people"></i>
                    </div>

                    <div>
                        <span>Unique Voters</span>
                        <h3>{stats.voters}</h3>
                    </div>

                </div>

            </div>

            {/* ================= PRIVACY ================= */}

            <div className="vote-privacy-notice">

                <div className="privacy-icon">
                    <i className="bi bi-lock-fill"></i>
                </div>

                <div>

                    <strong>
                        Vote Privacy Protected
                    </strong>

                    <p>
                        This admin view tracks voting activity
                        and turnout. Individual voter choices
                        should remain confidential.
                    </p>

                </div>

            </div>

            {/* ================= FILTERS ================= */}

            <div className="votes-filter-card">

                <div className="votes-search">

                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        placeholder="Search voter, ID..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>

                <select
                    value={electionFilter}
                    onChange={(e) =>
                        setElectionFilter(e.target.value)
                    }
                >

                    <option value="All Elections">
                        All Elections
                    </option>

                    {electionOptions.map(
                        (election) => (
                            <option
                                key={election.id}
                                value={election.id}
                            >
                                {election.title}
                            </option>
                        )
                    )}

                </select>

                <select
                    value={positionFilter}
                    onChange={(e) =>
                        setPositionFilter(e.target.value)
                    }
                >

                    <option value="All Positions">
                        All Positions
                    </option>

                    {positionOptions.map(
                        (position) => (
                            <option
                                key={position.id}
                                value={position.id}
                            >
                                {position.name}
                            </option>
                        )
                    )}

                </select>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }
                >

                    <option value="All Status">
                        All Status
                    </option>

                    <option value="Valid">
                        Valid
                    </option>

                    <option value="Invalid">
                        Invalid
                    </option>

                </select>

            </div>

            {/* ================= TABLE ================= */}

            <div className="votes-table-card">

                <div className="votes-table-top">

                    <div>

                        <h3>
                            Voting Records
                        </h3>

                        <span>
                            {loading
                                ? "Loading voting records..."
                                : `${filteredVotes.length} records found`}
                        </span>

                    </div>

                </div>

                <div className="table-responsive">

                    <table className="votes-table">

                        <thead>

                            <tr>

                                <th>#</th>

                                <th>
                                    Voter
                                </th>

                                <th>
                                    Election
                                </th>

                                <th>
                                    Position
                                </th>

                                <th>
                                    Voted At
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>

                                    <td colSpan="7">

                                        <div className="no-votes">

                                            <i className="bi bi-arrow-repeat"></i>

                                            <h4>
                                                Loading Votes...
                                            </h4>

                                            <p>
                                                Please wait while
                                                voting records are
                                                being loaded.
                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            ) : filteredVotes.length > 0 ? (

                                filteredVotes.map(
                                    (vote, index) => (

                                        <tr key={vote.id}>

                                            <td>
                                                {index + 1}
                                            </td>

                                            {/* VOTER */}

                                            <td>

                                                <div className="voter-name">

                                                    <div className="voter-avatar">
                                                        {getInitials(
                                                            vote.voter
                                                        )}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {vote.voter}
                                                        </strong>

                                                        <span>
                                                            {vote.voterId}
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* ELECTION */}

                                            <td>

                                                <span className="vote-election">
                                                    {vote.election}
                                                </span>

                                            </td>

                                            {/* POSITION */}

                                            <td>

                                                <span className="vote-position">
                                                    {vote.position}
                                                </span>

                                            </td>

                                            {/* TIME */}

                                            <td>

                                                <span className="voted-time">

                                                    <i className="bi bi-clock"></i>

                                                    {formatDateTime(
                                                        vote.votedAt
                                                    )}

                                                </span>

                                            </td>

                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={`vote-status ${vote.status.toLowerCase()}`}
                                                >

                                                    <span></span>

                                                    {vote.status}

                                                </span>

                                            </td>

                                            {/* ACTIONS */}

                                            <td>

                                                <div className="vote-actions">

                                                    {vote.status ===
                                                        "Valid" ? (

                                                        <button
                                                            className="vote-invalid-btn"
                                                            title="Mark Invalid"
                                                            disabled={
                                                                updatingId ===
                                                                vote.id
                                                            }
                                                            onClick={() =>
                                                                updateVoteStatus(
                                                                    vote.id,
                                                                    "Invalid"
                                                                )
                                                            }
                                                        >

                                                            <i className="bi bi-x-lg"></i>

                                                        </button>

                                                    ) : (

                                                        <button
                                                            className="vote-valid-btn"
                                                            title="Mark Valid"
                                                            disabled={
                                                                updatingId ===
                                                                vote.id
                                                            }
                                                            onClick={() =>
                                                                updateVoteStatus(
                                                                    vote.id,
                                                                    "Valid"
                                                                )
                                                            }
                                                        >

                                                            <i className="bi bi-check-lg"></i>

                                                        </button>

                                                    )}

                                                    <button
                                                        className="vote-delete-btn"
                                                        title="Delete Record"
                                                        onClick={() =>
                                                            deleteVote(
                                                                vote.id
                                                            )
                                                        }
                                                    >

                                                        <i className="bi bi-trash"></i>

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <tr>

                                    <td colSpan="7">

                                        <div className="no-votes">

                                            <i className="bi bi-inbox"></i>

                                            <h4>
                                                No voting records found
                                            </h4>

                                            <p>
                                                Try changing your
                                                search or filters.
                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default Votes;