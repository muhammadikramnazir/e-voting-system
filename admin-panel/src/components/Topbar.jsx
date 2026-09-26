import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./Topbar.css";


const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";


const pageInfo = {
    "/admin/dashboard": {
        title: "Dashboard",
        description: "Overview of your e-voting system",
    },

    "/admin/lawyers": {
        title: "Lawyers",
        description: "Manage registered lawyers",
    },

    "/admin/verifications": {
        title: "Verifications",
        description: "Review lawyer verification requests",
    },

    "/admin/elections": {
        title: "Elections",
        description: "Manage and monitor elections",
    },

    "/admin/positions": {
        title: "Positions",
        description: "Manage election positions",
    },

    "/admin/candidates": {
        title: "Candidates",
        description: "Manage election candidates",
    },

    "/admin/votes": {
        title: "Votes",
        description: "Monitor voting activity",
    },

    "/admin/results": {
        title: "Results",
        description: "View and manage election results",
    },

    "/admin/notices": {
        title: "Notices",
        description: "Manage system notices",
    },

    "/admin/support": {
        title: "Support",
        description: "Manage support requests",
    },

    "/admin/profile": {
        title: "Admin Profile",
        description: "Manage administrator profile",
    },

    "/admin/settings": {
        title: "Settings",
        description: "Manage system settings",
    },
};


