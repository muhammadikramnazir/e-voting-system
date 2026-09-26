import { Link, useLocation, useNavigate } from "react-router-dom";
import "./AuthLayout.css";

function AuthLayout({ className = "", children, quote }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isRegister = location.pathname === "/register";

  const switchAuth = () => {
    navigate(isRegister ? "/login" : "/register");
  };

  return (
    <div
      className={`auth-page ${isRegister ? "auth-register" : "auth-login"
        } ${className}`}
    >

      {/* Background */}

      <div className="auth-background" />

      <div className="auth-overlay" />


      {/* Main */}

      <div className="auth-container">

        {/* =====================================
                    BRAND
                ===================================== */}

        <Link
          to="/login"
          className="auth-brand"
        >
          <span className="auth-brand-icon">
            <i className="bi bi-scale" />
          </span>

          <span className="auth-brand-text">
            <strong>
              District Bar Association
            </strong>

            <small>
              Justice • Unity • Professionalism
            </small>
          </span>
        </Link>


        {/* =====================================
                    AUTH BOX
                ===================================== */}

        <div className="auth-box">


          {/* =================================
                        VISUAL PANEL
                    ================================= */}

          <div className="auth-visual">

            <div className="auth-visual-bg" />

            <div className="auth-visual-overlay" />


            <div className="auth-visual-content">

              <div className="auth-visual-icon">
                <i className="bi bi-building" />
              </div>


              <span className="auth-visual-label">
                DISTRICT BAR ASSOCIATION
              </span>


              <h1>
                {isRegister ? (
                  <>
                    Join the
                    <span>
                      Legal Community.
                    </span>
                  </>
                ) : (
                  <>
                    Your Voice.
                    <span>
                      Your Vote.
                    </span>
                  </>
                )}
              </h1>


              <p>
                {isRegister
                  ? "Create your account and become part of a fair, transparent and professional voting system."
                  : "A secure digital platform designed for transparent elections and stronger representation."
                }
              </p>


              <div className="auth-visual-line" />


              <div className="auth-visual-footer">

                <i className="bi bi-shield-check" />

                <span>
                  Secure • Transparent • Trusted
                </span>

              </div>

            </div>


            {/* =================================
                            QUOTE INSIDE BOX
                        ================================= */}

            {quote && (
              <div className="auth-quote">

                <i className="bi bi-quote" />

                <span>
                  {quote}
                </span>

              </div>
            )}


            {/* =================================
                            DECORATIVE CIRCLES
                        ================================= */}

            <span className="auth-orbit auth-orbit-one" />
            <span className="auth-orbit auth-orbit-two" />
            <span className="auth-orbit auth-orbit-three" />

          </div>


          {/* =================================
                        FORM PANEL
                    ================================= */}

          <div className="auth-form-area">

            <div className="auth-form-inner">

              {/* Mobile Brand */}

              <div className="auth-mobile-brand">

                <i className="bi bi-scale" />

                <span>
                  District Bar Association
                </span>

              </div>


              {children}


              {/* =================================
                                SWITCH ACCOUNT
                            ================================= */}

              <div className="auth-switch">

                <span>
                  {isRegister
                    ? "Already have an account?"
                    : "Don't have an account?"
                  }
                </span>

                <button
                  type="button"
                  onClick={switchAuth}
                >
                  {isRegister
                    ? "Sign In"
                    : "Create Account"
                  }

                  <i className="bi bi-arrow-right" />
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AuthLayout;