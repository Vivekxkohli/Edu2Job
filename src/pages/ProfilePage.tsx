// src/pages/ProfilePage.tsx
import React from "react";
import "./LandingPage.css";
import "./ProfilePage.css";
import "./Dashboard.css"; // reuse bottom nav + badges
import ProfileForm from "../components/ProfileForm";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../auth/ToastContext";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
const handleLogout = () => {
    logout();
    navigate("/");
  };
  const handleBackToDashboard = () => {
    const frame = document.querySelector<HTMLElement>(".ape-frame");
    if (frame) {
      frame.classList.add("ape-frame-slide-left");
      setTimeout(() => {
        navigate("/dashboard");
        frame.classList.remove("ape-frame-slide-left");
      }, 220);
    } else {
      navigate("/dashboard");
    }
  };

  // If opened without login
  if (!user) {
    return (
      <div className="ape-root">
        <div className="ape-frame">
          <div className="ape-browser-bar">
            <div className="ape-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="ape-url">edu2job.com/profile</div>
          </div>

          <div className="ape-window">
            <button
              type="button"
              className="profile-back-link"
              onClick={() => navigate("/login")}
            >
              ← Back to Login
            </button>

            <div className="profile-page-wrapper">
              <div className="profile-card">
                <h1 className="profile-title">Not logged in</h1>
                <p className="profile-subtitle">
                  Please log in to update your academic details,
                  certifications and skills.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal profile screen when logged in
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
          <div className="ape-url">edu2job.com/profile</div>
          <div className="ape-browser-actions">
            <span>⤢</span>
          </div>
        </div>

        {/* Browser window */}
        <div className="ape-window">
          <div className="ape-back-btn" onClick={handleBackToDashboard}>
            <span>← Back to Dashboard</span>
          </div>

          {/* Bottom navigation – same as Dashboard/Predictions */}
          <div className="dashboard-navigation">
            <button
              className="nav-btn"
              onClick={() => navigate("/dashboard")}
            >
              Home
            </button>

            <button
              className="nav-btn active"
              onClick={() => navigate("/profile")}
            >
              My Profile
            </button>

            <button
              className="nav-btn"
              onClick={() => navigate("/predictions")}
            >
              Job Predictor
            </button>

            <button
              className="nav-btn"
              onClick={() =>
                showToast("Community feature coming soon!", "info")
              }
            >
              Community
            </button>
          </div>
          {/* Main profile content */}
          <div className="dashboard-wrapper">
            <div className="dashboard-card dashboard-card-full">
              <div className="dashboard-header">
                <div className="dashboard-user-info">
                  <h1 className="dashboard-title">
                    Your <span>Profile</span>
                  </h1>
                  <p className="dashboard-subtitle">
                    Manage your academic profile, certifications and skills here.
                  </p>
                </div>
                <button className="dashboard-logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>

              <ProfileForm />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
