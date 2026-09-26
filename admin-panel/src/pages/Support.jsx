import { useEffect, useMemo, useState } from "react";
import "./Support.css";

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

const formatDate = (dateValue) => {
    if (!dateValue) {
        return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const normalizeRequest = (request) => {
    return {
        id: request.id,
        subject: request.subject || "Support Request",
        name:
            request.name ||
            request.full_name ||
            "Unknown User",
        email: request.email || "—",
        barNumber:
            request.bar_number ||
            request.bar_registration_no ||
            "",
        category:
            request.category ||
            "General",
        priority:
            request.priority ||
            "Medium",
        status:
            request.status ||
            "Open",
        date:
            request.created_at ||
            request.updated_at ||
            null,
        message:
            request.message ||
            request.description ||
            "",
        created_at:
            request.created_at ||
            null,
        updated_at:
            request.updated_at ||
            null,
        resolved_at:
            request.resolved_at ||
            null,
    };
};

function Support() {
    const [requests, setRequests] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const [selectedRequest, setSelectedRequest] = useState(null);

    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =========================================================
    // FETCH SUPPORT REQUESTS
    // =========================================================

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/admin/support`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    "Failed to load support requests."
                );
            }

            const requestList = Array.isArray(data.requests)
                ? data.requests.map(normalizeRequest)
                : [];

            setRequests(requestList);

            // Keep selected request updated if modal is open
            setSelectedRequest((current) => {
                if (!current) {
                    return null;
                }

                const updated = requestList.find(
                    (request) =>
                        String(request.id) ===
                        String(current.id)
                );

                return updated || null;
            });
        } catch (err) {
            console.error(
                "FETCH SUPPORT REQUESTS ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to load support requests."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // =========================================================
    // STATISTICS
    // =========================================================

    const stats = useMemo(() => {
        return {
            total: requests.length,

            open: requests.filter(
                (request) =>
                    request.status === "Open"
            ).length,

            progress: requests.filter(
                (request) =>
                    request.status === "In Progress"
            ).length,

            resolved: requests.filter(
                (request) =>
                    request.status === "Resolved"
            ).length,
        };
    }, [requests]);

    // =========================================================
    // CATEGORY OPTIONS
    // =========================================================

    const categoryOptions = useMemo(() => {
        const categories = requests
            .map((request) => request.category)
            .filter(Boolean);

        return [
            ...new Set([
                "Voting",
                "Account",
                "Election",
                "General",
                ...categories,
            ]),
        ];
    }, [requests]);

    // =========================================================
    // FILTER REQUESTS
    // =========================================================

    const filteredRequests = useMemo(() => {
        return requests.filter((request) => {
            const searchableText =
                `${request.subject} ${request.name} ${request.email} ${request.category} ${request.message}`
                    .toLowerCase();

            const matchesSearch =
                searchableText.includes(
                    search.toLowerCase()
                );

            const matchesStatus =
                statusFilter === "All" ||
                request.status === statusFilter;

            const matchesPriority =
                priorityFilter === "All" ||
                request.priority === priorityFilter;

            const matchesCategory =
                categoryFilter === "All" ||
                request.category === categoryFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority &&
                matchesCategory
            );
        });
    }, [
        requests,
        search,
        statusFilter,
        priorityFilter,
        categoryFilter,
    ]);

    // =========================================================
    // UPDATE STATUS
    // =========================================================

    const updateStatus = async (id, status) => {
        try {
            setActionId(id);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/admin/support/${id}/status`,
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
                    "Failed to update support status."
                );
            }

            setRequests((current) =>
                current.map((request) =>
                    String(request.id) === String(id)
                        ? {
                            ...request,
                            status,
                        }
                        : request
                )
            );

            setSelectedRequest((current) =>
                current &&
                    String(current.id) === String(id)
                    ? {
                        ...current,
                        status,
                    }
                    : current
            );

            setSuccess(
                `Support request marked as ${status}.`
            );

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error(
                "UPDATE SUPPORT STATUS ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to update support status."
            );
        } finally {
            setActionId(null);
        }
    };

    // =========================================================
    // DELETE REQUEST
    // =========================================================

    const deleteRequest = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this support request?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionId(id);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/admin/support/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    "Failed to delete support request."
                );
            }

            setRequests((current) =>
                current.filter(
                    (request) =>
                        String(request.id) !==
                        String(id)
                )
            );

            setSelectedRequest(null);

            setSuccess(
                "Support request deleted successfully."
            );

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error(
                "DELETE SUPPORT REQUEST ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to delete support request."
            );
        } finally {
            setActionId(null);
        }
    };

    // =========================================================
    // CLEAR FILTERS
    // =========================================================

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("All");
        setPriorityFilter("All");
        setCategoryFilter("All");
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="support-page">
                <div
                    style={{
                        padding: "60px 20px",
                        textAlign: "center",
                        color: "#64748b",
                    }}
                >
                    <i
                        className="bi bi-arrow-repeat"
                        style={{
                            display: "block",
                            fontSize: "24px",
                            marginBottom: "10px",
                        }}
                    ></i>

                    <span>
                        Loading support requests...
                    </span>
                </div>
            </div>
        );
    }

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="support-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="support-page-header">

                <div>

                    <span className="support-overline">
                        CUSTOMER SUPPORT
                    </span>

                    <h1>
                        Support
                    </h1>

                    <p>
                        Manage and respond to lawyer support requests.
                    </p>

                </div>

                <div className="support-header-badge">

                    <i className="bi bi-headset"></i>

                    Support Center

                </div>

            </div>

            {/* =================================================
                SUCCESS / ERROR
            ================================================= */}

            {error && (
                <div
                    style={{
                        marginBottom: "15px",
                        padding: "11px 14px",
                        borderRadius: "8px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#b91c1c",
                        fontSize: "11px",
                    }}
                >
                    <i
                        className="bi bi-exclamation-circle"
                        style={{
                            marginRight: "7px",
                        }}
                    ></i>

                    {error}
                </div>
            )}

            {success && (
                <div
                    style={{
                        marginBottom: "15px",
                        padding: "11px 14px",
                        borderRadius: "8px",
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        color: "#047857",
                        fontSize: "11px",
                    }}
                >
                    <i
                        className="bi bi-check-circle"
                        style={{
                            marginRight: "7px",
                        }}
                    ></i>

                    {success}
                </div>
            )}

            {/* =================================================
                STATS
            ================================================= */}

            <div className="support-stats">

                <div className="support-stat-card">

                    <div className="support-stat-icon blue">
                        <i className="bi bi-inbox"></i>
                    </div>

                    <div>

                        <span>
                            TOTAL REQUESTS
                        </span>

                        <strong>
                            {stats.total}
                        </strong>

                    </div>

                </div>

                <div className="support-stat-card">

                    <div className="support-stat-icon red">
                        <i className="bi bi-exclamation-circle"></i>
                    </div>

                    <div>

                        <span>
                            OPEN
                        </span>

                        <strong>
                            {stats.open}
                        </strong>

                    </div>

                </div>

                <div className="support-stat-card">

                    <div className="support-stat-icon orange">
                        <i className="bi bi-hourglass-split"></i>
                    </div>

                    <div>

                        <span>
                            IN PROGRESS
                        </span>

                        <strong>
                            {stats.progress}
                        </strong>

                    </div>

                </div>

                <div className="support-stat-card">

                    <div className="support-stat-icon green">
                        <i className="bi bi-check-circle"></i>
                    </div>

                    <div>

                        <span>
                            RESOLVED
                        </span>

                        <strong>
                            {stats.resolved}
                        </strong>

                    </div>

                </div>

            </div>

            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="support-filter-card">

                <div className="support-search">

                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() =>
                                setSearch("")
                            }
                            aria-label="Clear search"
                        >
                            <i className="bi bi-x"></i>
                        </button>
                    )}

                </div>

                <div className="support-filter-group">

                    <select
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

                        <option value="Open">
                            Open
                        </option>

                        <option value="In Progress">
                            In Progress
                        </option>

                        <option value="Resolved">
                            Resolved
                        </option>

                        <option value="Closed">
                            Closed
                        </option>

                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(e) =>
                            setPriorityFilter(
                                e.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Priority
                        </option>

                        <option value="High">
                            High
                        </option>

                        <option value="Medium">
                            Medium
                        </option>

                        <option value="Low">
                            Low
                        </option>

                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) =>
                            setCategoryFilter(
                                e.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Categories
                        </option>

                        {categoryOptions.map(
                            (category) => (
                                <option
                                    key={category}
                                    value={category}
                                >
                                    {category}
                                </option>
                            )
                        )}

                    </select>

                </div>

            </div>

            {/* =================================================
                RESULTS BAR
            ================================================= */}

            <div className="support-results-bar">

                <div>

                    Showing{" "}

                    <strong>
                        {filteredRequests.length}
                    </strong>{" "}

                    of{" "}

                    <strong>
                        {requests.length}
                    </strong>{" "}

                    requests

                </div>

                {(search ||
                    statusFilter !== "All" ||
                    priorityFilter !== "All" ||
                    categoryFilter !== "All") && (

                        <button
                            type="button"
                            onClick={clearFilters}
                        >
                            <i className="bi bi-arrow-counterclockwise"></i>

                            Clear Filters
                        </button>

                    )}

            </div>

            {/* =================================================
                REQUESTS
            ================================================= */}

            {filteredRequests.length === 0 ? (

                <div className="support-empty">

                    <div className="support-empty-icon">

                        <i className="bi bi-headset"></i>

                    </div>

                    <h3>
                        No Support Requests Found
                    </h3>

                    <p>
                        Try changing your search or filter settings.
                    </p>

                </div>

            ) : (

                <div className="support-list">

                    {filteredRequests.map(
                        (request) => (

                            <div
                                className="support-request-card"
                                key={request.id}
                            >

                                {/* LEFT ICON */}

                                <div
                                    className={`support-request-icon ${String(
                                        request.priority
                                    ).toLowerCase()
                                        }`}
                                >

                                    <i className="bi bi-chat-left-text"></i>

                                </div>

                                {/* CONTENT */}

                                <div className="support-request-content">

                                    <div className="support-request-top">

                                        <div className="support-request-main">

                                            <div className="support-request-title-row">

                                                <h3>
                                                    {request.subject}
                                                </h3>

                                                <span
                                                    className={`support-priority ${String(
                                                        request.priority
                                                    ).toLowerCase()
                                                        }`}
                                                >
                                                    {request.priority}
                                                </span>

                                            </div>

                                            <p>
                                                {request.message}
                                            </p>

                                        </div>

                                        <span
                                            className={`support-status ${String(
                                                request.status
                                            )
                                                    .toLowerCase()
                                                    .replace(
                                                        " ",
                                                        "-"
                                                    )
                                                }`}
                                        >

                                            <span></span>

                                            {request.status}

                                        </span>

                                    </div>

                                    {/* META + ACTIONS */}

                                    <div className="support-request-footer">

                                        <div className="support-request-meta">

                                            <span>
                                                <i className="bi bi-person"></i>
                                                {request.name}
                                            </span>

                                            <span>
                                                <i className="bi bi-envelope"></i>
                                                {request.email}
                                            </span>

                                            <span>
                                                <i className="bi bi-tag"></i>
                                                {request.category}
                                            </span>

                                            <span>
                                                <i className="bi bi-calendar3"></i>
                                                {formatDate(
                                                    request.date
                                                )}
                                            </span>

                                        </div>

                                        <div className="support-request-actions">

                                            <button
                                                type="button"
                                                className="support-view-btn"
                                                onClick={() =>
                                                    setSelectedRequest(
                                                        request
                                                    )
                                                }
                                            >
                                                <i className="bi bi-eye"></i>

                                                View

                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        )
                    )}

                </div>

            )}

            {/* =================================================
                REQUEST DETAILS MODAL
            ================================================= */}

            {selectedRequest && (

                <div
                    className="support-modal-overlay"
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            setSelectedRequest(
                                null
                            );
                        }

                    }}
                >

                    <div className="support-modal">

                        {/* MODAL HEADER */}

                        <div className="support-modal-header">

                            <div>

                                <span>
                                    SUPPORT REQUEST
                                </span>

                                <h2>
                                    Request Details
                                </h2>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedRequest(
                                        null
                                    )
                                }
                                aria-label="Close"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        {/* MODAL BODY */}

                        <div className="support-modal-body">

                            {/* TITLE */}

                            <div className="support-modal-title-section">

                                <div
                                    className={`support-modal-icon ${String(
                                        selectedRequest.priority
                                    ).toLowerCase()
                                        }`}
                                >

                                    <i className="bi bi-chat-left-text"></i>

                                </div>

                                <div>

                                    <h3>
                                        {selectedRequest.subject}
                                    </h3>

                                    <div className="support-modal-badges">

                                        <span
                                            className={`support-priority ${String(
                                                selectedRequest.priority
                                            ).toLowerCase()
                                                }`}
                                        >
                                            {selectedRequest.priority}
                                        </span>

                                        <span
                                            className={`support-status ${String(
                                                selectedRequest.status
                                            )
                                                    .toLowerCase()
                                                    .replace(
                                                        " ",
                                                        "-"
                                                    )
                                                }`}
                                        >

                                            <span></span>

                                            {selectedRequest.status}

                                        </span>

                                    </div>

                                </div>

                            </div>

                            {/* DETAILS */}

                            <div className="support-detail-grid">

                                <div className="support-detail-item">

                                    <span>
                                        REQUESTER
                                    </span>

                                    <strong>
                                        {selectedRequest.name}
                                    </strong>

                                </div>

                                <div className="support-detail-item">

                                    <span>
                                        EMAIL
                                    </span>

                                    <strong>
                                        {selectedRequest.email}
                                    </strong>

                                </div>

                                <div className="support-detail-item">

                                    <span>
                                        CATEGORY
                                    </span>

                                    <strong>
                                        {selectedRequest.category}
                                    </strong>

                                </div>

                                <div className="support-detail-item">

                                    <span>
                                        DATE
                                    </span>

                                    <strong>
                                        {formatDate(
                                            selectedRequest.date
                                        )}
                                    </strong>

                                </div>

                                {selectedRequest.barNumber && (
                                    <div className="support-detail-item">

                                        <span>
                                            BAR REGISTRATION
                                        </span>

                                        <strong>
                                            {selectedRequest.barNumber}
                                        </strong>

                                    </div>
                                )}

                            </div>

                            {/* MESSAGE */}

                            <div className="support-message-box">

                                <span>
                                    MESSAGE
                                </span>

                                <p>
                                    {selectedRequest.message}
                                </p>

                            </div>

                            {/* STATUS */}

                            <div className="support-status-section">

                                <label>
                                    Update Request Status
                                </label>

                                <div className="support-status-buttons">

                                    <button
                                        type="button"
                                        disabled={
                                            actionId ===
                                            selectedRequest.id
                                        }
                                        className={
                                            selectedRequest.status ===
                                                "Open"
                                                ? "active open"
                                                : "open"
                                        }
                                        onClick={() =>
                                            updateStatus(
                                                selectedRequest.id,
                                                "Open"
                                            )
                                        }
                                    >

                                        <i className="bi bi-circle"></i>

                                        Open

                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            actionId ===
                                            selectedRequest.id
                                        }
                                        className={
                                            selectedRequest.status ===
                                                "In Progress"
                                                ? "active progress"
                                                : "progress"
                                        }
                                        onClick={() =>
                                            updateStatus(
                                                selectedRequest.id,
                                                "In Progress"
                                            )
                                        }
                                    >

                                        <i className="bi bi-hourglass-split"></i>

                                        In Progress

                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            actionId ===
                                            selectedRequest.id
                                        }
                                        className={
                                            selectedRequest.status ===
                                                "Resolved"
                                                ? "active resolved"
                                                : "resolved"
                                        }
                                        onClick={() =>
                                            updateStatus(
                                                selectedRequest.id,
                                                "Resolved"
                                            )
                                        }
                                    >

                                        <i className="bi bi-check-circle"></i>

                                        Resolved

                                    </button>

                                </div>

                            </div>

                        </div>

                        {/* MODAL FOOTER */}

                        <div className="support-modal-footer">

                            <button
                                type="button"
                                className="support-delete-btn"
                                disabled={
                                    actionId ===
                                    selectedRequest.id
                                }
                                onClick={() =>
                                    deleteRequest(
                                        selectedRequest.id
                                    )
                                }
                            >

                                <i className="bi bi-trash3"></i>

                                Delete Request

                            </button>

                            <button
                                type="button"
                                className="support-close-btn"
                                onClick={() =>
                                    setSelectedRequest(
                                        null
                                    )
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Support;