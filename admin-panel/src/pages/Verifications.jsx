import { useEffect, useMemo, useState } from "react";
import "./Verifications.css";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";

const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

function getAdminToken() {
    return localStorage.getItem("adminToken");
}

function formatDate(dateValue) {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getStatusClass(status) {
    return String(status || "")
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function Verifications() {
    const [verifications, setVerifications] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedVerification, setSelectedVerification] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [actionError, setActionError] = useState("");

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectRemarks, setRejectRemarks] = useState("");

    const fetchVerifications = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getAdminToken();

            if (!token) {
                throw new Error("Admin session not found. Please login again.");
            }

            const response = await fetch(`${API_URL}/admin/verifications`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok || data.status === false) {
                throw new Error(
                    data.message || "Unable to load verification requests."
                );
            }

            setVerifications(Array.isArray(data.verifications) ? data.verifications : []);
        } catch (err) {
            console.error("VERIFICATIONS LOAD ERROR:", err);
            setError(err.message || "Unable to load verification requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVerifications();
    }, []);

    const filteredVerifications = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        return verifications.filter((verification) => {
            const matchesSearch =
                !searchValue ||
                String(verification.full_name || "")
                    .toLowerCase()
                    .includes(searchValue) ||
                String(verification.email || "")
                    .toLowerCase()
                    .includes(searchValue) ||
                String(verification.bar_registration_no || "")
                    .toLowerCase()
                    .includes(searchValue) ||
                String(verification.cnic_number || "")
                    .toLowerCase()
                    .includes(searchValue);

            const matchesStatus =
                statusFilter === "All" ||
                verification.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [verifications, search, statusFilter]);

    const totalCount = verifications.length;

    const pendingCount = verifications.filter(
        (item) => item.status === "Pending"
    ).length;

    const approvedCount = verifications.filter(
        (item) => item.status === "Approved"
    ).length;

    const rejectedCount = verifications.filter(
        (item) => item.status === "Rejected"
    ).length;

    const openDetails = async (id) => {
        try {
            setDetailsLoading(true);
            setActionError("");

            const token = getAdminToken();

            const response = await fetch(
                `${API_URL}/admin/verifications/${id}`,
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
                    data.message || "Unable to load verification details."
                );
            }

            setSelectedVerification(data.verification);
        } catch (err) {
            console.error("VERIFICATION DETAILS ERROR:", err);
            setActionError(
                err.message || "Unable to load verification details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetails = () => {
        if (actionLoading) return;

        setSelectedVerification(null);
        setShowRejectModal(false);
        setRejectRemarks("");
        setActionError("");
    };

    const approveVerification = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to approve this verification request?"
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);
            setActionError("");
            setSuccessMessage("");

            const token = getAdminToken();

            const response = await fetch(
                `${API_URL}/admin/verifications/${id}/approve`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok || data.status === false) {
                throw new Error(
                    data.message || "Unable to approve verification."
                );
            }

            setSuccessMessage(
                data.message || "Verification request approved successfully."
            );

            setSelectedVerification(null);

            await fetchVerifications();
        } catch (err) {
            console.error("APPROVE VERIFICATION ERROR:", err);
            setActionError(
                err.message || "Unable to approve verification."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const openRejectModal = () => {
        setRejectRemarks("");
        setActionError("");
        setShowRejectModal(true);
    };

    const closeRejectModal = () => {
        if (actionLoading) return;

        setShowRejectModal(false);
        setRejectRemarks("");
    };

    const rejectVerification = async () => {
        if (!selectedVerification?.id) return;

        const remarks = rejectRemarks.trim();

        if (!remarks) {
            setActionError("Please enter rejection remarks.");
            return;
        }

        try {
            setActionLoading(true);
            setActionError("");
            setSuccessMessage("");

            const token = getAdminToken();

            const response = await fetch(
                `${API_URL}/admin/verifications/${selectedVerification.id}/reject`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        remarks,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || data.status === false) {
                throw new Error(
                    data.message || "Unable to reject verification."
                );
            }

            setSuccessMessage(
                data.message || "Verification request rejected successfully."
            );

            setShowRejectModal(false);
            setRejectRemarks("");
            setSelectedVerification(null);

            await fetchVerifications();
        } catch (err) {
            console.error("REJECT VERIFICATION ERROR:", err);
            setActionError(
                err.message || "Unable to reject verification."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const documentUrl = (fileName) => {
        if (!fileName) return "";

        return `${API_ORIGIN}/uploads/verification/${fileName}`;
    };

    const openDocument = (fileName) => {
        const url = documentUrl(fileName);

        if (!url) return;

        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="verifications-page">

            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h2>Lawyer Verifications</h2>
                    <p>
                        Review and manage lawyer verification requests
                    </p>
                </div>

                <button
                    type="button"
                    className="verification-refresh-btn"
                    onClick={fetchVerifications}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise"></i>
                    Refresh
                </button>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="verification-alert success">
                    <i className="bi bi-check-circle-fill"></i>

                    <span>{successMessage}</span>

                    <button
                        type="button"
                        onClick={() => setSuccessMessage("")}
                        aria-label="Close"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="verification-alert error">
                    <i className="bi bi-exclamation-circle-fill"></i>

                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Close"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            )}

            {/* Statistics */}
            <div className="verification-stats">

                <div className="verification-stat-card">
                    <div className="verification-stat-icon blue">
                        <i className="bi bi-file-earmark-person"></i>
                    </div>

                    <div>
                        <span>Total Requests</span>
                        <strong>{totalCount}</strong>
                    </div>
                </div>

                <div className="verification-stat-card">
                    <div className="verification-stat-icon orange">
                        <i className="bi bi-hourglass-split"></i>
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>{pendingCount}</strong>
                    </div>
                </div>

                <div className="verification-stat-card">
                    <div className="verification-stat-icon green">
                        <i className="bi bi-person-check"></i>
                    </div>

                    <div>
                        <span>Approved</span>
                        <strong>{approvedCount}</strong>
                    </div>
                </div>

                <div className="verification-stat-card">
                    <div className="verification-stat-icon red">
                        <i className="bi bi-person-x"></i>
                    </div>

                    <div>
                        <span>Rejected</span>
                        <strong>{rejectedCount}</strong>
                    </div>
                </div>

            </div>

            {/* Main Card */}
            <div className="verifications-card">

                {/* Toolbar */}
                <div className="verifications-toolbar">

                    <div className="verification-search-box">
                        <i className="bi bi-search"></i>

                        <input
                            type="text"
                            placeholder="Search by name, email, bar number or CNIC..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="verification-status-filter"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>

                </div>

                {/* Table */}
                <div className="verification-table-container">

                    <table className="verification-table">

                        <thead>
                            <tr>
                                <th>LAWYER</th>
                                <th>BAR NUMBER</th>
                                <th>PHONE</th>
                                <th>STATUS</th>
                                <th>SUBMITTED</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="verification-loading"
                                    >
                                        <div className="verification-loader">
                                            <i className="bi bi-arrow-repeat"></i>
                                            <span>
                                                Loading verification requests...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredVerifications.length > 0 ? (
                                filteredVerifications.map((verification) => (
                                    <tr key={verification.id}>

                                        <td>
                                            <div className="verification-lawyer-info">

                                                <div className="verification-avatar">
                                                    {String(
                                                        verification.full_name || "?"
                                                    )
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {verification.full_name || "-"}
                                                    </strong>

                                                    <span>
                                                        {verification.email || "-"}
                                                    </span>
                                                </div>

                                            </div>
                                        </td>

                                        <td>
                                            <span className="verification-bar-number">
                                                {verification.bar_registration_no || "-"}
                                            </span>
                                        </td>

                                        <td>
                                            {verification.phone_number || "-"}
                                        </td>

                                        <td>
                                            <span
                                                className={`verification-status ${getStatusClass(
                                                    verification.status
                                                )}`}
                                            >
                                                <span className="verification-status-dot"></span>
                                                {verification.status || "-"}
                                            </span>
                                        </td>

                                        <td>
                                            {formatDate(
                                                verification.submitted_at
                                            )}
                                        </td>

                                        <td>
                                            <div className="verification-action-buttons">

                                                <button
                                                    type="button"
                                                    className="verification-action-btn view"
                                                    title="View Details"
                                                    onClick={() =>
                                                        openDetails(
                                                            verification.id
                                                        )
                                                    }
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>

                                                {verification.status ===
                                                    "Pending" && (
                                                        <button
                                                            type="button"
                                                            className="verification-action-btn approve"
                                                            title="Approve"
                                                            onClick={() =>
                                                                approveVerification(
                                                                    verification.id
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-check-lg"></i>
                                                        </button>
                                                    )}

                                            </div>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="verification-no-results"
                                    >
                                        <i className="bi bi-inbox"></i>

                                        <p>
                                            No verification requests found
                                        </p>
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

                {/* Footer */}
                <div className="verification-pagination">

                    <span>
                        Showing {filteredVerifications.length} of{" "}
                        {verifications.length} requests
                    </span>

                </div>

            </div>

            {/* Details Modal */}
            {selectedVerification && (
                <div
                    className="verification-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !actionLoading
                        ) {
                            closeDetails();
                        }
                    }}
                >
                    <div className="verification-modal">

                        <div className="verification-modal-header">

                            <div>
                                <h3>Verification Details</h3>
                                <p>
                                    Request #
                                    {selectedVerification.id}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="verification-modal-close"
                                onClick={closeDetails}
                                disabled={actionLoading}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        {detailsLoading ? (
                            <div className="verification-modal-loading">
                                <i className="bi bi-arrow-repeat"></i>
                                <p>Loading details...</p>
                            </div>
                        ) : (
                            <>
                                <div className="verification-details-grid">

                                    <div className="verification-detail-item">
                                        <span>Full Name</span>
                                        <strong>
                                            {selectedVerification.full_name ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="verification-detail-item">
                                        <span>Email</span>
                                        <strong>
                                            {selectedVerification.email || "-"}
                                        </strong>
                                    </div>

                                    <div className="verification-detail-item">
                                        <span>Phone Number</span>
                                        <strong>
                                            {selectedVerification.phone_number ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="verification-detail-item">
                                        <span>CNIC Number</span>
                                        <strong>
                                            {selectedVerification.cnic_number ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="verification-detail-item">
                                        <span>Bar Registration No.</span>
                                        <strong>
                                            {selectedVerification.bar_registration_no ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="verification-detail-item">
                                        <span>License Number</span>
                                        <strong>
                                            {selectedVerification.license_number ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="verification-detail-item">
                                        <span>Bar Association</span>
                                        <strong>
                                            {selectedVerification.bar_association ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="verification-detail-item">
                                        <span>Practice Area</span>
                                        <strong>
                                            {selectedVerification.practice_area ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="verification-detail-item">
                                        <span>Years of Practice</span>
                                        <strong>
                                            {selectedVerification.years_of_practice ??
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="verification-detail-item full-width">
                                        <span>Chamber Address</span>
                                        <strong>
                                            {selectedVerification.chamber_address ||
                                                "-"}
                                        </strong>
                                    </div>

                                </div>

                                {/* Documents */}
                                <div className="verification-documents">

                                    <div className="verification-section-title">
                                        <i className="bi bi-file-earmark-text"></i>
                                        <span>Submitted Documents</span>
                                    </div>

                                    <div className="verification-document-grid">

                                        <button
                                            type="button"
                                            className="verification-document-btn"
                                            onClick={() =>
                                                openDocument(
                                                    selectedVerification.cnic_front
                                                )
                                            }
                                            disabled={
                                                !selectedVerification.cnic_front
                                            }
                                        >
                                            <i className="bi bi-card-image"></i>

                                            <span>
                                                CNIC Front
                                            </span>

                                            <small>
                                                <i className="bi bi-box-arrow-up-right"></i>
                                                Open
                                            </small>
                                        </button>

                                        <button
                                            type="button"
                                            className="verification-document-btn"
                                            onClick={() =>
                                                openDocument(
                                                    selectedVerification.cnic_back
                                                )
                                            }
                                            disabled={
                                                !selectedVerification.cnic_back
                                            }
                                        >
                                            <i className="bi bi-card-image"></i>

                                            <span>
                                                CNIC Back
                                            </span>

                                            <small>
                                                <i className="bi bi-box-arrow-up-right"></i>
                                                Open
                                            </small>
                                        </button>

                                        <button
                                            type="button"
                                            className="verification-document-btn"
                                            onClick={() =>
                                                openDocument(
                                                    selectedVerification.lawyer_license
                                                )
                                            }
                                            disabled={
                                                !selectedVerification.lawyer_license
                                            }
                                        >
                                            <i className="bi bi-file-earmark-medical"></i>

                                            <span>
                                                Lawyer License
                                            </span>

                                            <small>
                                                <i className="bi bi-box-arrow-up-right"></i>
                                                Open
                                            </small>
                                        </button>

                                        <button
                                            type="button"
                                            className="verification-document-btn"
                                            onClick={() =>
                                                openDocument(
                                                    selectedVerification.bar_card
                                                )
                                            }
                                            disabled={
                                                !selectedVerification.bar_card
                                            }
                                        >
                                            <i className="bi bi-person-vcard"></i>

                                            <span>
                                                Bar Card
                                            </span>

                                            <small>
                                                <i className="bi bi-box-arrow-up-right"></i>
                                                Open
                                            </small>
                                        </button>

                                        {selectedVerification.additional_document && (
                                            <button
                                                type="button"
                                                className="verification-document-btn"
                                                onClick={() =>
                                                    openDocument(
                                                        selectedVerification.additional_document
                                                    )
                                                }
                                            >
                                                <i className="bi bi-file-earmark-plus"></i>

                                                <span>
                                                    Additional Document
                                                </span>

                                                <small>
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                    Open
                                                </small>
                                            </button>
                                        )}

                                    </div>

                                </div>

                                {/* Current Status */}
                                <div className="verification-current-status">

                                    <span>Current Status</span>

                                    <span
                                        className={`verification-status ${getStatusClass(
                                            selectedVerification.status
                                        )}`}
                                    >
                                        <span className="verification-status-dot"></span>
                                        {selectedVerification.status}
                                    </span>

                                </div>

                                {selectedVerification.admin_remarks && (
                                    <div className="verification-admin-remarks">
                                        <span>Admin Remarks</span>
                                        <p>
                                            {selectedVerification.admin_remarks}
                                        </p>
                                    </div>
                                )}

                                {actionError && (
                                    <div className="verification-modal-error">
                                        <i className="bi bi-exclamation-circle"></i>
                                        <span>{actionError}</span>
                                    </div>
                                )}

                                {/* Actions */}
                                {selectedVerification.status === "Pending" && (
                                    <div className="verification-modal-actions">

                                        <button
                                            type="button"
                                            className="verification-reject-btn"
                                            onClick={openRejectModal}
                                            disabled={actionLoading}
                                        >
                                            <i className="bi bi-x-circle"></i>
                                            Reject
                                        </button>

                                        <button
                                            type="button"
                                            className="verification-approve-btn"
                                            onClick={() =>
                                                approveVerification(
                                                    selectedVerification.id
                                                )
                                            }
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? (
                                                <>
                                                    <i className="bi bi-arrow-repeat"></i>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-circle"></i>
                                                    Approve Verification
                                                </>
                                            )}
                                        </button>

                                    </div>
                                )}

                            </>
                        )}

                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedVerification && (
                <div
                    className="verification-reject-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !actionLoading
                        ) {
                            closeRejectModal();
                        }
                    }}
                >
                    <div className="verification-reject-modal">

                        <div className="verification-reject-header">
                            <div className="reject-icon">
                                <i className="bi bi-exclamation-triangle"></i>
                            </div>

                            <div>
                                <h3>Reject Verification</h3>
                                <p>
                                    Please provide a reason for rejecting this
                                    request.
                                </p>
                            </div>
                        </div>

                        <label htmlFor="rejectRemarks">
                            Rejection Remarks
                        </label>

                        <textarea
                            id="rejectRemarks"
                            value={rejectRemarks}
                            onChange={(e) =>
                                setRejectRemarks(e.target.value)
                            }
                            placeholder="Enter rejection reason..."
                            rows="5"
                            disabled={actionLoading}
                        />

                        {actionError && (
                            <div className="verification-modal-error">
                                <i className="bi bi-exclamation-circle"></i>
                                <span>{actionError}</span>
                            </div>
                        )}

                        <div className="verification-reject-actions">

                            <button
                                type="button"
                                className="verification-cancel-btn"
                                onClick={closeRejectModal}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="verification-confirm-reject-btn"
                                onClick={rejectVerification}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <>
                                        <i className="bi bi-arrow-repeat"></i>
                                        Rejecting...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-x-circle"></i>
                                        Confirm Rejection
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

export default Verifications;