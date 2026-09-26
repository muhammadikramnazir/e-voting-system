import { useEffect, useState } from "react";
import "./Elections.css";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";

const emptyForm = {
    title: "",
    type: "General Election",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    status: "Upcoming",
};

function Elections() {
    const [elections, setElections] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [showModal, setShowModal] = useState(false);
    const [viewingElection, setViewingElection] = useState(null);
    const [editingElection, setEditingElection] = useState(null);

    const [formData, setFormData] = useState(emptyForm);

    const [loading, setLoading] = useState(true);
    const [createLoading, setCreateLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");
    const [deletingElection, setDeletingElection] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // ==========================================
    // ADMIN TOKEN
    // ==========================================

    const getAdminToken = () => {
        return localStorage.getItem("adminToken");
    };

    // ==========================================
    // FETCH ELECTIONS
    // ==========================================

    const fetchElections = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getAdminToken();

            if (!token) {
                setError("Admin authentication token not found.");
                return;
            }

            const response = await fetch(
                `${API_URL}/admin/elections`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok || data.status === false) {
                throw new Error(
                    data.message || "Failed to load elections."
                );
            }

            setElections(
                Array.isArray(data.elections)
                    ? data.elections
                    : []
            );
        } catch (err) {
            console.error("FETCH ELECTIONS ERROR:", err);
            setError(
                err.message || "Failed to load elections."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        fetchElections();
    }, []);

    // ==========================================
    // FORM CHANGE
    // ==========================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ==========================================
    // DATE/TIME HELPERS
    // ==========================================

    const getDatePart = (value) => {
        if (!value) return "";

        const stringValue = String(value);

        if (stringValue.includes("T")) {
            return stringValue.substring(0, 10);
        }

        if (stringValue.includes(" ")) {
            return stringValue.split(" ")[0];
        }

        return stringValue.substring(0, 10);
    };

    const getTimePart = (value) => {
        if (!value) return "";

        const stringValue = String(value);

        if (stringValue.includes("T")) {
            return stringValue.substring(11, 16);
        }

        if (stringValue.includes(" ")) {
            return stringValue
                .split(" ")[1]
                .substring(0, 5);
        }

        return "";
    };

    const formatDateTime = (value) => {
        if (!value) return "-";

        const datePart = getDatePart(value);
        const timePart = getTimePart(value);

        if (!datePart) return "-";

        return `${datePart}${timePart ? ` ${timePart}` : ""}`;
    };

    // ==========================================
    // RESET FORM
    // ==========================================

    const resetForm = () => {
        setFormData(emptyForm);
    };

    // ==========================================
    // CREATE MODAL
    // ==========================================

    const openCreateModal = () => {
        setError("");
        setSuccess("");
        setEditError("");
        setEditSuccess("");

        setEditingElection(null);
        setViewingElection(null);

        resetForm();

        setShowModal(true);
    };

    const closeModal = () => {
        if (createLoading || editLoading) return;

        setShowModal(false);
        setEditingElection(null);
        setError("");
        setSuccess("");
        setEditError("");
        setEditSuccess("");

        resetForm();
    };

    // ==========================================
    // CREATE ELECTION
    // ==========================================

    const handleCreateElection = async (e) => {
        e.preventDefault();

        try {
            setCreateLoading(true);
            setError("");
            setSuccess("");

            const token = getAdminToken();

            if (!token) {
                throw new Error(
                    "Admin authentication token not found."
                );
            }

            if (
                !formData.title.trim() ||
                !formData.startDate ||
                !formData.startTime ||
                !formData.endDate ||
                !formData.endTime
            ) {
                throw new Error(
                    "Title, start date/time and end date/time are required."
                );
            }

            const startAt = `${formData.startDate} ${formData.startTime}:00`;
            const endAt = `${formData.endDate} ${formData.endTime}:00`;

            if (
                new Date(
                    startAt.replace(" ", "T")
                ) >=
                new Date(
                    endAt.replace(" ", "T")
                )
            ) {
                throw new Error(
                    "End date/time must be after start date/time."
                );
            }

            const payload = {
                title: formData.title.trim(),
                type: formData.type,
                description: formData.description.trim(),
                startAt,
                endAt,
                status: formData.status,
            };

            const response = await fetch(
                `${API_URL}/admin/elections`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok || data.status === false) {
                throw new Error(
                    data.message ||
                    "Failed to create election."
                );
            }

            setSuccess(
                data.message ||
                "Election created successfully."
            );

            resetForm();

            await fetchElections();

            setTimeout(() => {
                setShowModal(false);
                setSuccess("");
            }, 1800);
        } catch (err) {
            console.error("CREATE ELECTION ERROR:", err);

            setError(
                err.message ||
                "Failed to create election."
            );
        } finally {
            setCreateLoading(false);
        }
    };

    // ==========================================
    // VIEW ELECTION
    // ==========================================

    const handleViewElection = (election) => {
        setError("");
        setViewingElection(election);
    };

    const closeViewModal = () => {
        setViewingElection(null);
    };

    // ==========================================
    // EDIT ELECTION
    // ==========================================

    const handleEditElection = (election) => {
        setError("");
        setEditError("");
        setEditSuccess("");

        setViewingElection(null);

        setEditingElection(election);

        setFormData({
            title: election.title || "",
            type: election.type || "General Election",
            description: election.description || "",
            startDate: getDatePart(election.start_at),
            startTime: getTimePart(election.start_at),
            endDate: getDatePart(election.end_at),
            endTime: getTimePart(election.end_at),
            status: election.status || "Upcoming",
        });

        setShowModal(true);
    };

    // ==========================================
    // UPDATE ELECTION
    // ==========================================

    const handleUpdateElection = async (e) => {
        e.preventDefault();

        try {
            setEditLoading(true);
            setEditError("");
            setEditSuccess("");

            const token = getAdminToken();

            if (!token) {
                throw new Error(
                    "Admin authentication token not found."
                );
            }

            if (!editingElection?.id) {
                throw new Error(
                    "Election record not found."
                );
            }

            if (
                !formData.title.trim() ||
                !formData.startDate ||
                !formData.startTime ||
                !formData.endDate ||
                !formData.endTime
            ) {
                throw new Error(
                    "Title, start date/time and end date/time are required."
                );
            }

            const startAt = `${formData.startDate} ${formData.startTime}:00`;
            const endAt = `${formData.endDate} ${formData.endTime}:00`;

            if (
                new Date(
                    startAt.replace(" ", "T")
                ) >=
                new Date(
                    endAt.replace(" ", "T")
                )
            ) {
                throw new Error(
                    "End date/time must be after start date/time."
                );
            }

            const payload = {
                title: formData.title.trim(),
                type: formData.type,
                description: formData.description.trim(),
                startAt,
                endAt,
                status: formData.status,
            };

            const response = await fetch(
                `${API_URL}/admin/elections/${editingElection.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok || data.status === false) {
                throw new Error(
                    data.message ||
                    "Failed to update election."
                );
            }

            setEditSuccess(
                data.message ||
                "Election updated successfully."
            );

            await fetchElections();

            setTimeout(() => {
                setShowModal(false);
                setEditingElection(null);
                setEditSuccess("");
                resetForm();
            }, 2200);
        } catch (err) {
            console.error("UPDATE ELECTION ERROR:", err);

            setEditError(
                err.message ||
                "Failed to update election."
            );
        } finally {
            setEditLoading(false);
        }
    };

    // ==========================================
    // DELETE ELECTION
    // ==========================================

    const handleDeleteElection = async () => {
        try {
            setDeleteLoading(true);
            setDeleteError("");

            const token = getAdminToken();

            if (!token) {
                throw new Error(
                    "Admin authentication token not found."
                );
            }

            if (!deletingElection?.id) {
                throw new Error(
                    "Election record not found."
                );
            }

            const response = await fetch(
                `${API_URL}/admin/elections/${deletingElection.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok || data.status === false) {
                throw new Error(
                    data.message ||
                    "Failed to delete election."
                );
            }

            setDeletingElection(null);

            setSuccess(
                data.message ||
                "Election deleted successfully."
            );

            await fetchElections();

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error(
                "DELETE ELECTION ERROR:",
                err
            );

            setDeleteError(
                err.message ||
                "Failed to delete election."
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    // ==========================================
    // FILTER
    // ==========================================

    const filteredElections = elections.filter(
        (election) => {
            const title = String(
                election.title || ""
            ).toLowerCase();

            const type = String(
                election.type || ""
            ).toLowerCase();

            const query = search.toLowerCase();

            const matchesSearch =
                title.includes(query) ||
                type.includes(query);

            const matchesStatus =
                statusFilter === "All" ||
                election.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        }
    );

    // ==========================================
    // STATISTICS
    // ==========================================

    const totalElections =
        elections.length;

    const activeElections =
        elections.filter(
            (election) =>
                election.status === "Active"
        ).length;

    const upcomingElections =
        elections.filter(
            (election) =>
                election.status === "Upcoming"
        ).length;

    const completedElections =
        elections.filter(
            (election) =>
                election.status === "Completed"
        ).length;

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="elections-page">

            {/* PAGE HEADER */}

            <div className="page-header">

                <div>
                    <h2>Elections</h2>

                    <p>
                        Create and manage bar association elections
                    </p>
                </div>

                <button
                    className="add-election-btn"
                    onClick={openCreateModal}
                    type="button"
                >
                    <i className="bi bi-plus-lg"></i>
                    Create Election
                </button>

            </div>

            {/* PAGE ERROR */}

            {error && !showModal && (
                <div
                    style={{
                        marginBottom: "18px",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <i className="bi bi-exclamation-circle"></i>

                    <span style={{ flex: 1 }}>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                        style={{
                            border: "none",
                            background: "transparent",
                            color: "#dc2626",
                            cursor: "pointer",
                        }}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            )}

            {/* STATISTICS */}

            <div className="election-stats">

                <div className="election-stat-card">

                    <div className="election-stat-icon blue">
                        <i className="bi bi-list-check"></i>
                    </div>

                    <div>
                        <span>
                            Total Elections
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : totalElections}
                        </strong>
                    </div>

                </div>

                <div className="election-stat-card">

                    <div className="election-stat-icon green">
                        <i className="bi bi-broadcast"></i>
                    </div>

                    <div>
                        <span>Active</span>

                        <strong>
                            {loading
                                ? "..."
                                : activeElections}
                        </strong>
                    </div>

                </div>

                <div className="election-stat-card">

                    <div className="election-stat-icon orange">
                        <i className="bi bi-calendar-event"></i>
                    </div>

                    <div>
                        <span>Upcoming</span>

                        <strong>
                            {loading
                                ? "..."
                                : upcomingElections}
                        </strong>
                    </div>

                </div>

                <div className="election-stat-card">

                    <div className="election-stat-icon purple">
                        <i className="bi bi-check2-all"></i>
                    </div>

                    <div>
                        <span>Completed</span>

                        <strong>
                            {loading
                                ? "..."
                                : completedElections}
                        </strong>
                    </div>

                </div>

            </div>

            {/* ELECTIONS CARD */}

            <div className="elections-card">

                {/* TOOLBAR */}

                <div className="elections-toolbar">

                    <div className="search-box">

                        <i className="bi bi-search"></i>

                        <input
                            type="text"
                            placeholder="Search elections..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <select
                        className="status-filter"
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Status
                        </option>

                        <option value="Active">
                            Active
                        </option>

                        <option value="Upcoming">
                            Upcoming
                        </option>

                        <option value="Completed">
                            Completed
                        </option>
                    </select>

                </div>

                {/* LIST */}

                <div className="elections-list">

                    {loading ? (

                        <div className="no-elections">

                            <i className="bi bi-arrow-repeat"></i>

                            <h5>
                                Loading elections...
                            </h5>

                            <p>
                                Please wait while elections are loaded.
                            </p>

                        </div>

                    ) : filteredElections.length > 0 ? (

                        filteredElections.map(
                            (election) => (

                                <div
                                    className="election-item"
                                    key={election.id}
                                >

                                    <div className="election-main">

                                        <div className="election-icon">
                                            <i className="bi bi-check2-square"></i>
                                        </div>

                                        <div className="election-info">

                                            <h5>
                                                {election.title}
                                            </h5>

                                            <span className="election-type">
                                                {election.type ||
                                                    "Election"}
                                            </span>

                                            {election.description && (
                                                <p className="election-description">
                                                    {
                                                        election.description
                                                    }
                                                </p>
                                            )}

                                            <div className="election-meta">

                                                <span>
                                                    <i className="bi bi-calendar3"></i>

                                                    {formatDateTime(
                                                        election.start_at
                                                    )}

                                                    {" - "}

                                                    {formatDateTime(
                                                        election.end_at
                                                    )}
                                                </span>

                                                <span>
                                                    <i className="bi bi-person-badge"></i>

                                                    {election.candidates_count ??
                                                        0}{" "}
                                                    Candidates
                                                </span>

                                                <span>
                                                    <i className="bi bi-check-circle"></i>

                                                    {election.votes_count ??
                                                        0}{" "}
                                                    Votes
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                    <div className="election-right">

                                        <span
                                            className={`election-status ${String(
                                                election.status ||
                                                ""
                                            ).toLowerCase()}`}
                                        >
                                            {election.status ||
                                                "Unknown"}
                                        </span>

                                        <div className="election-actions">

                                            {/* VIEW */}

                                            <button
                                                title="View"
                                                type="button"
                                                onClick={() =>
                                                    handleViewElection(
                                                        election
                                                    )
                                                }
                                            >
                                                <i className="bi bi-eye"></i>
                                            </button>

                                            {/* EDIT */}

                                            <button
                                                title="Edit"
                                                type="button"
                                                onClick={() =>
                                                    handleEditElection(
                                                        election
                                                    )
                                                }
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </button>

                                            {/* MORE - NEXT STEP */}

                                            <button
                                                title="Delete"
                                                type="button"
                                                onClick={() => {
                                                    setDeleteError("");
                                                    setDeletingElection(election);
                                                }}
                                            >
                                                <i className="bi bi-trash3"></i>
                                            </button>

                                        </div>

                                    </div>

                                </div>
                            )
                        )

                    ) : (

                        <div className="no-elections">

                            <i className="bi bi-calendar-x"></i>

                            <h5>
                                No elections found
                            </h5>

                            <p>
                                Try changing your search or filter.
                            </p>

                        </div>

                    )}

                </div>

            </div>

            {/* ==========================================
                CREATE / EDIT MODAL
            ========================================== */}

            {showModal && (

                <div
                    className="modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="election-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* HEADER */}

                        <div className="modal-header">

                            <div>

                                <h3>
                                    {editingElection
                                        ? "Edit Election"
                                        : "Create New Election"}
                                </h3>

                                <p>
                                    {editingElection
                                        ? "Update the election information below."
                                        : "Enter the election information below."}
                                </p>

                            </div>

                            <button
                                className="close-modal"
                                onClick={closeModal}
                                type="button"
                                disabled={
                                    createLoading ||
                                    editLoading
                                }
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        {/* CREATE ERROR */}

                        {!editingElection &&
                            error && (
                                <div
                                    style={{
                                        margin: "15px 25px 0",
                                        padding: "11px 13px",
                                        background: "#fef2f2",
                                        border: "1px solid #fecaca",
                                        borderRadius: "7px",
                                        color: "#dc2626",
                                        fontSize: "11px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <i className="bi bi-exclamation-circle"></i>

                                    <span>
                                        {error}
                                    </span>
                                </div>
                            )}

                        {/* CREATE SUCCESS */}

                        {!editingElection &&
                            success && (
                                <div
                                    style={{
                                        margin: "15px 25px 0",
                                        padding: "11px 13px",
                                        background: "#ecfdf5",
                                        border: "1px solid #bbf7d0",
                                        borderRadius: "7px",
                                        color: "#15803d",
                                        fontSize: "11px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <i className="bi bi-check-circle-fill"></i>

                                    <span>
                                        {success}
                                    </span>
                                </div>
                            )}

                        {/* EDIT ERROR */}

                        {editingElection &&
                            editError && (
                                <div
                                    style={{
                                        margin: "15px 25px 0",
                                        padding: "11px 13px",
                                        background: "#fef2f2",
                                        border: "1px solid #fecaca",
                                        borderRadius: "7px",
                                        color: "#dc2626",
                                        fontSize: "11px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <i className="bi bi-exclamation-circle"></i>

                                    <span>
                                        {editError}
                                    </span>
                                </div>
                            )}

                        {/* EDIT SUCCESS */}

                        {editingElection &&
                            editSuccess && (
                                <div
                                    style={{
                                        margin: "15px 25px 0",
                                        padding: "11px 13px",
                                        background: "#ecfdf5",
                                        border: "1px solid #bbf7d0",
                                        borderRadius: "7px",
                                        color: "#15803d",
                                        fontSize: "11px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <i className="bi bi-check-circle-fill"></i>

                                    <span>
                                        {editSuccess}
                                    </span>
                                </div>
                            )}

                        {/* FORM */}

                        <form
                            onSubmit={
                                editingElection
                                    ? handleUpdateElection
                                    : handleCreateElection
                            }
                        >

                            {/* TITLE */}

                            <div className="form-group">

                                <label>
                                    Election Title
                                    <span>*</span>
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    placeholder="e.g. District Bar Association Election 2026"
                                    value={formData.title}
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    disabled={
                                        createLoading ||
                                        editLoading
                                    }
                                />

                            </div>

                            {/* TYPE */}

                            <div className="form-group">

                                <label>
                                    Election Type
                                    <span>*</span>
                                </label>

                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    disabled={
                                        createLoading ||
                                        editLoading
                                    }
                                >

                                    <option value="General Election">
                                        General Election
                                    </option>

                                    <option value="Executive Election">
                                        Executive Election
                                    </option>

                                    <option value="Special Election">
                                        Special Election
                                    </option>

                                    <option value="By-Election">
                                        By-Election
                                    </option>

                                </select>

                            </div>

                            {/* DESCRIPTION */}

                            <div className="form-group">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    placeholder="Enter election description..."
                                    value={
                                        formData.description
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    rows="3"
                                    disabled={
                                        createLoading ||
                                        editLoading
                                    }
                                ></textarea>

                            </div>

                            {/* START */}

                            <div className="form-row">

                                <div className="form-group">

                                    <label>
                                        Start Date
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="date"
                                        name="startDate"
                                        value={
                                            formData.startDate
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        disabled={
                                            createLoading ||
                                            editLoading
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Start Time
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="time"
                                        name="startTime"
                                        value={
                                            formData.startTime
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        disabled={
                                            createLoading ||
                                            editLoading
                                        }
                                    />

                                </div>

                            </div>

                            {/* END */}

                            <div className="form-row">

                                <div className="form-group">

                                    <label>
                                        End Date
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="date"
                                        name="endDate"
                                        value={
                                            formData.endDate
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        disabled={
                                            createLoading ||
                                            editLoading
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        End Time
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="time"
                                        name="endTime"
                                        value={
                                            formData.endTime
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        disabled={
                                            createLoading ||
                                            editLoading
                                        }
                                    />

                                </div>

                            </div>

                            {/* STATUS */}

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
                                    disabled={
                                        createLoading ||
                                        editLoading
                                    }
                                >

                                    <option value="Upcoming">
                                        Upcoming
                                    </option>

                                    <option value="Active">
                                        Active
                                    </option>

                                    <option value="Completed">
                                        Completed
                                    </option>

                                </select>

                            </div>

                            {/* FOOTER */}

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        createLoading ||
                                        editLoading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="create-btn"
                                    disabled={
                                        createLoading ||
                                        editLoading
                                    }
                                >

                                    {createLoading ||
                                        editLoading ? (
                                        <>
                                            <i className="bi bi-arrow-repeat election-loading-spin"></i>

                                            {editingElection
                                                ? "Updating..."
                                                : "Creating..."}
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg"></i>

                                            {editingElection
                                                ? "Update Election"
                                                : "Create Election"}
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* ==========================================
                VIEW ELECTION MODAL
            ========================================== */}

            {viewingElection && (

                <div
                    className="modal-overlay"
                    onClick={closeViewModal}
                >

                    <div
                        className="election-modal election-view-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>
                                <h3>
                                    Election Details
                                </h3>

                                <p>
                                    View election information
                                </p>
                            </div>

                            <button
                                className="close-modal"
                                onClick={
                                    closeViewModal
                                }
                                type="button"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <div className="election-view-content">

                            <div className="election-view-title">

                                <div className="election-view-icon">
                                    <i className="bi bi-check2-square"></i>
                                </div>

                                <div>
                                    <h4>
                                        {
                                            viewingElection.title
                                        }
                                    </h4>

                                    <span
                                        className={`election-status ${String(
                                            viewingElection.status ||
                                            ""
                                        ).toLowerCase()}`}
                                    >
                                        {
                                            viewingElection.status
                                        }
                                    </span>
                                </div>

                            </div>

                            <div className="election-view-grid">

                                <div className="election-view-field">
                                    <span>
                                        Election Type
                                    </span>

                                    <strong>
                                        {
                                            viewingElection.type ||
                                            "-"
                                        }
                                    </strong>
                                </div>

                                <div className="election-view-field">
                                    <span>
                                        Status
                                    </span>

                                    <strong>
                                        {
                                            viewingElection.status ||
                                            "-"
                                        }
                                    </strong>
                                </div>

                                <div className="election-view-field">
                                    <span>
                                        Start Date & Time
                                    </span>

                                    <strong>
                                        {formatDateTime(
                                            viewingElection.start_at
                                        )}
                                    </strong>
                                </div>

                                <div className="election-view-field">
                                    <span>
                                        End Date & Time
                                    </span>

                                    <strong>
                                        {formatDateTime(
                                            viewingElection.end_at
                                        )}
                                    </strong>
                                </div>

                                <div className="election-view-field">
                                    <span>
                                        Candidates
                                    </span>

                                    <strong>
                                        {
                                            viewingElection.candidates_count ??
                                            0
                                        }
                                    </strong>
                                </div>

                                <div className="election-view-field">
                                    <span>
                                        Votes
                                    </span>

                                    <strong>
                                        {
                                            viewingElection.votes_count ??
                                            0
                                        }
                                    </strong>
                                </div>

                            </div>

                            <div className="election-view-description">

                                <span>
                                    Description
                                </span>

                                <p>
                                    {viewingElection.description ||
                                        "No description provided."}
                                </p>

                            </div>

                            <div className="election-view-footer">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="create-btn"
                                    onClick={() =>
                                        handleEditElection(
                                            viewingElection
                                        )
                                    }
                                >
                                    <i className="bi bi-pencil"></i>
                                    Edit Election
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {/* ==========================================
    DELETE CONFIRMATION MODAL
========================================== */}

            {deletingElection && (

                <div
                    className="modal-overlay"
                    onClick={() => {
                        if (!deleteLoading) {
                            setDeletingElection(null);
                            setDeleteError("");
                        }
                    }}
                >

                    <div
                        className="election-delete-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="election-delete-icon">
                            <i className="bi bi-trash3"></i>
                        </div>

                        <h3>
                            Delete Election?
                        </h3>

                        <p>
                            Are you sure you want to delete
                            <strong>
                                {" "}
                                "{deletingElection.title}"
                            </strong>
                            ?
                        </p>

                        <small>
                            This election will be removed from
                            the active election list.
                        </small>

                        {deleteError && (
                            <div className="election-delete-error">
                                <i className="bi bi-exclamation-circle"></i>

                                <span>
                                    {deleteError}
                                </span>
                            </div>
                        )}

                        <div className="election-delete-actions">

                            <button
                                type="button"
                                className="cancel-btn"
                                disabled={deleteLoading}
                                onClick={() => {
                                    setDeletingElection(null);
                                    setDeleteError("");
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="election-delete-confirm"
                                disabled={deleteLoading}
                                onClick={
                                    handleDeleteElection
                                }
                            >

                                {deleteLoading ? (
                                    <>
                                        <i className="bi bi-arrow-repeat election-loading-spin"></i>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-trash3"></i>
                                        Delete Election
                                    </>
                                )}

                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Elections;