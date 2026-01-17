// src/pages/LoginPage.tsx
import React, { useEffect } from "react";
import "./LandingPage.css";     // fake browser + bg styles
import "./RegisterPage.css";    // card + inputs + back button styles
import LoginForm from "../components/LoginForm";
import { useNavigate } from "react-router-dom";


const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    const frame = document.querySelector<HTMLElement>(".ape-frame");
    if (frame) {
      frame.classList.add("ape-frame-slide-left");
      setTimeout(() => {
        navigate("/");
        frame.classList.remove("ape-frame-slide-left");
      }, 220);
    } else {
      navigate("/");
    }
    

  };
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  return (
    <div className="ape-root">
      <div className="ape-frame">
        {/* Fake browser bar */}
        <div className="ape-browser-bar">
          <div className="ape-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="ape-url">edu2job.com/login</div>
          <div className="ape-browser-actions">
            <span>⤢</span>

            <span
              className="theme-mini-toggle"
              onClick={toggleTheme}
              title="Toggle light / dark mode"
            >
              🌗
            </span>
          </div>
        </div>

        {/* Browser window */}
        <div className="ape-window">
          {/* Back button */}
          <div className="ape-back-btn" onClick={handleBack}>
            <span className="ape-back-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M15.5 5.5 9 12l6.5 6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>Back</span>
          </div>

          <div className="auth-page-wrapper">
            <div className="signup-screen">
              <div className="signup-card">
                <h1 className="signup-title">
                  Welcome <span>Back</span>
                </h1>
                <p className="signup-subtitle">
                  Log in to access dashboard, predictions &amp; placement
                  insights.
                </p>

                <LoginForm />

                <div className="signup-bottom-text">
                  Don’t have an account?
                  <button
                    type="button"
                    className="signup-link"
                    onClick={() => navigate("/register")}
                  >
                    {" "}
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
