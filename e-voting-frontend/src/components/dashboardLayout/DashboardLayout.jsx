import { useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import Topbar from "../topbar/Topbar";
import "./DashboardLayout.css";

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    const content = contentRef.current;

    if (content) {
      // Browser ko previous scroll position restore karne ka chance na dein
      content.style.scrollBehavior = "auto";
      content.scrollTop = 0;
      content.scrollLeft = 0;
    }

    window.scrollTo(0, 0);

    // Route change par mobile sidebar close
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="dba-layout">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <button
          className="dba-overlay"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="dba-main">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main ref={contentRef} className="dba-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;