import { useEffect, useState } from "react";
import "./Settings.css";

const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api/v1";

const defaultSettings = {
    siteName: "E-Voting System",
    adminEmail: "admin@evoting.com",
    timezone: "Asia/Karachi",

    emailNotifications: true,
    electionNotifications: true,
    supportNotifications: true,

    twoFactor: false,
    loginAlerts: true,

    maintenanceMode: false,
    autoPublishResults: false,
};

function Settings() {
    const [settings, setSettings] =
        useState(defaultSettings);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [saved, setSaved] =
        useState(false);

    const [error, setError] =
        useState("");

    // =====================================================
    // GET ADMIN TOKEN
    // =====================================================

    const getToken = () => {
        return (
            localStorage.getItem("adminToken") ||
            sessionStorage.getItem("adminToken")
        );
    };

    // =====================================================
    // API HEADERS
    // =====================================================

    const getHeaders = () => {
        const token = getToken();

        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    };

    // =====================================================
    // LOAD SETTINGS FROM DATABASE
    // =====================================================

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Admin session not found. Please login again."
                );
            }

            const response = await fetch(
                `${API_URL}/admin/settings`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                localStorage.removeItem("adminToken");
                sessionStorage.removeItem("adminToken");

                throw new Error(
                    "Your admin session has expired. Please login again."
                );
            }

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    "Failed to load settings."
                );
            }

            setSettings({
                ...defaultSettings,
                ...(data.settings || {}),
            });

        } catch (err) {
            console.error(
                "LOAD SETTINGS ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to load settings."
            );

        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        fetchSettings();
    }, []);

    // =====================================================
    // HANDLE CHANGE
    // =====================================================

    const handleChange = (e) => {
        const {
            name,
            value,
            type,
            checked,
        } = e.target;

        setSettings((prev) => ({
            ...prev,

            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));

        setSaved(false);
        setError("");
    };

    // =====================================================
    // SAVE SETTINGS TO DATABASE
    // =====================================================

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setSaved(false);
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Admin session not found. Please login again."
                );
            }

            const response = await fetch(
                `${API_URL}/admin/settings`,
                {
                    method: "PUT",
                    headers: getHeaders(),

                    body: JSON.stringify({
                        settings,
                    }),
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                localStorage.removeItem("adminToken");
                sessionStorage.removeItem("adminToken");

                throw new Error(
                    "Your admin session has expired. Please login again."
                );
            }

            if (!response.ok || !data.status) {
                throw new Error(
                    data.message ||
                    "Failed to save settings."
                );
            }

            /*
             * Reload from database after successful save.
             * This confirms that the saved values are actually
             * being returned by the backend.
             */

            await fetchSettings();

            setSaved(true);

            setTimeout(() => {
                setSaved(false);
            }, 3000);

        } catch (err) {
            console.error(
                "SAVE SETTINGS ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to save settings."
            );

        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="settings-page">

                <div className="settings-header">

                    <div>
                        <h2>Settings</h2>

                        <p>
                            Manage system and administrator preferences
                        </p>
                    </div>

                </div>

                <div
                    style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#7d8b98",
                    }}
                >
                    <i
                        className="bi bi-arrow-repeat"
                        style={{
                            marginRight: "8px",
                            animation:
                                "spin 1s linear infinite",
                        }}
                    ></i>

                    Loading settings...
                </div>

            </div>
        );
    }

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="settings-page">

            {/* Header */}
            <div className="settings-header">

                <div>
                    <h2>Settings</h2>

                    <p>
                        Manage system and administrator preferences
                    </p>
                </div>

                {saved && (
                    <div className="settings-saved">

                        <i className="bi bi-check-circle-fill"></i>

                        Settings saved successfully

                    </div>
                )}

            </div>


            {/* Error */}
            {error && (
                <div
                    style={{
                        marginBottom: "16px",
                        padding: "11px 14px",
                        borderRadius: "8px",
                        background: "#fff1f1",
                        border: "1px solid #ffd7d7",
                        color: "#b42318",
                        fontSize: "12px",
                    }}
                >
                    <i
                        className="bi bi-exclamation-circle"
                        style={{
                            marginRight: "7px",
                        }}
                    ></i>

                    {error}
                </div>
            )}


            <form onSubmit={handleSave}>

                {/* =================================================
                    GENERAL SETTINGS
                ================================================= */}

                <div className="settings-card">

                    <div className="settings-card-header">

                        <div className="settings-heading-icon blue">
                            <i className="bi bi-gear"></i>
                        </div>

                        <div>
                            <h3>General Settings</h3>

                            <p>
                                Basic information about the voting system
                            </p>
                        </div>

                    </div>


                    <div className="settings-form-grid">

                        <div className="settings-form-group">

                            <label>
                                System Name
                            </label>

                            <input
                                type="text"
                                name="siteName"
                                value={settings.siteName}
                                onChange={handleChange}
                            />

                        </div>


                        <div className="settings-form-group">

                            <label>
                                Administrator Email
                            </label>

                            <input
                                type="email"
                                name="adminEmail"
                                value={settings.adminEmail}
                                onChange={handleChange}
                            />

                        </div>


                        <div className="settings-form-group">

                            <label>
                                Timezone
                            </label>

                            <select
                                name="timezone"
                                value={settings.timezone}
                                onChange={handleChange}
                            >

                                <option value="Asia/Karachi">
                                    Pakistan Standard Time
                                </option>

                                <option value="Asia/Dubai">
                                    Gulf Standard Time
                                </option>

                                <option value="UTC">
                                    UTC
                                </option>

                            </select>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                <div className="settings-card">

                    <div className="settings-card-header">

                        <div className="settings-heading-icon orange">
                            <i className="bi bi-bell"></i>
                        </div>

                        <div>

                            <h3>
                                Notification Settings
                            </h3>

                            <p>
                                Control which notifications administrators receive
                            </p>

                        </div>

                    </div>


                    <div className="settings-options">

                        <label className="setting-option">

                            <div className="setting-option-info">

                                <div className="option-icon">
                                    <i className="bi bi-envelope"></i>
                                </div>

                                <div>

                                    <strong>
                                        Email Notifications
                                    </strong>

                                    <span>
                                        Receive important system notifications by email
                                    </span>

                                </div>

                            </div>


                            <div className="toggle-wrapper">

                                <input
                                    type="checkbox"
                                    name="emailNotifications"
                                    checked={
                                        Boolean(
                                            settings.emailNotifications
                                        )
                                    }
                                    onChange={handleChange}
                                />

                                <span className="toggle-slider"></span>

                            </div>

                        </label>


                        <label className="setting-option">

                            <div className="setting-option-info">

                                <div className="option-icon">
                                    <i className="bi bi-check2-square"></i>
                                </div>

                                <div>

                                    <strong>
                                        Election Notifications
                                    </strong>

                                    <span>
                                        Get alerts about election activities and schedules
                                    </span>

                                </div>

                            </div>


                            <div className="toggle-wrapper">

                                <input
                                    type="checkbox"
                                    name="electionNotifications"
                                    checked={
                                        Boolean(
                                            settings.electionNotifications
                                        )
                                    }
                                    onChange={handleChange}
                                />

                                <span className="toggle-slider"></span>

                            </div>

                        </label>


                        <label className="setting-option">

                            <div className="setting-option-info">

                                <div className="option-icon">
                                    <i className="bi bi-headset"></i>
                                </div>

                                <div>

                                    <strong>
                                        Support Notifications
                                    </strong>

                                    <span>
                                        Receive alerts when members submit support requests
                                    </span>

                                </div>

                            </div>


                            <div className="toggle-wrapper">

                                <input
                                    type="checkbox"
                                    name="supportNotifications"
                                    checked={
                                        Boolean(
                                            settings.supportNotifications
                                        )
                                    }
                                    onChange={handleChange}
                                />

                                <span className="toggle-slider"></span>

                            </div>

                        </label>

                    </div>

                </div>


                {/* =================================================
                    SECURITY
                ================================================= */}

                <div className="settings-card">

                    <div className="settings-card-header">

                        <div className="settings-heading-icon purple">
                            <i className="bi bi-shield-lock"></i>
                        </div>

                        <div>

                            <h3>
                                Security Settings
                            </h3>

                            <p>
                                Manage administrator account security
                            </p>

                        </div>

                    </div>


                    <div className="settings-options">

                        <label className="setting-option">

                            <div className="setting-option-info">

                                <div className="option-icon">
                                    <i className="bi bi-shield-check"></i>
                                </div>

                                <div>

                                    <strong>
                                        Two-Factor Authentication
                                    </strong>

                                    <span>
                                        Add an additional security layer to administrator login
                                    </span>

                                </div>

                            </div>


                            <div className="toggle-wrapper">

                                <input
                                    type="checkbox"
                                    name="twoFactor"
                                    checked={
                                        Boolean(
                                            settings.twoFactor
                                        )
                                    }
                                    onChange={handleChange}
                                />

                                <span className="toggle-slider"></span>

                            </div>

                        </label>


                        <label className="setting-option">

                            <div className="setting-option-info">

                                <div className="option-icon">
                                    <i className="bi bi-exclamation-triangle"></i>
                                </div>

                                <div>

                                    <strong>
                                        Login Alerts
                                    </strong>

                                    <span>
                                        Get notified when a new administrator login occurs
                                    </span>

                                </div>

                            </div>


                            <div className="toggle-wrapper">

                                <input
                                    type="checkbox"
                                    name="loginAlerts"
                                    checked={
                                        Boolean(
                                            settings.loginAlerts
                                        )
                                    }
                                    onChange={handleChange}
                                />

                                <span className="toggle-slider"></span>

                            </div>

                        </label>

                    </div>

                </div>


                {/* =================================================
                    ELECTION
                ================================================= */}

                <div className="settings-card">

                    <div className="settings-card-header">

                        <div className="settings-heading-icon green">
                            <i className="bi bi-bar-chart"></i>
                        </div>

                        <div>

                            <h3>
                                Election Settings
                            </h3>

                            <p>
                                Configure election result and system behavior
                            </p>

                        </div>

                    </div>


                    <div className="settings-options">

                        <label className="setting-option">

                            <div className="setting-option-info">

                                <div className="option-icon">
                                    <i className="bi bi-check-circle"></i>
                                </div>

                                <div>

                                    <strong>
                                        Auto Publish Results
                                    </strong>

                                    <span>
                                        Automatically publish results after an election ends
                                    </span>

                                </div>

                            </div>


                            <div className="toggle-wrapper">

                                <input
                                    type="checkbox"
                                    name="autoPublishResults"
                                    checked={
                                        Boolean(
                                            settings.autoPublishResults
                                        )
                                    }
                                    onChange={handleChange}
                                />

                                <span className="toggle-slider"></span>

                            </div>

                        </label>


                        <label className="setting-option">

                            <div className="setting-option-info">

                                <div className="option-icon">
                                    <i className="bi bi-tools"></i>
                                </div>

                                <div>

                                    <strong>
                                        Maintenance Mode
                                    </strong>

                                    <span>
                                        Temporarily restrict member access to the system
                                    </span>

                                </div>

                            </div>


                            <div className="toggle-wrapper">

                                <input
                                    type="checkbox"
                                    name="maintenanceMode"
                                    checked={
                                        Boolean(
                                            settings.maintenanceMode
                                        )
                                    }
                                    onChange={handleChange}
                                />

                                <span className="toggle-slider"></span>

                            </div>

                        </label>

                    </div>

                </div>


                {/* =================================================
                    SAVE
                ================================================= */}

                <div className="settings-save-area">

                    <button
                        type="submit"
                        className="save-settings-btn"
                        disabled={saving}
                    >

                        {saving ? (
                            <>
                                <i className="bi bi-arrow-repeat"></i>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-lg"></i>
                                Save Settings
                            </>
                        )}

                    </button>

                </div>

            </form>

        </div>
    );
}

export default Settings;