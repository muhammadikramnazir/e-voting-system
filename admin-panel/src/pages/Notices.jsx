import { useEffect, useMemo, useState } from "react";
import "./Notices.css";

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

const getCurrentDateTime = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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

const normalizeNotice = (notice) => {
    return {
        id: notice.id,
        title: notice.title || "",
        description: notice.description || "",
        category: notice.category || "General",
        status: notice.status || "Draft",
        important:
            notice.important === true ||
            notice.important === 1 ||
            notice.important === "1",
        author:
            notice.author ||
            notice.author_name ||
            notice.created_by_name ||
            "System Administrator",
        date:
            notice.published_at ||
            notice.created_at ||
            notice.updated_at ||
            null,
        published_at: notice.published_at || null,
        created_at: notice.created_at || null,
        updated_at: notice.updated_at || null,
    };
};

function Notices() {
    const [notices, setNotices] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [importantOnly, setImportantOnly] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingNotice, setEditingNotice] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionId, setActionId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const emptyForm = {
        title: "",
        description: "",
        category: "General",
        status: "Draft",
        important: false,
    };

    const [form, setForm] = useState(emptyForm);

    // =========================================================
    // FETCH NOTICES
    // =========================================================

    const fetchNotices = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/admin/notices`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message || "Failed to load notices."
                );
            }

            const noticeList = Array.isArray(data.notices)
                ? data.notices.map(normalizeNotice)
                : [];

            setNotices(noticeList);
        } catch (err) {
            console.error("FETCH NOTICES ERROR:", err);

            setError(
                err.message || "Failed to load notices."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    // =========================================================
    // CATEGORY OPTIONS
    // =========================================================

    const categoryOptions = useMemo(() => {
        const defaultCategories = [
            "General",
            "Election",
            "System",
        ];

        const existingCategories = notices
            .map((notice) => notice.category)
            .filter(Boolean);

        return [
            ...new Set([
                ...defaultCategories,
                ...existingCategories,
            ]),
        ];
    }, [notices]);

    // =========================================================
    // STATISTICS
    // =========================================================

    const stats = useMemo(() => {
        return {
            total: notices.length,

            published: notices.filter(
                (notice) => notice.status === "Published"
            ).length,

            drafts: notices.filter(
                (notice) => notice.status === "Draft"
            ).length,

            important: notices.filter(
                (notice) => notice.important
            ).length,
        };
    }, [notices]);

    // =========================================================
    // FILTER
    // =========================================================

    const filteredNotices = useMemo(() => {
        return notices.filter((notice) => {
            const searchText =
                `${notice.title} ${notice.description} ${notice.category}`
                    .toLowerCase();

            const matchesSearch = searchText.includes(
                search.toLowerCase()
            );

            const matchesStatus =
                statusFilter === "All" ||
                notice.status === statusFilter;

            const matchesCategory =
                categoryFilter === "All" ||
                notice.category === categoryFilter;

            const matchesImportant =
                !importantOnly || notice.important;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesCategory &&
                matchesImportant
            );
        });
    }, [
        notices,
        search,
        statusFilter,
        categoryFilter,
        importantOnly,
    ]);

    // =========================================================
    // MODAL
    // =========================================================

    const openCreateModal = () => {
        setEditingNotice(null);
        setForm(emptyForm);
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    const openEditModal = (notice) => {
        setEditingNotice(notice);

        setForm({
            title: notice.title,
            description: notice.description,
            category: notice.category,
            status: notice.status,
            important: notice.important,
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingNotice(null);
        setForm(emptyForm);
    };

    const handleFormChange = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    // =========================================================
    // CREATE / UPDATE
    // =========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title.trim()) {
            setError("Notice title is required.");
            return;
        }

        if (!form.description.trim()) {
            setError("Notice description is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const isEditing = Boolean(editingNotice);

            const publishedAt =
                form.status === "Published"
                    ? editingNotice?.published_at ||
                    getCurrentDateTime()
                    : null;

            const body = {
                title: form.title.trim(),
                description: form.description.trim(),
                category: form.category,
                status: form.status,
                important: form.important ? 1 : 0,
                published_at: publishedAt,
            };

            const url = isEditing
                ? `${API_URL}/admin/notices/${editingNotice.id}`
                : `${API_URL}/admin/notices`;

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: getHeaders(),
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    `Failed to ${isEditing ? "update" : "create"
                    } notice.`
                );
            }

            closeModal();

            setSuccess(
                isEditing
                    ? "Notice updated successfully."
                    : "Notice created successfully."
            );

            await fetchNotices();

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error(
                "SAVE NOTICE ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to save notice."
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // TOGGLE STATUS
    // =========================================================

    const toggleStatus = async (notice) => {
        const newStatus =
            notice.status === "Published"
                ? "Draft"
                : "Published";

        try {
            setActionId(notice.id);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/admin/notices/${notice.id}`,
                {
                    method: "PUT",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        status: newStatus,
                        published_at:
                            newStatus === "Published"
                                ? notice.published_at ||
                                getCurrentDateTime()
                                : null,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    "Failed to update notice status."
                );
            }

            setSuccess(
                newStatus === "Published"
                    ? "Notice published successfully."
                    : "Notice moved to draft successfully."
            );

            await fetchNotices();

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error(
                "TOGGLE NOTICE STATUS ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to update notice status."
            );
        } finally {
            setActionId(null);
        }
    };

    // =========================================================
    // TOGGLE IMPORTANT
    // =========================================================

    const toggleImportant = async (notice) => {
        try {
            setActionId(notice.id);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/admin/notices/${notice.id}`,
                {
                    method: "PUT",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        important: notice.important
                            ? 0
                            : 1,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    "Failed to update notice importance."
                );
            }

            setSuccess(
                notice.important
                    ? "Notice removed from important."
                    : "Notice marked as important."
            );

            await fetchNotices();

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error(
                "TOGGLE IMPORTANT ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to update notice."
            );
        } finally {
            setActionId(null);
        }
    };

    // =========================================================
    // DELETE
    // =========================================================

    const deleteNotice = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this notice?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionId(id);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/admin/notices/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    "Failed to delete notice."
                );
            }

            setSuccess(
                "Notice deleted successfully."
            );

            await fetchNotices();

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error(
                "DELETE NOTICE ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to delete notice."
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
        setCategoryFilter("All");
        setImportantOnly(false);
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="notices-page">
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
                        Loading notices...
                    </span>
                </div>
            </div>
        );
    }

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="notices-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="notices-page-header">

                <div>
                    <span className="notices-overline">
                        COMMUNICATION
                    </span>

                    <h1>
                        Notices
                    </h1>

                    <p>
                        Create and manage announcements for the
                        e-voting system.
                    </p>
                </div>

                <button
                    type="button"
                    className="notices-create-btn"
                    onClick={openCreateModal}
                >
                    <i className="bi bi-plus-lg"></i>
                    Create Notice
                </button>

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
                        style={{ marginRight: "7px" }}
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
                        style={{ marginRight: "7px" }}
                    ></i>

                    {success}
                </div>
            )}

            {/* =================================================
                STATS
            ================================================= */}

            <div className="notices-stats">

                <div className="notice-stat-card">

                    <div className="notice-stat-icon blue">
                        <i className="bi bi-megaphone"></i>
                    </div>

                    <div>
                        <span>
                            TOTAL NOTICES
                        </span>

                        <strong>
                            {stats.total}
                        </strong>
                    </div>

                </div>

                <div className="notice-stat-card">

                    <div className="notice-stat-icon green">
                        <i className="bi bi-check-circle"></i>
                    </div>

                    <div>
                        <span>
                            PUBLISHED
                        </span>

                        <strong>
                            {stats.published}
                        </strong>
                    </div>

                </div>

                <div className="notice-stat-card">

                    <div className="notice-stat-icon orange">
                        <i className="bi bi-file-earmark"></i>
                    </div>

                    <div>
                        <span>
                            DRAFTS
                        </span>

                        <strong>
                            {stats.drafts}
                        </strong>
                    </div>

                </div>

                <div className="notice-stat-card">

                    <div className="notice-stat-icon red">
                        <i className="bi bi-star"></i>
                    </div>

                    <div>
                        <span>
                            IMPORTANT
                        </span>

                        <strong>
                            {stats.important}
                        </strong>
                    </div>

                </div>

            </div>

            {/* =================================================
                FILTER CARD
            ================================================= */}

            <div className="notices-filter-card">

                <div className="notices-search">

                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        placeholder="Search notices..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                        >
                            <i className="bi bi-x"></i>
                        </button>
                    )}

                </div>

                <div className="notices-filter-group">

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                    >
                        <option value="All">
                            All Status
                        </option>

                        <option value="Published">
                            Published
                        </option>

                        <option value="Draft">
                            Draft
                        </option>
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) =>
                            setCategoryFilter(e.target.value)
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

                    <button
                        type="button"
                        className={`important-filter ${importantOnly
                                ? "active"
                                : ""
                            }`}
                        onClick={() =>
                            setImportantOnly(
                                (current) => !current
                            )
                        }
                    >
                        <i className="bi bi-star-fill"></i>
                        Important
                    </button>

                </div>

            </div>

            {/* =================================================
                RESULTS HEADER
            ================================================= */}

            <div className="notices-results-header">

                <div>
                    <strong>
                        {filteredNotices.length}
                    </strong>

                    <span>
                        {filteredNotices.length === 1
                            ? " notice found"
                            : " notices found"}
                    </span>
                </div>

                {(search ||
                    statusFilter !== "All" ||
                    categoryFilter !== "All" ||
                    importantOnly) && (
                        <button
                            type="button"
                            className="clear-filters-btn"
                            onClick={clearFilters}
                        >
                            <i className="bi bi-arrow-counterclockwise"></i>
                            Clear Filters
                        </button>
                    )}

            </div>

            {/* =================================================
                NOTICE LIST
            ================================================= */}

            {filteredNotices.length === 0 ? (

                <div className="notices-empty">

                    <div className="notices-empty-icon">
                        <i className="bi bi-megaphone"></i>
                    </div>

                    <h3>
                        No Notices Found
                    </h3>

                    <p>
                        Try changing your filters or create a
                        new notice.
                    </p>

                    <button
                        type="button"
                        onClick={openCreateModal}
                    >
                        <i className="bi bi-plus-lg"></i>
                        Create Notice
                    </button>

                </div>

            ) : (

                <div className="notices-list">

                    {filteredNotices.map(
                        (notice) => (

                            <div
                                className="notice-card"
                                key={notice.id}
                            >

                                {/* NOTICE ICON */}

                                <div
                                    className={`notice-card-icon ${notice.important
                                            ? "important"
                                            : ""
                                        }`}
                                >
                                    <i
                                        className={
                                            notice.category ===
                                                "Election"
                                                ? "bi bi-check2-square"
                                                : notice.category ===
                                                    "System"
                                                    ? "bi bi-gear"
                                                    : "bi bi-megaphone"
                                        }
                                    ></i>
                                </div>

                                {/* NOTICE CONTENT */}

                                <div className="notice-card-content">

                                    <div className="notice-card-top">

                                        <div className="notice-title-area">

                                            <div className="notice-title-row">

                                                <h3>
                                                    {notice.title}
                                                </h3>

                                                {notice.important && (
                                                    <span className="important-badge">
                                                        <i className="bi bi-star-fill"></i>
                                                        Important
                                                    </span>
                                                )}

                                            </div>

                                            <p>
                                                {notice.description}
                                            </p>

                                        </div>

                                        <div
                                            className={`notice-status ${notice.status ===
                                                    "Published"
                                                    ? "published"
                                                    : "draft"
                                                }`}
                                        >
                                            <span></span>
                                            {notice.status}
                                        </div>

                                    </div>

                                    {/* META */}

                                    <div className="notice-card-footer">

                                        <div className="notice-meta">

                                            <span>
                                                <i className="bi bi-tag"></i>
                                                {notice.category}
                                            </span>

                                            <span>
                                                <i className="bi bi-person"></i>
                                                {notice.author}
                                            </span>

                                            <span>
                                                <i className="bi bi-calendar3"></i>
                                                {formatDate(
                                                    notice.date
                                                )}
                                            </span>

                                        </div>

                                        {/* ACTIONS */}

                                        <div className="notice-actions">

                                            <button
                                                type="button"
                                                className="notice-action important-action"
                                                title={
                                                    notice.important
                                                        ? "Remove importance"
                                                        : "Mark as important"
                                                }
                                                onClick={() =>
                                                    toggleImportant(
                                                        notice
                                                    )
                                                }
                                                disabled={
                                                    actionId ===
                                                    notice.id
                                                }
                                            >
                                                <i
                                                    className={
                                                        notice.important
                                                            ? "bi bi-star-fill"
                                                            : "bi bi-star"
                                                    }
                                                ></i>
                                            </button>

                                            <button
                                                type="button"
                                                className="notice-action"
                                                title={
                                                    notice.status ===
                                                        "Published"
                                                        ? "Move to draft"
                                                        : "Publish"
                                                }
                                                onClick={() =>
                                                    toggleStatus(
                                                        notice
                                                    )
                                                }
                                                disabled={
                                                    actionId ===
                                                    notice.id
                                                }
                                            >
                                                <i
                                                    className={
                                                        notice.status ===
                                                            "Published"
                                                            ? "bi bi-eye-slash"
                                                            : "bi bi-megaphone"
                                                    }
                                                ></i>
                                            </button>

                                            <button
                                                type="button"
                                                className="notice-action"
                                                title="Edit notice"
                                                onClick={() =>
                                                    openEditModal(
                                                        notice
                                                    )
                                                }
                                                disabled={
                                                    actionId ===
                                                    notice.id
                                                }
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </button>

                                            <button
                                                type="button"
                                                className="notice-action delete"
                                                title="Delete notice"
                                                onClick={() =>
                                                    deleteNotice(
                                                        notice.id
                                                    )
                                                }
                                                disabled={
                                                    actionId ===
                                                    notice.id
                                                }
                                            >
                                                <i className="bi bi-trash3"></i>
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
                CREATE / EDIT MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="notice-modal-overlay"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="notice-modal">

                        {/* MODAL HEADER */}

                        <div className="notice-modal-header">

                            <div>

                                <span>
                                    NOTICE MANAGEMENT
                                </span>

                                <h2>
                                    {editingNotice
                                        ? "Edit Notice"
                                        : "Create Notice"}
                                </h2>

                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                aria-label="Close"
                                disabled={saving}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        {/* FORM */}

                        <form
                            className="notice-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="notice-form-group">

                                <label>
                                    Notice Title
                                </label>

                                <input
                                    type="text"
                                    placeholder="Enter notice title"
                                    value={form.title}
                                    onChange={(e) =>
                                        handleFormChange(
                                            "title",
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                            </div>

                            <div className="notice-form-group">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    rows="5"
                                    placeholder="Write your notice..."
                                    value={form.description}
                                    onChange={(e) =>
                                        handleFormChange(
                                            "description",
                                            e.target.value
                                        )
                                    }
                                    required
                                ></textarea>

                            </div>

                            <div className="notice-form-grid">

                                <div className="notice-form-group">

                                    <label>
                                        Category
                                    </label>

                                    <select
                                        value={form.category}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "category",
                                                e.target.value
                                            )
                                        }
                                    >
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

                                <div className="notice-form-group">

                                    <label>
                                        Status
                                    </label>

                                    <select
                                        value={form.status}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "status",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="Draft">
                                            Draft
                                        </option>

                                        <option value="Published">
                                            Published
                                        </option>
                                    </select>

                                </div>

                            </div>

                            <label className="notice-important-check">

                                <input
                                    type="checkbox"
                                    checked={
                                        form.important
                                    }
                                    onChange={(e) =>
                                        handleFormChange(
                                            "important",
                                            e.target.checked
                                        )
                                    }
                                />

                                <span className="custom-checkbox">
                                    <i className="bi bi-check"></i>
                                </span>

                                <span>
                                    Mark this notice as important
                                </span>

                            </label>

                            {/* FORM ACTIONS */}

                            <div className="notice-form-actions">

                                <button
                                    type="button"
                                    className="notice-cancel-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="notice-save-btn"
                                    disabled={saving}
                                >
                                    <i
                                        className={
                                            saving
                                                ? "bi bi-arrow-repeat"
                                                : editingNotice
                                                    ? "bi bi-check-lg"
                                                    : "bi bi-plus-lg"
                                        }
                                    ></i>

                                    {saving
                                        ? "Saving..."
                                        : editingNotice
                                            ? "Update Notice"
                                            : "Create Notice"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Notices;