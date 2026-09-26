import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { currentUser } from "../../data";
import { API_ORIGIN, getProfile } from "../../apis/authapi";
import "./Topbar.css";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:4000/api/v1";

function Topbar({ onMenuClick }) {
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);

  const [searchOpen, setSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] =
    useState(false);
  const [notificationLoading, setNotificationLoading] =
    useState(false);

  const notificationRef = useRef(null);

  const navigate = useNavigate();

  // ======================================================
  // SEARCH ITEMS
  // ======================================================

  const searchItems = [
    {
      title: "Dashboard",
      description: "View your e-voting dashboard",
      icon: "bi-house-door-fill",
      path: "/",
      keywords: "dashboard home overview",
    },
    {
      title: "Elections",
      description: "View available elections",
      icon: "bi-check-square-fill",
      path: "/elections",
      keywords: "election elections voting",
    },
    {
      title: "Cast Vote",
      description: "Cast your vote",
      icon: "bi-check-circle-fill",
      path: "/cast-vote",
      keywords: "vote voting cast ballot",
    },
    {
      title: "Candidates",
      description: "View election candidates",
      icon: "bi-people-fill",
      path: "/candidates",
      keywords: "candidate candidates lawyers",
    },
    {
      title: "Results",
      description: "View election results",
      icon: "bi-bar-chart-fill",
      path: "/results",
      keywords: "results result election",
    },
    {
      title: "Notices",
      description: "View association notices",
      icon: "bi-file-earmark-text-fill",
      path: "/notices",
      keywords:
        "notice notices announcement announcements",
    },
    {
      title: "Support",
      description: "Contact support",
      icon: "bi-question-circle-fill",
      path: "/support",
      keywords:
        "support help complaint request",
    },
    {
      title: "My Profile",
      description: "Manage your profile",
      icon: "bi-person-fill",
      path: "/my-profile",
      keywords:
        "profile account personal information",
    },
    {
      title: "Verification",
      description: "Manage account verification",
      icon: "bi-patch-check-fill",
      path: "/verification",
      keywords:
        "verification verify account lawyer",
    },
    {
      title: "Settings",
      description: "Manage account settings",
      icon: "bi-gear-fill",
      path: "/settings",
      keywords:
        "settings preferences password",
    },
  ];

  // ======================================================
  // TOKEN
  // ======================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };

  // ======================================================
  // LOAD PROFILE
  // ======================================================

  const fetchProfile = async () => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      const data = await getProfile(token);

      if (data?.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.log(
        "TOPBAR PROFILE ERROR:",
        error
      );
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ======================================================
  // PROFILE UPDATE EVENT
  // ======================================================

  useEffect(() => {
    const handleProfileUpdated = (event) => {
      if (event?.detail?.user) {
        setUser(event.detail.user);
      } else {
        fetchProfile();
      }
    };

    window.addEventListener(
      "profileUpdated",
      handleProfileUpdated
    );

    return () => {
      window.removeEventListener(
        "profileUpdated",
        handleProfileUpdated
      );
    };
  }, []);

  // ======================================================
  // SEARCH RESULTS
  // ======================================================

  const filteredSearchItems = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return [];
    }

    return searchItems.filter((item) => {
      const searchableText = `
        ${item.title}
        ${item.description}
        ${item.keywords}
      `.toLowerCase();

      return searchableText.includes(query);
    });
  }, [search]);

  // ======================================================
  // SEARCH NAVIGATION
  // ======================================================

  const handleSearchNavigation = (item) => {
    setSearch("");
    setSearchOpen(false);

    navigate(item.path);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (filteredSearchItems.length > 0) {
      handleSearchNavigation(
        filteredSearchItems[0]
      );
    }
  };

  // ======================================================
  // FETCH MEMBER NOTIFICATIONS
  // ======================================================

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);

      const token = getToken();

      if (!token) {
        setNotifications([]);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [noticesResponse, electionsResponse] =
        await Promise.all([
          fetch(`${API_URL}/notices`, {
            method: "GET",
            headers,
          }),

          fetch(`${API_URL}/elections`, {
            method: "GET",
            headers,
          }),
        ]);

      const noticeNotifications = [];
      const electionNotifications = [];

      // ==================================================
      // NOTICES
      // ==================================================

      if (noticesResponse.ok) {
        const noticeData =
          await noticesResponse.json();

        const notices = Array.isArray(
          noticeData.notices
        )
          ? noticeData.notices
          : [];

        /*
         * Show latest 5 published notices.
         * Important notices are placed first.
         */

        const sortedNotices = [...notices]
          .sort((a, b) => {
            const importantA =
              Number(a.important || 0);

            const importantB =
              Number(b.important || 0);

            if (importantA !== importantB) {
              return importantB - importantA;
            }

            const dateA = new Date(
              a.published_at ||
              a.created_at ||
              0
            ).getTime();

            const dateB = new Date(
              b.published_at ||
              b.created_at ||
              0
            ).getTime();

            return dateB - dateA;
          })
          .slice(0, 5);

        sortedNotices.forEach((notice) => {
          noticeNotifications.push({
            id: `notice-${notice.id}`,
            type: "notice",

            title:
              notice.important
                ? "Important Notice"
                : "New Notice",

            message:
              notice.title ||
              "A new association notice is available.",

            icon: notice.important
              ? "bi-exclamation-circle"
              : "bi-file-earmark-text",

            className: notice.important
              ? "orange"
              : "blue",

            path: "/notices",
          });
        });
      }

      // ==================================================
      // ELECTIONS
      // ==================================================

      if (electionsResponse.ok) {
        const electionData =
          await electionsResponse.json();

        const elections = Array.isArray(
          electionData.elections
        )
          ? electionData.elections
          : [];

        const relevantElections =
          elections
            .filter((election) => {
              const status = String(
                election.status || ""
              ).toLowerCase();

              return (
                status === "active" ||
                status === "upcoming"
              );
            })
            .slice(0, 3);

        relevantElections.forEach(
          (election) => {
            const status = String(
              election.status || ""
            ).toLowerCase();

            const isActive =
              status === "active";

            electionNotifications.push({
              id: `election-${election.id}`,
              type: "election",

              title: isActive
                ? "Election is Active"
                : "Upcoming Election",

              message:
                election.title ||
                "An election is available.",

              icon: isActive
                ? "bi-check-circle"
                : "bi-calendar-event",

              className: isActive
                ? "green"
                : "purple",

              path: "/elections",
            });
          }
        );
      }

      setNotifications([
        ...noticeNotifications,
        ...electionNotifications,
      ]);
    } catch (error) {
      console.error(
        "MEMBER NOTIFICATION ERROR:",
        error
      );

      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  };

  // ======================================================
  // INITIAL NOTIFICATION LOAD
  // ======================================================

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ======================================================
  // AUTO REFRESH
  // ======================================================

  useEffect(() => {
    const interval = setInterval(
      fetchNotifications,
      60000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ======================================================
  // CLOSE NOTIFICATION ON OUTSIDE CLICK
  // ======================================================

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

  // ======================================================
  // NOTIFICATION CLICK
  // ======================================================

  const handleNotificationClick = (
    notification
  ) => {
    setNotificationOpen(false);

    if (notification.path) {
      navigate(notification.path);
    }
  };

  // ======================================================
  // USER DATA
  // ======================================================

  const userName =
    user?.full_name ||
    user?.fullName ||
    currentUser?.name ||
    "User";

  const userRole =
    user?.role ||
    "Lawyer";

  const profileImage = user?.profile_photo
    ? `${API_URL.replace(
      "/api/v1",
      ""
    )}/uploads/${user.profile_photo}`
    : null;

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <header className="dba-topbar">

      {/* ==================================================
          MOBILE MENU
      ================================================== */}

      <button
        className="tb-menu"
        onClick={onMenuClick}
        aria-label="Open menu"
        type="button"
      >
        <i className="bi bi-list"></i>
      </button>


      {/* ==================================================
          SEARCH
      ================================================== */}

      <div className="tb-search-wrapper">

        <div className="tb-search">

          <i className="bi bi-search"></i>

          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => {
              if (search.trim()) {
                setSearchOpen(true);
              }
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search anything..."
            aria-label="Search"
            autoComplete="off"
          />

          {search && (
            <button
              type="button"
              className="tb-search-clear"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                setSearchOpen(false);
              }}
            >
              <i className="bi bi-x"></i>
            </button>
          )}

        </div>


        {/* ==================================================
            SEARCH RESULTS
        ================================================== */}

        {searchOpen &&
          search.trim() && (
            <div className="tb-search-results">

              {filteredSearchItems.length > 0 ? (
                <>
                  <div className="tb-search-results-header">
                    <span>
                      Search results
                    </span>

                    <small>
                      {filteredSearchItems.length}
                    </small>
                  </div>

                  {filteredSearchItems.map(
                    (item) => (
                      <button
                        type="button"
                        key={item.path}
                        className="tb-search-result"
                        onClick={() =>
                          handleSearchNavigation(
                            item
                          )
                        }
                      >

                        <span className="tb-search-result-icon">
                          <i
                            className={`bi ${item.icon}`}
                          ></i>
                        </span>

                        <span className="tb-search-result-content">

                          <strong>
                            {item.title}
                          </strong>

                          <small>
                            {item.description}
                          </small>

                        </span>

                        <i className="bi bi-arrow-right tb-search-result-arrow"></i>

                      </button>
                    )
                  )}
                </>
              ) : (
                <div className="tb-search-empty">

                  <span className="tb-search-empty-icon">
                    <i className="bi bi-search"></i>
                  </span>

                  <strong>
                    No results found
                  </strong>

                  <small>
                    Try searching for elections,
                    candidates, results or support.
                  </small>

                </div>
              )}

            </div>
          )}

      </div>


      {/* ==================================================
          RIGHT SIDE
      ================================================== */}

      <div className="tb-right">

        {/* ==================================================
            NOTIFICATION
        ================================================== */}

        <div
          className="tb-notification-wrapper"
          ref={notificationRef}
        >

          <button
            className="tb-bell"
            aria-label="Notifications"
            type="button"
            onClick={() => {
              setNotificationOpen(
                (current) => !current
              );

              if (!notificationOpen) {
                fetchNotifications();
              }
            }}
          >

            <i className="bi bi-bell-fill"></i>

            {notifications.length > 0 && (
              <em>
                {notifications.length > 9
                  ? "9+"
                  : notifications.length}
              </em>
            )}

          </button>


          {/* ==================================================
              NOTIFICATION DROPDOWN
          ================================================== */}

          {notificationOpen && (
            <div className="tb-notification-dropdown">

              <div className="tb-notification-header">

                <div>
                  <strong>
                    Notifications
                  </strong>

                  <span>
                    {notifications.length} available
                  </span>
                </div>

                <button
                  type="button"
                  aria-label="Refresh notifications"
                  onClick={fetchNotifications}
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>

              </div>


              <div className="tb-notification-list">

                {notificationLoading ? (

                  <div className="tb-notification-empty">

                    <i className="bi bi-arrow-repeat tb-notification-spinner"></i>

                    <strong>
                      Loading notifications...
                    </strong>

                  </div>

                ) : notifications.length === 0 ? (

                  <div className="tb-notification-empty">

                    <div className="tb-notification-empty-icon">
                      <i className="bi bi-bell-slash"></i>
                    </div>

                    <strong>
                      No new notifications
                    </strong>

                    <span>
                      You're all caught up.
                    </span>

                  </div>

                ) : (

                  notifications.map(
                    (notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        className="tb-notification-item"
                        onClick={() =>
                          handleNotificationClick(
                            notification
                          )
                        }
                      >

                        <span
                          className={`tb-notification-icon ${notification.className}`}
                        >
                          <i
                            className={`bi ${notification.icon}`}
                          ></i>
                        </span>

                        <span className="tb-notification-content">

                          <strong>
                            {notification.title}
                          </strong>

                          <small>
                            {notification.message}
                          </small>

                          <em>
                            View details
                            <i className="bi bi-arrow-right"></i>
                          </em>

                        </span>

                      </button>
                    )
                  )
                )}

              </div>


              {notifications.length > 0 && (
                <div className="tb-notification-footer">

                  <button
                    type="button"
                    onClick={() => {
                      setNotificationOpen(false);
                      navigate("/notices");
                    }}
                  >
                    View All Notices
                    <i className="bi bi-arrow-right"></i>
                  </button>

                </div>
              )}

            </div>
          )}

        </div>


        {/* ==================================================
            USER PROFILE
        ================================================== */}

        <button
          className="tb-user"
          aria-label="Open profile"
          type="button"
          onClick={() =>
            navigate("/my-profile")
          }
        >

          {profileImage ? (
            <img
              src={profileImage}
              alt={userName}
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          ) : (
            <span className="tb-user-placeholder">
              <i className="bi bi-person-fill"></i>
            </span>
          )}

          <span className="tb-user-info">
            <strong>
              {userName}
            </strong>

            <small>
              {userRole}
            </small>
          </span>

          <i className="bi bi-chevron-down tb-user-arrow"></i>

        </button>

      </div>

    </header>
  );
}

export default Topbar;