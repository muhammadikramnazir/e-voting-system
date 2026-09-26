import { useEffect, useMemo, useState } from "react";
import "./Candidates.css";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";

function Candidates() {
    const [candidates, setCandidates] = useState([]);
    const [elections, setElections] = useState([]);
    const [positions, setPositions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [electionLoading, setElectionLoading] = useState(true);
    const [positionLoading, setPositionLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [electionFilter, setElectionFilter] = useState("All Elections");
    const [positionFilter, setPositionFilter] = useState("All Positions");
    const [statusFilter, setStatusFilter] = useState("All Status");

    const [showModal, setShowModal] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        barNumber: "",
        electionId: "",
        positionId: "",
        photo: "",
        nomination: "Under Review",
        manifesto: "",
        status: "Pending",
    });

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
       LOAD ELECTIONS
    ========================= */

    const fetchElections = async () => {
        try {
            setElectionLoading(true);

            const response = await fetch(`${API_URL}/admin/elections`, {
                headers: getHeaders(),
            });

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message || "Failed to load elections."
                );
            }

            setElections(data.elections || []);
        } catch (err) {
            console.error("FETCH ELECTIONS ERROR:", err);
            setError(err.message || "Failed to load elections.");
        } finally {
            setElectionLoading(false);
        }
    };

    /* =========================
       LOAD POSITIONS
    ========================= */

    const fetchPositions = async () => {
        try {
            setPositionLoading(true);

            const response = await fetch(`${API_URL}/admin/positions`, {
                headers: getHeaders(),
            });

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message || "Failed to load positions."
                );
            }

            setPositions(data.positions || []);
        } catch (err) {
            console.error("FETCH POSITIONS ERROR:", err);
            setError(err.message || "Failed to load positions.");
        } finally {
            setPositionLoading(false);
        }
    };

    /* =========================
       LOAD CANDIDATES
    ========================= */

    const fetchCandidates = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_URL}/admin/candidates`, {
                headers: getHeaders(),
            });

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message || "Failed to load candidates."
                );
            }

            setCandidates(data.candidates || []);
        } catch (err) {
            console.error("FETCH CANDIDATES ERROR:", err);
            setError(err.message || "Failed to load candidates.");
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       INITIAL LOAD
    ========================= */

    useEffect(() => {
        fetchElections();
        fetchPositions();
        fetchCandidates();
    }, []);

    /* =========================
       HELPERS
    ========================= */

    const getElectionId = (candidate) => {
        return candidate.election_id ?? candidate.electionId;
    };

    const getPositionId = (candidate) => {
        return candidate.position_id ?? candidate.positionId;
    };

    const getElectionTitle = (electionId) => {
        const election = elections.find(
            (item) => Number(item.id) === Number(electionId)
        );

        return election?.title || "Unknown Election";
    };

    const getPositionName = (positionId) => {
        const position = positions.find(
            (item) => Number(item.id) === Number(positionId)
        );

        return position?.name || "Unknown Position";
    };

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
       FILTER POSITIONS BY ELECTION
    ========================= */

    const availablePositions = useMemo(() => {
        if (!formData.electionId) {
            return [];
        }

        return positions.filter(
            (position) =>
                Number(
                    position.election_id ?? position.electionId
                ) === Number(formData.electionId)
        );
    }, [positions, formData.electionId]);

    /* =========================
       STATS
    ========================= */

    const stats = useMemo(() => {
        return {
            total: candidates.length,

            approved: candidates.filter(
                (candidate) =>
                    String(candidate.status).toLowerCase() ===
                    "approved"
            ).length,

            pending: candidates.filter(
                (candidate) =>
                    String(candidate.status).toLowerCase() ===
                    "pending"
            ).length,

            rejected: candidates.filter(
                (candidate) =>
                    String(candidate.status).toLowerCase() ===
                    "rejected"
            ).length,
        };
    }, [candidates]);

    /* =========================
       FILTER CANDIDATES
    ========================= */

    const filteredCandidates = useMemo(() => {
        return candidates.filter((candidate) => {
            const electionName = getElectionTitle(
                getElectionId(candidate)
            );

            const positionName = getPositionName(
                getPositionId(candidate)
            );

            const searchText = search.toLowerCase().trim();

            const searchMatch =
                String(candidate.name || "")
                    .toLowerCase()
                    .includes(searchText) ||
                String(candidate.bar_number || candidate.barNumber || "")
                    .toLowerCase()
                    .includes(searchText) ||
                positionName.toLowerCase().includes(searchText) ||
                electionName.toLowerCase().includes(searchText);

            const electionMatch =
                electionFilter === "All Elections" ||
                String(getElectionId(candidate)) ===
                String(electionFilter);

            const positionMatch =
                positionFilter === "All Positions" ||
                String(getPositionId(candidate)) ===
                String(positionFilter);

            const statusMatch =
                statusFilter === "All Status" ||
                String(candidate.status).toLowerCase() ===
                statusFilter.toLowerCase();

            return (
                searchMatch &&
                electionMatch &&
                positionMatch &&
                statusMatch
            );
        });
    }, [
        candidates,
        elections,
        positions,
        search,
        electionFilter,
        positionFilter,
        statusFilter,
    ]);

    /* =========================
       OPEN ADD MODAL
    ========================= */

    const openAddModal = () => {
        setEditingCandidate(null);

        setFormData({
            name: "",
            barNumber: "",
            electionId: elections.length > 0 ? elections[0].id : "",
            positionId: "",
            photo: "",
            nomination: "Under Review",
            manifesto: "",
            status: "Pending",
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    /* =========================
       OPEN EDIT MODAL
    ========================= */

    const openEditModal = (candidate) => {
        setEditingCandidate(candidate);

        setFormData({
            name: candidate.name || "",
            barNumber:
                candidate.bar_number ??
                candidate.barNumber ??
                "",
            electionId:
                candidate.election_id ??
                candidate.electionId ??
                "",
            positionId:
                candidate.position_id ??
                candidate.positionId ??
                "",
            photo: candidate.photo || "",
            nomination: candidate.nomination || "Under Review",
            manifesto: candidate.manifesto || "",
            status: candidate.status || "Pending",
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    /* =========================
       CLOSE MODAL
    ========================= */

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingCandidate(null);
        setError("");
        setSuccess("");
    };

    /* =========================
       FORM CHANGE
    ========================= */

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const updated = {
                ...prev,
                [name]: value,
            };

            if (name === "electionId") {
                updated.positionId = "";
            }

            return updated;
        });
    };

    /* =========================
       CREATE CANDIDATE
    ========================= */

    const createCandidate = async () => {
        const response = await fetch(
            `${API_URL}/admin/candidates`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    election_id: Number(formData.electionId),
                    position_id: Number(formData.positionId),
                    name: formData.name.trim(),
                    bar_number: formData.barNumber.trim(),
                    photo: formData.photo.trim(),
                    nomination: formData.nomination,
                    manifesto: formData.manifesto.trim(),
                    status: formData.status,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok || !data.status) {
            throw new Error(
                data.message || "Failed to create candidate."
            );
        }

        return data;
    };

    /* =========================
       UPDATE CANDIDATE
    ========================= */

    const updateCandidate = async () => {
        const response = await fetch(
            `${API_URL}/admin/candidates/${editingCandidate.id}`,
            {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({
                    electionId: Number(formData.electionId),
                    positionId: Number(formData.positionId),
                    name: formData.name.trim(),
                    barNumber: formData.barNumber.trim(),
                    photo: formData.photo.trim(),
                    nomination: formData.nomination,
                    manifesto: formData.manifesto.trim(),
                    status: formData.status,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok || !data.status) {
            throw new Error(
                data.message || "Failed to update candidate."
            );
        }

        return data;
    };

    /* =========================
       SUBMIT
    ========================= */

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.name.trim()) {
            setError("Please enter candidate name.");
            return;
        }

        if (!formData.barNumber.trim()) {
            setError("Please enter bar number.");
            return;
        }

        if (!formData.electionId) {
            setError("Please select an election.");
            return;
        }

        if (!formData.positionId) {
            setError("Please select a position.");
            return;
        }

        try {
            setSaving(true);

            if (editingCandidate) {
                await updateCandidate();

                setSuccess(
                    "Candidate updated successfully."
                );
            } else {
                await createCandidate();

                setSuccess(
                    "Candidate created successfully."
                );
            }

            await fetchCandidates();

            setTimeout(() => {
                setShowModal(false);
                setEditingCandidate(null);
                setSuccess("");
            }, 1200);
        } catch (err) {
            console.error("SAVE CANDIDATE ERROR:", err);

            setError(
                err.message ||
                "Something went wrong while saving candidate."
            );
        } finally {
            setSaving(false);
        }
    };

    /* =========================
       DELETE
    ========================= */

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this candidate?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/admin/candidates/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    "Failed to delete candidate."
                );
            }

            setSuccess(
                "Candidate deleted successfully."
            );

            await fetchCandidates();

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error("DELETE CANDIDATE ERROR:", err);

            setError(
                err.message ||
                "Failed to delete candidate."
            );
        }
    };

    /* =========================
       STATUS UPDATE
    ========================= */

    const updateStatus = async (id, status) => {
        try {
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/admin/candidates/${id}/status`,
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
                    "Failed to update candidate status."
                );
            }

            setSuccess(
                `Candidate ${status.toLowerCase()} successfully.`
            );

            await fetchCandidates();

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error(
                "UPDATE CANDIDATE STATUS ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to update candidate status."
            );
        }
    };

    return (
        <div className="candidates-page">

            {/* ================= HEADER ================= */}

            <div className="candidates-header">
                <div>
                    <h2>Candidates</h2>
                    <p>
                        Manage election candidates and nominations.
                    </p>
                </div>

                <button
                    className="add-candidate-btn"
                    onClick={openAddModal}
                    disabled={
                        electionLoading ||
                        positionLoading ||
                        elections.length === 0
                    }
                >
                    <i className="bi bi-plus-lg"></i>
                    Add Candidate
                </button>
            </div>

            {/* ================= GLOBAL ERROR ================= */}

            {error && !showModal && (
                <div
                    style={{
                        background: "#fef2f2",
                        color: "#b91c1c",
                        border: "1px solid #fecaca",
                        padding: "12px 15px",
                        borderRadius: "8px",
                        marginBottom: "18px",
                        fontSize: "14px",
                    }}
                >
                    {error}
                </div>
            )}

            {success && !showModal && (
                <div
                    style={{
                        background: "#ecfdf5",
                        color: "#047857",
                        border: "1px solid #a7f3d0",
                        padding: "12px 15px",
                        borderRadius: "8px",
                        marginBottom: "18px",
                        fontSize: "14px",
                    }}
                >
                    {success}
                </div>
            )}

            {/* ================= STATS ================= */}

            <div className="candidate-stats">

                <div className="candidate-stat-card">
                    <div className="candidate-stat-icon blue">
                        <i className="bi bi-people"></i>
                    </div>

                    <div>
                        <span>Total Candidates</span>
                        <h3>{stats.total}</h3>
                    </div>
                </div>

                <div className="candidate-stat-card">
                    <div className="candidate-stat-icon green">
                        <i className="bi bi-check-circle"></i>
                    </div>

                    <div>
                        <span>Approved</span>
                        <h3>{stats.approved}</h3>
                    </div>
                </div>

                <div className="candidate-stat-card">
                    <div className="candidate-stat-icon orange">
                        <i className="bi bi-hourglass-split"></i>
                    </div>

                    <div>
                        <span>Pending</span>
                        <h3>{stats.pending}</h3>
                    </div>
                </div>

                <div className="candidate-stat-card">
                    <div className="candidate-stat-icon red">
                        <i className="bi bi-x-circle"></i>
                    </div>

                    <div>
                        <span>Rejected</span>
                        <h3>{stats.rejected}</h3>
                    </div>
                </div>

            </div>

            {/* ================= FILTERS ================= */}

            <div className="candidate-filter-card">

                <div className="candidate-search">
                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        placeholder="Search candidate, bar number..."
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

                    {elections.map((election) => (
                        <option
                            key={election.id}
                            value={election.id}
                        >
                            {election.title}
                        </option>
                    ))}
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

                    {positions.map((position) => (
                        <option
                            key={position.id}
                            value={position.id}
                        >
                            {position.name}
                        </option>
                    ))}
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

                    <option value="Approved">
                        Approved
                    </option>

                    <option value="Pending">
                        Pending
                    </option>

                    <option value="Rejected">
                        Rejected
                    </option>
                </select>

            </div>

            {/* ================= TABLE ================= */}

            <div className="candidates-table-card">

                <div className="candidate-table-top">
                    <div>
                        <h3>Election Candidates</h3>

                        <span>
                            {loading
                                ? "Loading candidates..."
                                : `${filteredCandidates.length} candidates found`}
                        </span>
                    </div>
                </div>

                <div className="table-responsive">

                    <table className="candidates-table">

                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Candidate</th>
                                <th>Bar Number</th>
                                <th>Election</th>
                                <th>Position</th>
                                <th>Nomination</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>
                                    <td colSpan="8">

                                        <div className="no-candidates">
                                            <i className="bi bi-arrow-repeat"></i>

                                            <h4>
                                                Loading Candidates...
                                            </h4>

                                            <p>
                                                Please wait while candidates
                                                are being loaded.
                                            </p>
                                        </div>

                                    </td>
                                </tr>
                            ) : filteredCandidates.length > 0 ? (
                                filteredCandidates.map(
                                    (candidate, index) => {

                                        const electionName =
                                            getElectionTitle(
                                                getElectionId(candidate)
                                            );

                                        const positionName =
                                            getPositionName(
                                                getPositionId(candidate)
                                            );

                                        const status =
                                            candidate.status ||
                                            "Pending";

                                        const nomination =
                                            candidate.nomination ||
                                            "Under Review";

                                        return (
                                            <tr
                                                key={
                                                    candidate.id
                                                }
                                            >

                                                <td>
                                                    {index + 1}
                                                </td>

                                                <td>
                                                    <div className="candidate-name">

                                                        <div className="candidate-avatar">
                                                            {getInitials(
                                                                candidate.name
                                                            )}
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {
                                                                    candidate.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                Election Candidate
                                                            </span>
                                                        </div>

                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="bar-number">
                                                        {
                                                            candidate.bar_number ??
                                                            candidate.barNumber
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="candidate-election">
                                                        {electionName}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="position-badge">
                                                        {positionName}
                                                    </span>
                                                </td>

                                                <td>

                                                    <span
                                                        className={`nomination-badge ${nomination ===
                                                                "Verified"
                                                                ? "verified"
                                                                : nomination ===
                                                                    "Rejected"
                                                                    ? "rejected"
                                                                    : "review"
                                                            }`}
                                                    >
                                                        {nomination}
                                                    </span>

                                                </td>

                                                <td>

                                                    <span
                                                        className={`candidate-status ${String(
                                                            status
                                                        ).toLowerCase()}`}
                                                    >
                                                        <span></span>
                                                        {status}
                                                    </span>

                                                </td>

                                                <td>

                                                    <div className="candidate-actions">

                                                        <button
                                                            className="candidate-edit-btn"
                                                            title="Edit Candidate"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    candidate
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>

                                                        {status !==
                                                            "Approved" && (
                                                                <button
                                                                    className="candidate-approve-btn"
                                                                    title="Approve"
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            candidate.id,
                                                                            "Approved"
                                                                        )
                                                                    }
                                                                >
                                                                    <i className="bi bi-check-lg"></i>
                                                                </button>
                                                            )}

                                                        {status !==
                                                            "Rejected" && (
                                                                <button
                                                                    className="candidate-reject-btn"
                                                                    title="Reject"
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            candidate.id,
                                                                            "Rejected"
                                                                        )
                                                                    }
                                                                >
                                                                    <i className="bi bi-x-lg"></i>
                                                                </button>
                                                            )}

                                                        <button
                                                            className="candidate-delete-btn"
                                                            title="Delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    candidate.id
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )
                            ) : (
                                <tr>
                                    <td colSpan="8">

                                        <div className="no-candidates">

                                            <i className="bi bi-person-x"></i>

                                            <h4>
                                                No candidates found
                                            </h4>

                                            <p>
                                                Try changing your search or
                                                filters.
                                            </p>

                                        </div>

                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* ================= MODAL ================= */}

            {showModal && (
                <div className="candidate-modal-overlay">

                    <div className="candidate-modal">

                        <div className="candidate-modal-header">

                            <div>

                                <h3>
                                    {editingCandidate
                                        ? "Edit Candidate"
                                        : "Add Candidate"}
                                </h3>

                                <p>
                                    {editingCandidate
                                        ? "Update candidate information."
                                        : "Add a new candidate to an election."}
                                </p>

                            </div>

                            <button
                                className="candidate-modal-close"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <form onSubmit={handleSubmit}>

                            {error && (
                                <div
                                    style={{
                                        background: "#fef2f2",
                                        color: "#b91c1c",
                                        border: "1px solid #fecaca",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        marginBottom: "18px",
                                        fontSize: "13px",
                                    }}
                                >
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div
                                    style={{
                                        background: "#ecfdf5",
                                        color: "#047857",
                                        border: "1px solid #a7f3d0",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        marginBottom: "18px",
                                        fontSize: "13px",
                                    }}
                                >
                                    {success}
                                </div>
                            )}

                            {/* NAME */}

                            <div className="form-group">

                                <label>
                                    Candidate Name <span>*</span>
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    placeholder="e.g. Muhammad Ahmed"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            {/* BAR NUMBER */}

                            <div className="form-group">

                                <label>
                                    Bar Number <span>*</span>
                                </label>

                                <input
                                    type="text"
                                    name="barNumber"
                                    placeholder="e.g. DBA-1021"
                                    value={formData.barNumber}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            {/* ELECTION + POSITION */}

                            <div className="form-row">

                                <div className="form-group">

                                    <label>
                                        Election <span>*</span>
                                    </label>

                                    <select
                                        name="electionId"
                                        value={
                                            formData.electionId
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        disabled={
                                            electionLoading
                                        }
                                    >

                                        <option value="">
                                            {electionLoading
                                                ? "Loading Elections..."
                                                : "Select Election"}
                                        </option>

                                        {elections.map(
                                            (election) => (
                                                <option
                                                    key={
                                                        election.id
                                                    }
                                                    value={
                                                        election.id
                                                    }
                                                >
                                                    {
                                                        election.title
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Position <span>*</span>
                                    </label>

                                    <select
                                        name="positionId"
                                        value={
                                            formData.positionId
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        disabled={
                                            positionLoading ||
                                            !formData.electionId
                                        }
                                    >

                                        <option value="">
                                            {!formData.electionId
                                                ? "Select Election First"
                                                : positionLoading
                                                    ? "Loading Positions..."
                                                    : availablePositions.length ===
                                                        0
                                                        ? "No Positions Available"
                                                        : "Select Position"}
                                        </option>

                                        {availablePositions.map(
                                            (position) => (
                                                <option
                                                    key={
                                                        position.id
                                                    }
                                                    value={
                                                        position.id
                                                    }
                                                >
                                                    {
                                                        position.name
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                            </div>

                            {/* STATUS + NOMINATION */}

                            <div className="form-row">

                                <div className="form-group">

                                    <label>
                                        Status
                                    </label>

                                    <select
                                        name="status"
                                        value={
                                            formData.status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        <option value="Pending">
                                            Pending
                                        </option>

                                        <option value="Approved">
                                            Approved
                                        </option>

                                        <option value="Rejected">
                                            Rejected
                                        </option>

                                    </select>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Nomination
                                    </label>

                                    <select
                                        name="nomination"
                                        value={
                                            formData.nomination
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        <option value="Under Review">
                                            Under Review
                                        </option>

                                        <option value="Verified">
                                            Verified
                                        </option>

                                        <option value="Rejected">
                                            Rejected
                                        </option>

                                    </select>

                                </div>

                            </div>

                            {/* PHOTO */}

                            <div className="form-group">

                                <label>
                                    Photo URL
                                </label>

                                <input
                                    type="text"
                                    name="photo"
                                    placeholder="Optional candidate photo URL"
                                    value={formData.photo}
                                    onChange={handleChange}
                                />

                            </div>

                            {/* MANIFESTO */}

                            <div className="form-group">

                                <label>
                                    Manifesto
                                </label>

                                <input
                                    type="text"
                                    name="manifesto"
                                    placeholder="Enter candidate manifesto"
                                    value={
                                        formData.manifesto
                                    }
                                    onChange={handleChange}
                                />

                            </div>

                            {/* ACTIONS */}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="candidate-cancel-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="candidate-save-btn"
                                    disabled={saving}
                                >

                                    {saving ? (
                                        <>
                                            <i className="bi bi-arrow-repeat"></i>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg"></i>

                                            {editingCandidate
                                                ? "Update Candidate"
                                                : "Add Candidate"}
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Candidates;