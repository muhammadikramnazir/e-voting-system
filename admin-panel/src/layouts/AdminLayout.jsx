import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "./AdminLayout.css";

function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const openSidebar = () => {
        setSidebarOpen(true);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="admin-layout">

            {/* ================================================
          FIXED SIDEBAR
      ================================================ */}

            <Sidebar
                isOpen={sidebarOpen}
                onClose={closeSidebar}
            />


            {/* ================================================
          MAIN ADMIN AREA
      ================================================ */}

            <div className="admin-main">

                {/* FIXED / NON-SCROLLING TOPBAR */}

                <Topbar
                    onMenuClick={openSidebar}
                />


                {/* ==============================================
            ONLY THIS AREA SCROLLS
        ============================================== */}

                <main className="admin-content">

                    <div className="admin-content-inner">
                        <Outlet />
                    </div>

                </main>

            </div>

        </div>
    );
}

export default AdminLayout;