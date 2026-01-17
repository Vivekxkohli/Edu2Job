// src/pages/AuthCallbackPage.tsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const AuthCallbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (!token) {
      showToast("Google login failed. Please try again.", "error");
      navigate("/login");
      return;
    }

    loginWithToken(token).then((success) => {
      if (success) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    });
  }, [location.search, loginWithToken, navigate, showToast]);

  return (
    <div className="ape-root">
      <div className="ape-frame">
        <div className="ape-browser-bar">
          <div className="ape-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="ape-url">edu2job.com/auth/callback</div>
        </div>
        <div className="ape-window">
          <div className="auth-page-wrapper">
            <div className="signup-card">
              <h1 className="signup-title">Finishing sign in…</h1>
              <p className="signup-subtitle">
                Please wait while we complete your Google login.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