function Topbar({ onMenuClick }) {

    const location = useLocation();
    const navigate = useNavigate();

    const notificationRef = useRef(null);


    const [admin, setAdmin] = useState({
        name: "System Administrator",
        role: "Super Administrator",
    });


    const [notifications, setNotifications] = useState([]);

    const [notificationOpen, setNotificationOpen] =
        useState(false);

    const [notificationLoading, setNotificationLoading] =
        useState(false);


    // =====================================================
    // LOAD ADMIN
    // =====================================================

    useEffect(() => {

        const savedAdmin =
            localStorage.getItem("admin");

        if (!savedAdmin) {
            return;
        }

        try {

            const parsedAdmin =
                JSON.parse(savedAdmin);

            setAdmin({
                name:
                    parsedAdmin.name ||
                    "System Administrator",

                role:
                    parsedAdmin.role ||
                    "Super Administrator",
            });

        } catch {
            // Keep default admin information
        }

    }, []);


    // =====================================================
    // FETCH NOTIFICATIONS
    // =====================================================

    const fetchNotifications = async () => {

        try {

            setNotificationLoading(true);

            const token =
                localStorage.getItem("adminToken");

            if (!token) {
                setNotifications([]);
                return;
            }


            const headers = {
                Authorization: `Bearer ${token}`,
            };


            // -------------------------------------------------
            // VERIFICATIONS
            // -------------------------------------------------

            const verificationResponse =
                await fetch(
                    `${API_URL}/admin/verifications`,
                    {
                        method: "GET",
                        headers,
                    }
                );


            let verificationNotifications = [];


            if (verificationResponse.ok) {

                const verificationData =
                    await verificationResponse.json();

                const verifications =
                    Array.isArray(
                        verificationData.verifications
                    )
                        ? verificationData.verifications
                        : [];


                const pendingVerifications =
                    verifications.filter(
                        (item) =>
                            String(item.status || "")
                                .toLowerCase() ===
                            "pending"
                    );


                if (
                    pendingVerifications.length > 0
                ) {

                    verificationNotifications.push({
                        id: "pending-verifications",
                        type: "verification",
                        title: "Pending verifications",
                        message: `${pendingVerifications.length} lawyer verification request${pendingVerifications.length > 1
                                ? "s"
                                : ""
                            } require${pendingVerifications.length > 1
                                ? ""
                                : "s"
                            } review.`,
                        icon: "bi-person-check",
                        className: "blue",
                        path: "/admin/verifications",
                    });

                }

            }


            // -------------------------------------------------
            // SUPPORT REQUESTS
            // -------------------------------------------------

            const supportResponse =
                await fetch(
                    `${API_URL}/admin/support`,
                    {
                        method: "GET",
                        headers,
                    }
                );


            let supportNotifications = [];


            if (supportResponse.ok) {

                const supportData =
                    await supportResponse.json();

                const requests =
                    Array.isArray(
                        supportData.requests
                    )
                        ? supportData.requests
                        : [];


                const openRequests =
                    requests.filter((item) => {

                        const status =
                            String(
                                item.status || ""
                            ).toLowerCase();

                        return (
                            status === "open" ||
                            status === "in progress"
                        );

                    });


                if (openRequests.length > 0) {

                    supportNotifications.push({
                        id: "support-requests",
                        type: "support",
                        title: "Support requests",
                        message: `${openRequests.length} support request${openRequests.length > 1
                                ? "s"
                                : ""
                            } need${openRequests.length > 1
                                ? ""
                                : "s"
                            } attention.`,
                        icon: "bi-headset",
                        className: "orange",
                        path: "/admin/support",
                    });

                }

            }


            // -------------------------------------------------
            // ACTIVE ELECTION
            // -------------------------------------------------

            const electionResponse =
                await fetch(
                    `${API_URL}/admin/elections`,
                    {
                        method: "GET",
                        headers,
                    }
                );


            let electionNotifications = [];


            if (electionResponse.ok) {

                const electionData =
                    await electionResponse.json();

                const elections =
                    Array.isArray(
                        electionData.elections
                    )
                        ? electionData.elections
                        : [];


                const activeElections =
                    elections.filter(
                        (item) =>
                            String(item.status || "")
                                .toLowerCase() ===
                            "active"
                    );


                if (activeElections.length > 0) {

                    const election =
                        activeElections[0];

                    electionNotifications.push({
                        id: "active-election",
                        type: "election",
                        title: "Election is active",
                        message:
                            election.title ||
                            "An election is currently active.",
                        icon: "bi-check2-square",
                        className: "green",
                        path: "/admin/elections",
                    });

                }

            }


            // -------------------------------------------------
            // COMBINE
            // -------------------------------------------------

            setNotifications([
                ...verificationNotifications,
                ...supportNotifications,
                ...electionNotifications,
            ]);

        } catch (error) {

            console.error(
                "ADMIN NOTIFICATION ERROR:",
                error
            );

            setNotifications([]);

        } finally {

            setNotificationLoading(false);

        }

    };


    // =====================================================
    // INITIAL NOTIFICATION LOAD
    // =====================================================

    useEffect(() => {

        fetchNotifications();

    }, []);


    // =====================================================
    // REFRESH NOTIFICATIONS
    // =====================================================

    useEffect(() => {

        const interval =
            setInterval(
                fetchNotifications,
                60000
            );

        return () => {
            clearInterval(interval);
        };

    }, []);


    // =====================================================
    // CLOSE WHEN CLICKING OUTSIDE
    // =====================================================

    useEffect(() => {

        const handleOutsideClick = (event) => {

            if (
                notificationRef.current &&
                !notificationRef.current.contains(
                    event.target
                )
            ) {
                setNotificationOpen(false);
            }

        };


        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );


        return () => {

            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

        };

    }, []);


    // =====================================================
    // NOTIFICATION CLICK
    // =====================================================

    const handleNotificationClick = (notification) => {

        setNotificationOpen(false);

        if (notification.path) {

            navigate(
                notification.path
            );

        }

    };


    // =====================================================
    // CURRENT PAGE
    // =====================================================

    const currentPage =
        pageInfo[location.pathname] || {
            title: "Admin Panel",
            description:
                "E-Voting administration system",
        };


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <header className="admin-topbar">

            {/* =================================================
                LEFT
            ================================================= */}

            <div className="topbar-left">

                {/* Mobile Menu Button */}

                <button
                    type="button"
                    className="topbar-menu-button"
                    onClick={onMenuClick}
                    aria-label="Open navigation menu"
                >
                    <i className="bi bi-list"></i>
                </button>


                <div className="topbar-title">

                    <h2>
                        {currentPage.title}
                    </h2>

                    <p>
                        {currentPage.description}
                    </p>

                </div>

            </div>


            {/* =================================================
                RIGHT
            ================================================= */}

            <div className="topbar-right">

                {/* =================================================
                    NOTIFICATION
                ================================================= */}

                <div
                    className="topbar-notification-wrapper"
                    ref={notificationRef}
                >

                    <button
                        type="button"
                        className="topbar-notification"
                        aria-label="Notifications"
                        onClick={() => {

                            setNotificationOpen(
                                (current) => !current
                            );

                            if (!notificationOpen) {
                                fetchNotifications();
                            }

                        }}
                    >

                        <i className="bi bi-bell"></i>


                        {notifications.length > 0 && (
                            <span className="notification-dot"></span>
                        )}

                    </button>


                    {/* =================================================
                        NOTIFICATION DROPDOWN
                    ================================================= */}

                    {notificationOpen && (

                        <div className="notification-dropdown">

                            <div className="notification-dropdown-header">

                                <div>

                                    <strong>
                                        Notifications
                                    </strong>

                                    <span>
                                        {notifications.length} active
                                    </span>

                                </div>


                                <button
                                    type="button"
                                    onClick={fetchNotifications}
                                    aria-label="Refresh notifications"
                                >
                                    <i className="bi bi-arrow-clockwise"></i>
                                </button>

                            </div>


                            <div className="notification-list">

                                {notificationLoading ? (

                                    <div className="notification-empty">

                                        <i className="bi bi-arrow-repeat notification-loading-icon"></i>

                                        <span>
                                            Loading notifications...
                                        </span>

                                    </div>

                                ) : notifications.length === 0 ? (

                                    <div className="notification-empty">

                                        <div className="notification-empty-icon">
                                            <i className="bi bi-bell-slash"></i>
                                        </div>

                                        <strong>
                                            No new notifications
                                        </strong>

                                        <span>
                                            Everything is up to date.
                                        </span>

                                    </div>

                                ) : (

                                    notifications.map(
                                        (notification) => (

                                            <button
                                                type="button"
                                                key={notification.id}
                                                className="notification-item"
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        notification
                                                    )
                                                }
                                            >

                                                <div
                                                    className={`notification-item-icon ${notification.className}`}
                                                >
                                                    <i
                                                        className={`bi ${notification.icon}`}
                                                    ></i>
                                                </div>


                                                <div className="notification-item-content">

                                                    <strong>
                                                        {notification.title}
                                                    </strong>

                                                    <span>
                                                        {notification.message}
                                                    </span>

                                                    <small>
                                                        View details
                                                        <i className="bi bi-arrow-right"></i>
                                                    </small>

                                                </div>

                                            </button>

                                        )
                                    )

                                )}

                            </div>


                            {notifications.length > 0 && (
                                <div className="notification-dropdown-footer">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNotificationOpen(
                                                false
                                            );

                                            navigate(
                                                "/admin/dashboard"
                                            );
                                        }}
                                    >
                                        View Dashboard
                                    </button>

                                </div>
                            )}

                        </div>

                    )}

                </div>


                {/* =================================================
                    DIVIDER
                ================================================= */}

                <div className="topbar-divider"></div>


                {/* =================================================
                    ADMIN
                ================================================= */}

                <button
                    type="button"
                    className="topbar-profile"
                    onClick={() => {
                        window.location.href =
                            "/admin/profile";
                    }}
                >

                    <div className="topbar-avatar">
                        <i className="bi bi-person-fill"></i>
                    </div>


                    <div className="topbar-profile-info">

                        <strong>
                            {admin.name}
                        </strong>

                        <span>
                            {admin.role}
                        </span>

                    </div>


                    <i
                        className="bi bi-chevron-down topbar-profile-arrow"
                    ></i>

                </button>

            </div>

        </header>
    );
}

export default Topbar;