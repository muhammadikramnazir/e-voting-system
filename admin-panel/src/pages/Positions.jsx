import { useEffect, useMemo, useState } from "react";
import "./Positions.css";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";

function Positions() {
    const [positions, setPositions] = useState([]);
    const [elections, setElections] = useState([]);

    const [loading, setLoading] = useState(true);
    const [electionLoading, setElectionLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [electionFilter, setElectionFilter] = useState("All Elections");
    const [statusFilter, setStatusFilter] = useState("All Status");

    const [showModal, setShowModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        electionId: "",
        description: "",
        seats: 1,
        status: "Active",
        sortOrder: 0,
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
            setLoading(true);
            setError("");

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
            setLoading(false);
        }
    };

    /* =========================
       INITIAL LOAD
    ========================= */

    useEffect(() => {
        fetchElections();
        fetchPositions();
    }, []);

    /* =========================
       HELPERS
    ========================= */

    const getElectionTitle = (electionId) => {
        const election = elections.find(
            (item) => Number(item.id) === Number(electionId)
        );

        return election?.title || "Unknown Election";
    };

    const getElectionIdFromPosition = (position) => {
        return position.election_id ?? position.electionId;
    };

    /* =========================
       STATS
    ========================= */

    const stats = useMemo(() => {
        return {
            total: positions.length,

            active: positions.filter(
                (item) =>
                    String(item.status).toLowerCase() === "active"
            ).length,

            inactive: positions.filter(
                (item) =>
                    String(item.status).toLowerCase() === "inactive"
            ).length,

            seats: positions.reduce(
                (total, item) => total + Number(item.seats || 0),
                0
            ),
        };
    }, [positions]);

    /* =========================
       FILTERS
    ========================= */

    const filteredPositions = useMemo(() => {
        return positions.filter((position) => {
            const electionName = getElectionTitle(
                getElectionIdFromPosition(position)
            );

            const searchValue = search.toLowerCase().trim();

            const searchMatch =
                String(position.name || "")
                    .toLowerCase()
                    .includes(searchValue) ||
                electionName
                    .toLowerCase()
                    .includes(searchValue) ||
                String(position.description || "")
                    .toLowerCase()
                    .includes(searchValue);

            const electionMatch =
                electionFilter === "All Elections" ||
                String(getElectionIdFromPosition(position)) ===
                String(electionFilter);

            const statusMatch =
                statusFilter === "All Status" ||
                String(position.status).toLowerCase() ===
                statusFilter.toLowerCase();

            return searchMatch && electionMatch && statusMatch;
        });
    }, [
        positions,
        elections,
        search,
        electionFilter,
        statusFilter,
    ]);

    /* =========================
       OPEN ADD MODAL
    ========================= */

    const openAddModal = () => {
        setEditingPosition(null);

        setFormData({
            name: "",
            electionId: elections.length > 0 ? elections[0].id : "",
            description: "",
            seats: 1,
            status: "Active",
            sortOrder: 0,
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    /* =========================
       OPEN EDIT MODAL
    ========================= */

    const openEditModal = (position) => {
        setEditingPosition(position);

        setFormData({
            name: position.name || "",
            electionId:
                position.election_id ??
                position.electionId ??
                "",
            description: position.description || "",
            seats: position.seats || 1,
            status: position.status || "Active",
            sortOrder:
                position.sort_order ??
                position.sortOrder ??
                0,
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
        setEditingPosition(null);
    };

    /* =========================
       FORM CHANGE
    ========================= */

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /* =========================
       CREATE POSITION
    ========================= */

    const createPosition = async () => {
        const response = await fetch(`${API_URL}/admin/positions`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                election_id: Number(formData.electionId),
                name: formData.name.trim(),
                description: formData.description.trim(),
                seats: Number(formData.seats),
                status: formData.status,
                sort_order: Number(formData.sortOrder || 0),
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            throw new Error(
                data.message || "Failed to create position."
            );
        }

        return data;
    };

    /* =========================
       UPDATE POSITION
    ========================= */

    const updatePosition = async () => {
        const response = await fetch(
            `${API_URL}/admin/positions/${editingPosition.id}`,
            {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({
                    electionId: Number(formData.electionId),
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    seats: Number(formData.seats),
                    status: formData.status,
                    sortOrder: Number(formData.sortOrder || 0),
                }),
            }
        );

        const data = await response.json();

        if (!response.ok || !data.status) {
            throw new Error(
                data.message || "Failed to update position."
            );
        }

        return data;
    };

    /* =========================
       SUBMIT FORM
    ========================= */

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.name.trim()) {
            setError("Please enter position name.");
            return;
        }

        if (!formData.electionId) {
            setError("Please select an election.");
            return;
        }

        if (!Number(formData.seats) || Number(formData.seats) < 1) {
            setError("Number of seats must be at least 1.");
            return;
        }

        try {
            setSaving(true);

            if (editingPosition) {
                await updatePosition();

                setSuccess("Position updated successfully.");

                await fetchPositions();

                setTimeout(() => {
                    setShowModal(false);
                    setEditingPosition(null);
                    setSuccess("");
                }, 1200);
            } else {
                await createPosition();

                setSuccess("Position created successfully.");

                await fetchPositions();

                setTimeout(() => {
                    setShowModal(false);
                    setEditingPosition(null);
                    setSuccess("");
                }, 1200);
            }
        } catch (err) {
            console.error("SAVE POSITION ERROR:", err);

            setError(
                err.message || "Something went wrong while saving position."
            );
        } finally {
            setSaving(false);
        }
    };

    /* =========================
       DELETE POSITION
    ========================= */

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this position?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/admin/positions/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message || "Failed to delete position."
                );
            }

            setSuccess("Position deleted successfully.");

            await fetchPositions();

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error("DELETE POSITION ERROR:", err);

            setError(
                err.message || "Failed to delete position."
            );
        }
    };

    /* =========================
       TOGGLE STATUS
    ========================= */

    const toggleStatus = async (position) => {
        const newStatus =
            String(position.status).toLowerCase() === "active"
                ? "Inactive"
                : "Active";

        try {
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/admin/positions/${position.id}`,
                {
                    method: "PUT",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        status: newStatus,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message || "Failed to update position status."
                );
            }

            setSuccess(
                `Position ${newStatus.toLowerCase()} successfully.`
            );

            await fetchPositions();

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error("TOGGLE STATUS ERROR:", err);

            setError(
                err.message || "Failed to update position status."
            );
        }
    };

    /* =========================
       RENDER
    ========================= */

    return (
        <div className="positions-page">

            {/* ================= HEADER ================= */}

            <div className="positions-header">
                <div>
                    <h2>Positions</h2>
                    <p>Manage election positions and available seats.</p>
                </div>

                <button
                    className="add-position-btn"
                    onClick={openAddModal}
                    disabled={electionLoading || elections.length === 0}
                >
                    <i className="bi bi-plus-lg"></i>
                    Add Position
                </button>
            </div>

            {/* ================= GLOBAL MESSAGES ================= */}

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

            <div className="position-stats">

                <div className="position-stat-card">
                    <div className="position-stat-icon blue">
                        <i className="bi bi-diagram-3"></i>
                    </div>

                    <div>
                        <span>Total Positions</span>
                        <h3>{stats.total}</h3>
                    </div>
                </div>

                <div className="position-stat-card">
                    <div className="position-stat-icon green">
                        <i className="bi bi-check-circle"></i>
                    </div>

                    <div>
                        <span>Active Positions</span>
                        <h3>{stats.active}</h3>
                    </div>
                </div>

                <div className="position-stat-card">
                    <div className="position-stat-icon orange">
                        <i className="bi bi-pause-circle"></i>
                    </div>

                    <div>
                        <span>Inactive Positions</span>
                        <h3>{stats.inactive}</h3>
                    </div>
                </div>

                <div className="position-stat-card">
                    <div className="position-stat-icon purple">
                        <i className="bi bi-grid-3x3-gap"></i>
                    </div>

                    <div>
                        <span>Total Seats</span>
                        <h3>{stats.seats}</h3>
                    </div>
                </div>

            </div>

            {/* ================= FILTERS ================= */}

            <div className="position-filter-card">

                <div className="position-search">
                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        placeholder="Search position..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }
                >
                    <option value="All Status">
                        All Status
                    </option>

                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>

            </div>

            {/* ================= TABLE ================= */}

            <div className="positions-table-card">

                <div className="table-top">
                    <div>
                        <h3>Election Positions</h3>
                        <span>
                            {loading
                                ? "Loading positions..."
                                : `${filteredPositions.length} positions found`}
                        </span>
                    </div>
                </div>

                <div className="table-responsive">

                    <table className="positions-table">

                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Position</th>
                                <th>Election</th>
                                <th>Description</th>
                                <th>Seats</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className="no-position">
                                            <i className="bi bi-arrow-repeat"></i>
                                            <h4>Loading Positions...</h4>
                                            <p>
                                                Please wait while positions are
                                                being loaded.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPositions.length > 0 ? (
                                filteredPositions.map(
                                    (position, index) => {

                                        const electionName =
                                            getElectionTitle(
                                                getElectionIdFromPosition(
                                                    position
                                                )
                                            );

                                        const isActive =
                                            String(
                                                position.status
                                            ).toLowerCase() ===
                                            "active";

                                        return (
                                            <tr key={position.id}>

                                                <td>{index + 1}</td>

                                                <td>
                                                    <div className="position-name">
                                                        <div className="position-icon">
                                                            <i className="bi bi-person-badge"></i>
                                                        </div>

                                                        <strong>
                                                            {position.name}
                                                        </strong>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="election-name">
                                                        {electionName}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="description-text">
                                                        {position.description ||
                                                            "—"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="seat-badge">
                                                        {position.seats}
                                                    </span>
                                                </td>

                                                <td>
                                                    <button
                                                        className={`status-badge ${isActive
                                                            ? "active"
                                                            : "inactive"
                                                            }`}
                                                        onClick={() =>
                                                            toggleStatus(
                                                                position
                                                            )
                                                        }
                                                        title="Toggle Status"
                                                    >
                                                        <span></span>
                                                        {position.status}
                                                    </button>
                                                </td>

                                                <td>
                                                    <div className="action-buttons">

                                                        <button
                                                            className="edit-btn"
                                                            title="Edit Position"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    position
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>

                                                        <button
                                                            className="delete-btn"
                                                            title="Delete Position"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    position.id
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
                                    <td colSpan="7">

                                        <div className="no-position">
                                            <i className="bi bi-inbox"></i>

                                            <h4>
                                                No positions found
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
                <div className="position-modal-overlay">

                    <div className="position-modal">

                        <div className="position-modal-header">

                            <div>
                                <h3>
                                    {editingPosition
                                        ? "Edit Position"
                                        : "Add Position"}
                                </h3>

                                <p>
                                    {editingPosition
                                        ? "Update election position details."
                                        : "Create a new position for an election."}
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <form onSubmit={handleSubmit}>

                            {/* MODAL ERROR */}

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

                            {/* POSITION NAME */}

                            <div className="form-group">

                                <label>
                                    Position Name <span>*</span>
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    placeholder="e.g. President"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            {/* ELECTION */}

                            <div className="form-group">

                                <label>
                                    Election <span>*</span>
                                </label>

                                <select
                                    name="electionId"
                                    value={formData.electionId}
                                    onChange={handleChange}
                                    required
                                    disabled={electionLoading}
                                >
                                    <option value="">
                                        {electionLoading
                                            ? "Loading Elections..."
                                            : "Select Election"}
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

                            </div>

                            {/* SEATS + STATUS */}

                            <div className="form-row">

                                <div className="form-group">

                                    <label>
                                        Number of Seats
                                    </label>

                                    <input
                                        type="number"
                                        name="seats"
                                        min="1"
                                        value={formData.seats}
                                        onChange={handleChange}
                                    />

                                </div>

                                <div className="form-group">

                                    <label>Status</label>

                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="Active">
                                            Active
                                        </option>

                                        <option value="Inactive">
                                            Inactive
                                        </option>
                                    </select>

                                </div>

                            </div>

                            {/* SORT ORDER */}

                            <div className="form-group">

                                <label>
                                    Sort Order
                                </label>

                                <input
                                    type="number"
                                    name="sortOrder"
                                    min="0"
                                    value={formData.sortOrder}
                                    onChange={handleChange}
                                />

                            </div>

                            {/* DESCRIPTION */}

                            <div className="form-group">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    rows="4"
                                    placeholder="Enter position description..."
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>

                            </div>

                            {/* ACTIONS */}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-position-btn"
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
                                            {editingPosition
                                                ? "Update Position"
                                                : "Create Position"}
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

export default Positions;