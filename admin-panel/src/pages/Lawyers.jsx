import { useEffect, useMemo, useState } from "react";
import "./Lawyers.css";

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

function Lawyers() {
    const [lawyers, setLawyers] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // View
    const [selectedLawyer, setSelectedLawyer] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");

    // Edit
    const [editingLawyer, setEditingLawyer] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");

    const [editForm, setEditForm] = useState({
        fullName: "",
        phoneNumber: "",
        status: "Pending",
        practiceArea: "",
        yearsOfPractice: "",
        chamberAddress: "",
        additionalInfo: "",
    });

    // =====================================================
    // FETCH LAWYERS
    // =====================================================

    const fetchLawyers = async () => {
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
                `${API_URL}/admin/lawyers`,
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
                    data.message || "Unable to load lawyers."
                );
            }

            setLawyers(
                Array.isArray(data.lawyers)
                    ? data.lawyers
                    : []
            );
        } catch (err) {
            console.error("LAWYERS LOAD ERROR:", err);

            setError(
                err.message || "Unable to load lawyers."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLawyers();
    }, []);

    // =====================================================
    // VIEW LAWYER
    // =====================================================

    const handleViewLawyer = async (lawyerId) => {
        try {
            setDetailsLoading(true);
            setDetailsError("");
            setSelectedLawyer(null);

            const token = getAdminToken();

            if (!token) {
                throw new Error(
                    "Admin session not found. Please login again."
                );
            }

            const response = await fetch(
                `${API_URL}/admin/lawyers/${lawyerId}`,
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
                    data.message ||
                    "Unable to load lawyer details."
                );
            }

            setSelectedLawyer(data.lawyer);
        } catch (err) {
            console.error(
                "LAWYER DETAILS ERROR:",
                err
            );

            setDetailsError(
                err.message ||
                "Unable to load lawyer details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeLawyerDetails = () => {
        if (detailsLoading) return;

        setSelectedLawyer(null);
        setDetailsError("");
    };

    // =====================================================
    // OPEN EDIT
    // =====================================================

    const handleEditLawyer = async (lawyerId) => {
        try {
            setEditLoading(true);
            setEditError("");
            setEditSuccess("");

            const token = getAdminToken();

            if (!token) {
                throw new Error(
                    "Admin session not found. Please login again."
                );
            }

            const response = await fetch(
                `${API_URL}/admin/lawyers/${lawyerId}`,
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
                    data.message ||
                    "Unable to load lawyer information."
                );
            }

            const lawyer = data.lawyer;

            setEditingLawyer(lawyer);

            setEditForm({
                fullName:
                    lawyer.full_name ||
                    lawyer.name ||
                    "",

                phoneNumber:
                    lawyer.phone_number ||
                    lawyer.phone ||
                    "",

                status:
                    lawyer.status ||
                    "Pending",

                practiceArea:
                    lawyer.practice_area ||
                    "",

                yearsOfPractice:
                    lawyer.years_of_practice ??
                    "",

                chamberAddress:
                    lawyer.chamber_address ||
                    "",

                additionalInfo:
                    lawyer.additional_info ||
                    "",
            });
        } catch (err) {
            console.error(
                "OPEN EDIT LAWYER ERROR:",
                err
            );

            setEditError(
                err.message ||
                "Unable to load lawyer information."
            );
        } finally {
            setEditLoading(false);
        }
    };

    // =====================================================
    // EDIT FORM CHANGE
    // =====================================================

    const handleEditChange = (event) => {
        const { name, value } = event.target;

        setEditForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =====================================================
    // SAVE EDIT
    // =====================================================

    const handleSaveLawyer = async (event) => {
        event.preventDefault();

        try {
            setEditLoading(true);
            setEditError("");
            setEditSuccess("");

            const token = getAdminToken();

            if (!token) {
                throw new Error(
                    "Admin session not found. Please login again."
                );
            }

            if (!editForm.fullName.trim()) {
                throw new Error(
                    "Full name is required."
                );
            }

            if (!editForm.phoneNumber.trim()) {
                throw new Error(
                    "Phone number is required."
                );
            }

            const payload = {
                fullName: editForm.fullName.trim(),
                phoneNumber: editForm.phoneNumber.trim(),
                status: editForm.status,
                practiceArea:
                    editForm.practiceArea.trim(),
                yearsOfPractice:
                    editForm.yearsOfPractice === ""
                        ? null
                        : Number(editForm.yearsOfPractice),
                chamberAddress:
                    editForm.chamberAddress.trim(),
                additionalInfo:
                    editForm.additionalInfo.trim(),
            };

            const response = await fetch(
                `${API_URL}/admin/lawyers/${editingLawyer.id}`,
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
                    "Unable to update lawyer."
                );
            }

            setEditSuccess(
                "Lawyer information updated successfully."
            );

            // Update selected lawyer immediately
            if (data.lawyer) {
                setEditingLawyer(data.lawyer);
            }

            // Refresh table
            await fetchLawyers();

            // Keep success message visible for 2.5 seconds
            setTimeout(() => {
                setEditingLawyer(null);
                setEditSuccess("");
            }, 2500);

        } catch (err) {
            console.error(
                "UPDATE LAWYER ERROR:",
                err
            );

            setEditError(
                err.message ||
                "Unable to update lawyer."
            );
        } finally {
            setEditLoading(false);
        }
    };

    // =====================================================
    // FILTER
    // =====================================================

    const filteredLawyers = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        return lawyers.filter((lawyer) => {
            const matchesSearch =
                !searchValue ||
                String(lawyer.name || "")
                    .toLowerCase()
                    .includes(searchValue) ||
                String(lawyer.email || "")
                    .toLowerCase()
                    .includes(searchValue) ||
                String(lawyer.barNumber || "")
                    .toLowerCase()
                    .includes(searchValue) ||
                String(lawyer.phone || "")
                    .toLowerCase()
                    .includes(searchValue);

            const matchesStatus =
                statusFilter === "All" ||
                lawyer.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [lawyers, search, statusFilter]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalLawyers = lawyers.length;

    const verifiedLawyers = lawyers.filter(
        (lawyer) => lawyer.status === "Verified"
    ).length;

    const pendingLawyers = lawyers.filter(
        (lawyer) => lawyer.status === "Pending"
    ).length;

    const suspendedLawyers = lawyers.filter(
        (lawyer) => lawyer.status === "Suspended"
    ).length;

    return (
        <div className="lawyers-page">

            {/* PAGE HEADER */}

            <div className="page-header">

                <div>
                    <h2>Lawyers</h2>

                    <p>
                        Manage registered lawyers and voters
                    </p>
                </div>

                <button
                    type="button"
                    className="add-lawyer-btn"
                    onClick={fetchLawyers}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise"></i>

                    {loading
                        ? "Loading..."
                        : "Refresh"}
                </button>

            </div>


            {/* ERROR */}

            {error && (
                <div className="lawyer-page-error">

                    <i className="bi bi-exclamation-circle-fill"></i>

                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>

                </div>
            )}


            {/* STATS */}

            <div className="lawyer-stats">

                <div className="lawyer-stat-card">

                    <div className="lawyer-stat-icon blue">
                        <i className="bi bi-people"></i>
                    </div>

                    <div>
                        <span>Total Lawyers</span>
                        <strong>{totalLawyers}</strong>
                    </div>

                </div>


                <div className="lawyer-stat-card">

                    <div className="lawyer-stat-icon green">
                        <i className="bi bi-person-check"></i>
                    </div>

                    <div>
                        <span>Verified</span>
                        <strong>{verifiedLawyers}</strong>
                    </div>

                </div>


                <div className="lawyer-stat-card">

                    <div className="lawyer-stat-icon orange">
                        <i className="bi bi-person-exclamation"></i>
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>{pendingLawyers}</strong>
                    </div>

                </div>


                <div className="lawyer-stat-card">

                    <div className="lawyer-stat-icon red">
                        <i className="bi bi-person-x"></i>
                    </div>

                    <div>
                        <span>Suspended</span>
                        <strong>{suspendedLawyers}</strong>
                    </div>

                </div>

            </div>


            {/* MAIN CARD */}

            <div className="lawyers-card">

                <div className="lawyers-toolbar">

                    <div className="search-box">

                        <i className="bi bi-search"></i>

                        <input
                            type="text"
                            placeholder="Search by name, email or bar number..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>


                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                        className="status-filter"
                    >
                        <option value="All">
                            All Status
                        </option>

                        <option value="Verified">
                            Verified
                        </option>

                        <option value="Pending">
                            Pending
                        </option>

                        <option value="Suspended">
                            Suspended
                        </option>
                    </select>

                </div>


                {/* TABLE */}

                <div className="table-container">

                    <table className="lawyers-table">

                        <thead>

                            <tr>
                                <th>LAWYER</th>
                                <th>BAR NUMBER</th>
                                <th>PHONE</th>
                                <th>STATUS</th>
                                <th>REGISTERED</th>
                                <th>ACTION</th>
                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="no-results"
                                    >
                                        <i className="bi bi-arrow-repeat"></i>

                                        <p>
                                            Loading lawyers...
                                        </p>

                                    </td>

                                </tr>

                            ) : filteredLawyers.length > 0 ? (

                                filteredLawyers.map((lawyer) => (

                                    <tr key={lawyer.id}>

                                        <td>

                                            <div className="lawyer-info">

                                                <div className="lawyer-avatar">
                                                    {String(
                                                        lawyer.name || "?"
                                                    )
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
                                            <span className="bar-number">
                                                {lawyer.barNumber || "-"}
                                            </span>
                                        </td>


                                        <td>
                                            {lawyer.phone || "-"}
                                        </td>


                                        <td>

                                            <span
                                                className={`lawyer-status ${String(
                                                    lawyer.status || ""
                                                ).toLowerCase()}`}
                                            >
                                                <span className="status-dot"></span>

                                                {lawyer.status || "-"}
                                            </span>

                                        </td>


                                        <td>
                                            {formatDate(
                                                lawyer.created_at
                                            )}
                                        </td>


                                        <td>

                                            <div className="action-buttons">

                                                {/* VIEW */}

                                                <button
                                                    type="button"
                                                    className="action-btn view"
                                                    title="View"
                                                    onClick={() =>
                                                        handleViewLawyer(
                                                            lawyer.id
                                                        )
                                                    }
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>


                                                {/* EDIT */}

                                                <button
                                                    type="button"
                                                    className="action-btn edit"
                                                    title="Edit"
                                                    onClick={() =>
                                                        handleEditLawyer(
                                                            lawyer.id
                                                        )
                                                    }
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))

                            ) : (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="no-results"
                                    >

                                        <i className="bi bi-search"></i>

                                        <p>
                                            No lawyers found
                                        </p>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                <div className="pagination">

                    <span>
                        Showing{" "}
                        {filteredLawyers.length > 0
                            ? `1–${filteredLawyers.length}`
                            : "0"}{" "}
                        of {lawyers.length} lawyers
                    </span>

                    <div className="pagination-buttons">
                        <span>
                            Search and filters are applied to loaded
                            records
                        </span>
                    </div>

                </div>

            </div>


            {/* =====================================================
                VIEW LAWYER MODAL
            ===================================================== */}

            {(selectedLawyer ||
                detailsLoading ||
                detailsError) && (

                    <div
                        className="lawyer-details-overlay"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget &&
                                !detailsLoading
                            ) {
                                closeLawyerDetails();
                            }
                        }}
                    >

                        <div className="lawyer-details-modal">

                            <div className="lawyer-details-header">

                                <div>

                                    <h3>
                                        Lawyer Details
                                    </h3>

                                    <p>
                                        Complete registered lawyer information
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    className="lawyer-details-close"
                                    onClick={closeLawyerDetails}
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>

                            </div>


                            {detailsLoading && (
                                <div className="lawyer-details-loading">

                                    <i className="bi bi-arrow-repeat"></i>

                                    <p>
                                        Loading lawyer details...
                                    </p>

                                </div>
                            )}


                            {!detailsLoading &&
                                detailsError && (

                                    <div className="lawyer-details-error">

                                        <i className="bi bi-exclamation-circle"></i>

                                        <span>
                                            {detailsError}
                                        </span>

                                    </div>
                                )}


                            {!detailsLoading &&
                                !detailsError &&
                                selectedLawyer && (

                                    <>

                                        <div className="lawyer-details-profile">

                                            <div className="lawyer-details-avatar">
                                                {String(
                                                    selectedLawyer.full_name ||
                                                    selectedLawyer.name ||
                                                    "?"
                                                )
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div>

                                                <h4>
                                                    {selectedLawyer.full_name ||
                                                        selectedLawyer.name ||
                                                        "-"}
                                                </h4>

                                                <p>
                                                    {selectedLawyer.email ||
                                                        "-"}
                                                </p>

                                            </div>

                                            <span
                                                className={`lawyer-status ${String(
                                                    selectedLawyer.status || ""
                                                ).toLowerCase()}`}
                                            >
                                                <span className="status-dot"></span>

                                                {selectedLawyer.status || "-"}
                                            </span>

                                        </div>


                                        <div className="lawyer-details-section">

                                            <div className="lawyer-details-section-title">

                                                <i className="bi bi-person"></i>

                                                <span>
                                                    Personal Information
                                                </span>

                                            </div>


                                            <div className="lawyer-details-grid">

                                                <div className="lawyer-detail-item">
                                                    <span>Full Name</span>

                                                    <strong>
                                                        {selectedLawyer.full_name ||
                                                            selectedLawyer.name ||
                                                            "-"}
                                                    </strong>
                                                </div>


                                                <div className="lawyer-detail-item">
                                                    <span>Email</span>

                                                    <strong>
                                                        {selectedLawyer.email ||
                                                            "-"}
                                                    </strong>
                                                </div>


                                                <div className="lawyer-detail-item">
                                                    <span>Phone Number</span>

                                                    <strong>
                                                        {selectedLawyer.phone ||
                                                            "-"}
                                                    </strong>
                                                </div>


                                                <div className="lawyer-detail-item">
                                                    <span>CNIC Number</span>

                                                    <strong>
                                                        {selectedLawyer.cnic ||
                                                            "-"}
                                                    </strong>
                                                </div>

                                            </div>

                                        </div>


                                        <div className="lawyer-details-section">

                                            <div className="lawyer-details-section-title">

                                                <i className="bi bi-briefcase"></i>

                                                <span>
                                                    Professional Information
                                                </span>

                                            </div>


                                            <div className="lawyer-details-grid">

                                                <div className="lawyer-detail-item">
                                                    <span>
                                                        Bar Registration No.
                                                    </span>

                                                    <strong>
                                                        {selectedLawyer.barNumber ||
                                                            "-"}
                                                    </strong>
                                                </div>


                                                <div className="lawyer-detail-item">
                                                    <span>
                                                        License Number
                                                    </span>

                                                    <strong>
                                                        {selectedLawyer.licenseNumber ||
                                                            "-"}
                                                    </strong>
                                                </div>


                                                <div className="lawyer-detail-item">
                                                    <span>
                                                        Bar Association
                                                    </span>

                                                    <strong>
                                                        {selectedLawyer.bar_association ||
                                                            selectedLawyer.barAssociation ||
                                                            "-"}
                                                    </strong>
                                                </div>


                                                <div className="lawyer-detail-item">
                                                    <span>
                                                        Practice Area
                                                    </span>

                                                    <strong>
                                                        {selectedLawyer.practice_area ||
                                                            "-"}
                                                    </strong>
                                                </div>


                                                <div className="lawyer-detail-item">
                                                    <span>
                                                        Years of Practice
                                                    </span>

                                                    <strong>
                                                        {selectedLawyer.years_of_practice ??
                                                            "-"}
                                                    </strong>
                                                </div>


                                                <div className="lawyer-detail-item">
                                                    <span>
                                                        Registered
                                                    </span>

                                                    <strong>
                                                        {formatDate(
                                                            selectedLawyer.created_at
                                                        )}
                                                    </strong>
                                                </div>

                                            </div>

                                        </div>


                                        <div className="lawyer-details-section">

                                            <div className="lawyer-details-section-title">

                                                <i className="bi bi-geo-alt"></i>

                                                <span>
                                                    Address
                                                </span>

                                            </div>

                                            <div className="lawyer-address-box">

                                                {selectedLawyer.chamber_address ||
                                                    "No chamber address provided."}

                                            </div>

                                        </div>


                                        <div className="lawyer-details-footer">

                                            <button
                                                type="button"
                                                className="lawyer-details-close-btn"
                                                onClick={closeLawyerDetails}
                                            >
                                                Close
                                            </button>

                                        </div>

                                    </>
                                )}

                        </div>

                    </div>
                )}


            {/* =====================================================
                EDIT LAWYER MODAL
            ===================================================== */}

            {(editingLawyer || editLoading || editError) && (

                <div
                    className="lawyer-edit-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget &&
                            !editLoading
                        ) {
                            setEditingLawyer(null);
                            setEditError("");
                            setEditSuccess("");
                        }
                    }}
                >

                    <div className="lawyer-edit-modal">

                        {/* HEADER */}

                        <div className="lawyer-edit-header">

                            <div>

                                <h3>
                                    Edit Lawyer
                                </h3>

                                <p>
                                    Update registered lawyer information
                                </p>

                            </div>

                            <button
                                type="button"
                                className="lawyer-edit-close"
                                onClick={() => {
                                    if (!editLoading) {
                                        setEditingLawyer(null);
                                        setEditError("");
                                        setEditSuccess("");
                                    }
                                }}
                                disabled={editLoading}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>


                        {/* BODY */}

                        <form
                            className="lawyer-edit-form"
                            onSubmit={handleSaveLawyer}
                        >

                            {editError && (

                                <div className="lawyer-edit-error">

                                    <i className="bi bi-exclamation-circle-fill"></i>

                                    <span>
                                        {editError}
                                    </span>

                                </div>
                            )}


                            {editSuccess && (

                                <div className="lawyer-edit-success">

                                    <i className="bi bi-check-circle-fill"></i>

                                    <span>
                                        {editSuccess}
                                    </span>

                                </div>
                            )}


                            {/* Read-only information */}

                            {editingLawyer && (

                                <div className="lawyer-edit-readonly">

                                    <div>
                                        <span>Email</span>

                                        <strong>
                                            {editingLawyer.email || "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Bar Registration</span>

                                        <strong>
                                            {editingLawyer.barNumber || "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>License Number</span>

                                        <strong>
                                            {editingLawyer.licenseNumber || "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>CNIC</span>

                                        <strong>
                                            {editingLawyer.cnic || "-"}
                                        </strong>
                                    </div>

                                </div>
                            )}


                            {/* Full Name */}

                            <div className="lawyer-edit-field">

                                <label>
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="fullName"
                                    value={editForm.fullName}
                                    onChange={handleEditChange}
                                    placeholder="Enter full name"
                                    disabled={editLoading}
                                    required
                                />

                            </div>


                            {/* Phone */}

                            <div className="lawyer-edit-field">

                                <label>
                                    Phone Number
                                </label>

                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={editForm.phoneNumber}
                                    onChange={handleEditChange}
                                    placeholder="Enter phone number"
                                    disabled={editLoading}
                                    required
                                />

                            </div>


                            {/* Status */}

                            <div className="lawyer-edit-field">

                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={editForm.status}
                                    onChange={handleEditChange}
                                    disabled={editLoading}
                                >
                                    <option value="Pending">
                                        Pending
                                    </option>

                                    <option value="Verified">
                                        Verified
                                    </option>

                                    <option value="Suspended">
                                        Suspended
                                    </option>
                                </select>

                            </div>


                            {/* Practice Area */}

                            <div className="lawyer-edit-field">

                                <label>
                                    Practice Area
                                </label>

                                <input
                                    type="text"
                                    name="practiceArea"
                                    value={editForm.practiceArea}
                                    onChange={handleEditChange}
                                    placeholder="e.g. Criminal Law"
                                    disabled={editLoading}
                                />

                            </div>


                            {/* Years */}

                            <div className="lawyer-edit-field">

                                <label>
                                    Years of Practice
                                </label>

                                <input
                                    type="number"
                                    name="yearsOfPractice"
                                    value={editForm.yearsOfPractice}
                                    onChange={handleEditChange}
                                    placeholder="Enter years"
                                    min="0"
                                    disabled={editLoading}
                                />

                            </div>


                            {/* Chamber Address */}

                            <div className="lawyer-edit-field full-width">

                                <label>
                                    Chamber Address
                                </label>

                                <textarea
                                    name="chamberAddress"
                                    value={editForm.chamberAddress}
                                    onChange={handleEditChange}
                                    placeholder="Enter chamber address"
                                    rows="3"
                                    disabled={editLoading}
                                ></textarea>

                            </div>


                            {/* Additional Info */}

                            <div className="lawyer-edit-field full-width">

                                <label>
                                    Additional Information
                                </label>

                                <textarea
                                    name="additionalInfo"
                                    value={editForm.additionalInfo}
                                    onChange={handleEditChange}
                                    placeholder="Enter additional information"
                                    rows="3"
                                    disabled={editLoading}
                                ></textarea>

                            </div>


                            {/* FOOTER */}

                            <div className="lawyer-edit-footer">

                                <button
                                    type="button"
                                    className="lawyer-edit-cancel"
                                    onClick={() => {
                                        if (!editLoading) {
                                            setEditingLawyer(null);
                                            setEditError("");
                                            setEditSuccess("");
                                        }
                                    }}
                                    disabled={editLoading}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="lawyer-edit-save"
                                    disabled={editLoading}
                                >

                                    {editLoading ? (
                                        <>
                                            <i className="bi bi-arrow-repeat lawyer-edit-spin"></i>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg"></i>
                                            Save Changes
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

export default Lawyers;