import "./Maintenance.css";

function Maintenance() {
    return (
        <div className="maintenance-page">
            <div className="maintenance-card">

                <div className="maintenance-icon">
                    <i className="bi bi-tools"></i>
                </div>

                <span className="maintenance-label">
                    SYSTEM MAINTENANCE
                </span>

                <h1>
                    We'll Be Back Soon
                </h1>

                <p>
                    The District Bar Association E-Voting System is
                    temporarily unavailable while we perform system
                    maintenance.
                </p>

                <p className="maintenance-small">
                    Please check back again shortly.
                </p>

            </div>
        </div>
    );
}

export default Maintenance;