import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const menuItems = [
    {
        name: "Dashboard",
        path: "/admin/dashboard",
        icon: "bi-speedometer2",
    },
    {
        name: "Lawyers",
        path: "/admin/lawyers",
        icon: "bi-people",
    },
    {
        name: "Verifications",
        path: "/admin/verifications",
        icon: "bi-patch-check",
    },
    {
        name: "Elections",
        path: "/admin/elections",
        icon: "bi-check2-square",
    },
    {
        name: "Positions",
        path: "/admin/positions",
        icon: "bi-diagram-3",
    },
    {
        name: "Candidates",
        path: "/admin/candidates",
        icon: "bi-person-badge",
    },
    {
        name: "Votes",
        path: "/admin/votes",
        icon: "bi-check-circle",
    },
    {
        name: "Results",
        path: "/admin/results",
        icon: "bi-bar-chart",
    },
    {
        name: "Notices",
        path: "/admin/notices",
        icon: "bi-megaphone",
    },
    {
        name: "Support",
        path: "/admin/support",
        icon: "bi-headset",
    },
];

function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {
        const confirmed = window.confirm(
            "Are you sure you want to logout?"
        );

        if (!confirmed) return;

        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        onClose();

        navigate("/admin/login", {
            replace: true,
        });
    };

    // =====================================================
    // LOGO NAVIGATION
    // =====================================================

    const handleLogoClick = () => {
        onClose();

        navigate("/admin/dashboard");
    };

    // =====================================================
    // MENU NAVIGATION
    // =====================================================

    const handleNavigation = () => {
        onClose();
    };

    return (
        <>
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                ></div>
            )}

            <aside
                className={`admin-sidebar ${isOpen ? "mobile-open" : ""
                    }`}
            >

                {/* =================================================
                    LOGO
                ================================================= */}

                <button
                    type="button"
                    className="sidebar-logo"
                    onClick={handleLogoClick}
                    aria-label="Go to Admin Dashboard"
                >

                    <div className="logo-icon">
                        <i className="bi bi-check2-circle"></i>
                    </div>

                    <div className="sidebar-logo-text">
                        <h4>E-Voting</h4>
                        <span>Admin Panel</span>
                    </div>

                    <span
                        className="sidebar-mobile-close"
                        onClick={(event) => {
                            event.stopPropagation();
                            onClose();
                        }}
                        role="button"
                        aria-label="Close menu"
                    >
                        <i className="bi bi-x-lg"></i>
                    </span>

                </button>


                {/* =================================================
                    MENU
                ================================================= */}

                <div className="sidebar-menu">

                    <p className="menu-title">
                        MAIN MENU
                    </p>

                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={handleNavigation}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? "active" : ""
                                }`
                            }
                        >

                            <i
                                className={`bi ${item.icon}`}
                            ></i>

                            <span>
                                {item.name}
                            </span>

                        </NavLink>
                    ))}

                </div>


                {/* =================================================
                    BOTTOM MENU
                ================================================= */}

                <div className="sidebar-bottom">

                    <NavLink
                        to="/admin/profile"
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "active" : ""
                            }`
                        }
                    >
                        <i className="bi bi-person-circle"></i>
                        <span>Admin Profile</span>
                    </NavLink>


                    <NavLink
                        to="/admin/settings"
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "active" : ""
                            }`
                        }
                    >
                        <i className="bi bi-gear"></i>
                        <span>Settings</span>
                    </NavLink>


                    <button
                        type="button"
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        <i className="bi bi-box-arrow-right"></i>
                        <span>Logout</span>
                    </button>

                </div>

            </aside>
        </>
    );
}

export default Sidebar;