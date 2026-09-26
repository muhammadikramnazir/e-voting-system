import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const menu = [
  {
    label: "Dashboard",
    icon: "bi-house-door-fill",
    path: "/",
  },
  {
    label: "My Profile",
    icon: "bi-person-fill",
    path: "/my-profile",
  },
  {
    label: "Elections",
    icon: "bi-check-square-fill",
    path: "/elections",
  },
  {
    label: "Cast Vote",
    icon: "bi-check-circle-fill",
    path: "/cast-vote",
  },
  {
    label: "Candidates",
    icon: "bi-people-fill",
    path: "/candidates",
  },
  {
    label: "Results",
    icon: "bi-bar-chart-fill",
    path: "/results",
  },
  {
    label: "Notices",
    icon: "bi-file-earmark-text-fill",
    path: "/notices",
    badge: 2,
  },
  {
    label: "Support",
    icon: "bi-question-circle-fill",
    path: "/support",
  },
  {
    label: "Settings",
    icon: "bi-gear-fill",
    path: "/settings",
  },
];

function Sidebar({ open, onClose }) {
  const navigate = useNavigate();

  // =====================================================
  // LOGO NAVIGATION
  // =====================================================

  const handleLogoClick = () => {
    if (onClose) {
      onClose();
    }

    navigate("/");
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    if (onClose) {
      onClose();
    }

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <aside
      className={`dba-sidebar ${
        open ? "open" : ""
      }`}
    >

      {/* =================================================
          BRAND / LOGO
      ================================================= */}

      <button
        type="button"
        className="sb-brand"
        onClick={handleLogoClick}
        aria-label="Go to Dashboard"
      >

        <i className="bi bi-scale" />

        <div>
          <strong>
            District Bar Association
          </strong>

          <small>
            Justice • Unity • Professionalism
          </small>
        </div>

      </button>


      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="sb-nav">

        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `sb-link ${
                isActive ? "active" : ""
              }`
            }
          >

            <i
              className={`bi ${item.icon}`}
            />

            <span>
              {item.label}
            </span>

            {item.badge && (
              <em className="sb-badge">
                {item.badge}
              </em>
            )}

          </NavLink>
        ))}


        {/* =================================================
            LOGOUT
        ================================================= */}

        <button
          type="button"
          className="sb-link sb-logout"
          onClick={handleLogout}
        >

          <i className="bi bi-box-arrow-right" />

          <span>
            Logout
          </span>

        </button>

      </nav>

    </aside>
  );
}

export default Sidebar;