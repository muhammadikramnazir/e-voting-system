import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../../components/dashboardLayout/DashboardLayout";
import { getNotices } from "../../apis/authapi";
import LahoreHighCourt from "../../assets/Lahore-High-Court.jpg";
import "./Notices.css";


/* =====================================================
   NOTICE HELPERS
===================================================== */

const getNoticeTone = (notice) => {
    if (Number(notice.important) === 1) {
        return "red";
    }

    const category = String(notice.category || "").toLowerCase();

    if (
        category.includes("election") ||
        category.includes("vote")
    ) {
        return "gold";
    }

    if (
        category.includes("meeting") ||
        category.includes("event")
    ) {
        return "blue";
    }

    return "green";
};


const getNoticeIcon = (notice) => {
    const category = String(notice.category || "").toLowerCase();

    if (
        category.includes("election") ||
        category.includes("vote")
    ) {
        return "bi-megaphone-fill";
    }

    if (
        category.includes("meeting") ||
        category.includes("event")
    ) {
        return "bi-calendar-event-fill";
    }

    if (
        category.includes("member") ||
        category.includes("membership")
    ) {
        return "bi-people-fill";
    }

    return "bi-info-circle-fill";
};


const formatNoticeDate = (dateValue) => {
    if (!dateValue) {
        return "Date not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};


/* =====================================================
   NOTICE CARD
===================================================== */

function NoticeCard({ notice }) {

    const tone = getNoticeTone(notice);
    const icon = getNoticeIcon(notice);

    return (
        <article className="nt-card">

            {/* Left accent */}
            <span className={`nt-accent ${tone}`}></span>


            {/* Icon */}
            <div className={`nt-icon ${tone}`}>
                <i className={`bi ${icon}`}></i>
            </div>


            {/* Notice content */}
            <div className="nt-content">

                <div className="nt-title-row">

                    <h3>
                        {notice.title}
                    </h3>

                    {Number(notice.important) === 1 && (
                        <span className="nt-important">
                            <i className="bi bi-exclamation-circle-fill"></i>
                            Important
                        </span>
                    )}

                </div>


                <p>
                    {notice.description || "No description available."}
                </p>


                <div className="nt-meta">

                    <span>
                        <i className="bi bi-calendar3"></i>
                        {formatNoticeDate(
                            notice.published_at ||
                            notice.created_at
                        )}
                    </span>

                    <span>
                        <i className="bi bi-building"></i>
                        District Bar Association
                    </span>

                </div>

            </div>


            {/* Arrow */}
            <button
                type="button"
                className="nt-open-btn"
                aria-label={`Open ${notice.title}`}
            >
                <i className="bi bi-arrow-up-right"></i>
            </button>

        </article>
    );
}


/* =====================================================
   MAIN PAGE
===================================================== */

function Notices() {

    const [tab, setTab] = useState("all");

    const [notices, setNotices] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const topRef = useRef(null);


    /* =====================================================
       SCROLL TO TOP
    ===================================================== */

    const scrollToTop = () => {

        if (topRef.current) {

            topRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });

        }
    };


    /* =====================================================
       FETCH NOTICES
    ===================================================== */

    useEffect(() => {

        const fetchNotices = async () => {

            try {

                setLoading(true);
                setError("");

                const token =
                    localStorage.getItem("token") ||
                    sessionStorage.getItem("token");


                if (!token) {

                    setError(
                        "Authentication required. Please login again."
                    );

                    return;
                }


                const data = await getNotices(token);


                if (!data?.status) {

                    setError(
                        data?.message ||
                        "Unable to load notices."
                    );

                    return;
                }


                const rows = Array.isArray(data.notices)
                    ? data.notices
                    : [];


                /*
                   Only published notices should be visible
                   to members.
                */
                const publishedNotices = rows.filter(
                    (notice) =>
                        String(notice.status || "")
                            .toLowerCase() === "published"
                );


                setNotices(publishedNotices);

            } catch (err) {

                console.error(
                    "NOTICES FETCH ERROR:",
                    err
                );

                setError(
                    "Unable to connect with the server. Please try again."
                );

            } finally {

                setLoading(false);

            }

        };


        fetchNotices();

    }, []);


    /* =====================================================
       AUTO SCROLL ON ERROR
    ===================================================== */

    useEffect(() => {

        if (error) {
            scrollToTop();
        }

    }, [error]);


    /* =====================================================
       FILTER
    ===================================================== */

    const list = useMemo(() => {

        if (tab === "important") {

            return notices.filter(
                (notice) =>
                    Number(notice.important) === 1
            );

        }

        return notices;

    }, [tab, notices]);


    const importantCount = useMemo(() => {

        return notices.filter(
            (notice) =>
                Number(notice.important) === 1
        ).length;

    }, [notices]);


    return (
        <DashboardLayout>

            <div ref={topRef}>


                {/* =====================================================
                    PAGE HEADER
                ===================================================== */}

                <section className="nt-page-header">

                    <div className="nt-heading">

                        <div className="nt-heading-icon">
                            <i className="bi bi-bell-fill"></i>
                        </div>

                        <div>

                            <h1 className="dba-page-title">
                                Notices
                            </h1>

                            <p className="dba-page-sub">
                                Stay updated with important announcements.
                            </p>

                        </div>

                    </div>


                    {/* Header status */}
                    <div className="nt-header-status">

                        <div className="nt-status-icon">
                            <i className="bi bi-megaphone-fill"></i>
                        </div>

                        <div>

                            <strong>
                                Member Updates
                            </strong>

                            <small>
                                Latest announcements
                            </small>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (

                    <div
                        style={{
                            marginBottom: "20px",
                            padding: "15px 18px",
                            borderRadius: "10px",
                            background: "#fff1f1",
                            border: "1px solid #f0b7b7",
                            color: "#b42318",
                            fontSize: "14px",
                            fontWeight: "600",
                        }}
                    >

                        <i
                            className="bi bi-exclamation-circle-fill"
                            style={{
                                marginRight: "8px",
                            }}
                        ></i>

                        {error}

                    </div>

                )}


                {/* =====================================================
                    LOADING
                ===================================================== */}

                {loading && (

                    <div
                        className="nt-empty"
                        style={{
                            minHeight: "220px",
                        }}
                    >

                        <div className="nt-empty-icon">

                            <div
                                className="spinner-border"
                                role="status"
                                style={{
                                    width: "2rem",
                                    height: "2rem",
                                }}
                            ></div>

                        </div>

                        <h3>
                            Loading Notices...
                        </h3>

                        <p>
                            Please wait while we load the latest announcements.
                        </p>

                    </div>

                )}


                {/* =====================================================
                    CONTENT
                ===================================================== */}

                {!loading && (

                    <>

                        {/* =================================================
                            FILTER TABS
                        ================================================= */}

                        <section className="nt-filter-card">

                            <div className="nt-filter-heading">

                                <div>

                                    <h2>
                                        Announcements
                                    </h2>

                                    <p>
                                        Important information from the Bar Association.
                                    </p>

                                </div>

                                <span className="nt-count">

                                    {list.length} Notice
                                    {list.length !== 1 ? "s" : ""}

                                </span>

                            </div>


                            <div className="nt-tabs">

                                <button
                                    type="button"
                                    className={`nt-tab ${tab === "all"
                                            ? "active"
                                            : ""
                                        }`}
                                    onClick={() => setTab("all")}
                                >

                                    <i className="bi bi-grid-fill"></i>

                                    All Notices

                                    <span>
                                        {notices.length}
                                    </span>

                                </button>


                                <button
                                    type="button"
                                    className={`nt-tab ${tab === "important"
                                            ? "active"
                                            : ""
                                        }`}
                                    onClick={() =>
                                        setTab("important")
                                    }
                                >

                                    <i className="bi bi-star-fill"></i>

                                    Important

                                    <span>
                                        {importantCount}
                                    </span>

                                </button>

                            </div>

                        </section>


                        {/* =================================================
                            NOTICE LIST
                        ================================================= */}

                        <section className="nt-list">

                            {list.length > 0 ? (

                                list.map((notice) => (

                                    <NoticeCard
                                        key={notice.id}
                                        notice={notice}
                                    />

                                ))

                            ) : (

                                <div className="nt-empty">

                                    <div className="nt-empty-icon">

                                        <i className="bi bi-bell-slash"></i>

                                    </div>

                                    <h3>
                                        {tab === "important"
                                            ? "No Important Notices"
                                            : "No Notices Available"}
                                    </h3>

                                    <p>

                                        {tab === "important"
                                            ? "There are no important announcements available at the moment."
                                            : "There are no published announcements available at the moment."}

                                    </p>

                                </div>

                            )}

                        </section>


                        {/* =================================================
                            INFORMATION STRIP
                        ================================================= */}

                        <section className="nt-info-strip">

                            <div className="nt-info-icon">

                                <i className="bi bi-info-circle-fill"></i>

                            </div>

                            <div>

                                <strong>
                                    Keep your notifications up to date.
                                </strong>

                                <p>
                                    Important election announcements and
                                    membership updates will appear here.
                                </p>

                            </div>

                            <i className="bi bi-arrow-right-circle-fill"></i>

                        </section>


                        {/* =================================================
                            BOTTOM AESTHETIC BANNER
                        ================================================= */}

                        <section
                            className="nt-band"
                            style={{
                                backgroundImage: `url(${LahoreHighCourt})`,
                            }}
                        >

                            <div className="nt-band-overlay"></div>

                            <div className="nt-band-content">

                                <span className="nt-band-mark">
                                    “
                                </span>

                                <div>

                                    <h2>
                                        Stay Informed
                                        <br />
                                        Stay Connected
                                    </h2>

                                    <p>
                                        Knowledge keeps our Bar united.
                                    </p>

                                </div>

                            </div>


                            <div className="nt-band-right">

                                <i className="bi bi-megaphone-fill"></i>

                                <span>
                                    District Bar Association
                                </span>

                            </div>

                        </section>

                    </>

                )}

            </div>

        </DashboardLayout>
    );
}

export default Notices;