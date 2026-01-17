// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../auth/ToastContext";
import "./LandingPage.css";
import "./RegisterPage.css";
import "./Dashboard.css";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

interface DashboardData {
  academicProfile: {
    institution: string;
    degree: string;
    year: string;
    cgpa: string;
  };
  certifications: Array<{
    name: string;
    issuer: string;
  }>;
  skills: string[];
  lastUpdated: string;
}

interface PredictionHistoryItem {
  id: number;
  predicted_roles: string;
  confidence_scores: string;
  timestamp: string;
}

const emptyDashboardData: DashboardData = {
  academicProfile: {
    institution: "",
    degree: "",
    year: "",
    cgpa: "",
  },
  certifications: [],
  skills: [],
  lastUpdated: "",
};

const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] =
    useState<DashboardData>(emptyDashboardData);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const recentPrediction = history.length > 0 ? history[0] : null;
  const [openTickets, setOpenTickets] = useState(0);
  // const [showFlagWarning, setShowFlagWarning] = useState(false);

  const [, setIsLoadingHistory] = useState(true);

  const [showFlagWarning, setShowFlagWarning] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  // ---------- Load profile from backend (with local skills/lastUpdated) ----------
  const loadDashboardFromProfile = async () => {
    if (!user || !token) {
      setIsLoadingProfile(false);
      return;
    }

    // read local dashboard (for skills / lastUpdated)
    let localSkills: string[] = [];
    let localLastUpdated = "";
    const savedLocal = localStorage.getItem(`dashboard_${user.email}`);
    if (savedLocal) {
      try {
        const parsed: DashboardData = JSON.parse(savedLocal);
        localSkills = parsed.skills || [];
        localLastUpdated = parsed.lastUpdated || "";
      } catch {
        // ignore parse error
      }
    }

    try {
      const res = await fetch(`${API_BASE}/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("DEBUG Dashboard Load: Full response:", data);

        const edu = data.education;
        const certs = data.certifications || [];

        // IMPORTANT: Use decrypted values if available
        const institution = edu?.decrypted_university || edu?.university || "";
        const degreeText = edu?.decrypted_degree || edu?.degree || "";

        console.log("DEBUG Dashboard Load: Extracted values:", {
          institution,
          degreeText,
          cgpa: edu?.cgpa,
          year: edu?.year_of_completion
        });

        const updated: DashboardData = {
          academicProfile: {
            institution: institution,
            degree: degreeText,
            year: edu?.year_of_completion?.toString() || "",
            cgpa: edu?.cgpa?.toString() || "",
          },
          certifications: certs.map((c: any) => ({
            name: c.cert_name,
            issuer: c.issuing_organization,
          })),
          skills: localSkills,
          lastUpdated: localLastUpdated,
        };

        setDashboardData(updated);

        // keep localStorage in sync
        localStorage.setItem(
          `dashboard_${user.email}`,
          JSON.stringify(updated)
        );
      } else if (savedLocal) {
        // backend failed – use local cache if any
        const parsed: DashboardData = JSON.parse(savedLocal);
        setDashboardData(parsed);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      showToast("Failed to load dashboard. Using local data.", "error");
      if (savedLocal) {
        const parsed: DashboardData = JSON.parse(savedLocal);
        setDashboardData(parsed);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // ---------- Load prediction history (for recent predictions card) ----------
  const loadPredictionHistory = async () => {
    if (!token) {
      setIsLoadingHistory(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/predictions/history/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data: PredictionHistoryItem[] = await res.json();
        setHistory(data);
      } else {
        showToast("Failed to load prediction history.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load prediction history.", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  };
  useEffect(() => {
    loadDashboardFromProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

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

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token || user?.role !== "admin") return;

    axios
      .get("http://127.0.0.1:8000/api/admin/support/status/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setOpenTickets(res.data.open_tickets));
  }, []);

  useEffect(() => {
    loadPredictionHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  useEffect(() => {
    console.log("DEBUG: User object in Dashboard:", user);
    console.log("DEBUG: is_flagged value:", user?.is_flagged);

    if (user?.is_flagged) {
      const dismissed = localStorage.getItem(`flag_warning_dismissed_${user.id}`);
      if (!dismissed) {
        setShowFlagWarning(true);
        setFlagReason(user.flag_reason || "Account has been flagged by admin");
      }
    }
  }, [user]);
  useEffect(() => {
    const forceRefresh = localStorage.getItem("force_user_refresh");

    if (forceRefresh && token) {
      fetch(`${API_BASE}/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        })
        .finally(() => {
          localStorage.removeItem("force_user_refresh");
        });
    }
  }, [token]);
  useEffect(() => {
    if (user?.is_flagged) {
      setShowFlagWarning(true);
      setFlagReason(user.flag_reason || "Account has been flagged by admin");
    }
  }, [user?.is_flagged]);


  // ---------- helpers ----------
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleGoToProfile = () => {
    navigate("/profile");
  };

  const handleGoToAdminPanel = () => {
    navigate("/admin");
  };

  const hasAcademicData =
    dashboardData.academicProfile.institution ||
    dashboardData.academicProfile.degree ||
    dashboardData.academicProfile.year ||
    dashboardData.academicProfile.cgpa;

  const hasCertifications = dashboardData.certifications.length > 0;
  const hasSkills = dashboardData.skills.length > 0;

  // Define userInitial here, after checking if user exists
  const userInitial = user?.name?.[0]?.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.is_admin === true;

  // ---------- not logged in fallback ----------
  if (!user) {
    return (
      <div className="ape-root">
        {showFlagWarning && (
          <div className="flag-warning-overlay">
            <div className="flag-warning-modal">
              <h3>⚠ Account Warning</h3>
              <p>
                Your account has been flagged by the administrator.
                Please contact support if you believe this is an error.
              </p>

              {flagReason && (
                <div className="flag-reason-box">
                  <strong>Reason provided:</strong>
                  <p>{flagReason}</p>
                </div>
              )}

              <div className="flag-warning-actions">
                <button
                  className="dashboard-edit-btn"
                  onClick={() => {
                    if (user) {
                      localStorage.setItem(`flag_warning_dismissed_${(user as any)?.id ?? (user as any)?.email ?? 'guest'}`, "true");
                    }
                    setShowFlagWarning(false);
                  }}
                >
                  I Understand
                </button>

                <button
                  className="dashboard-logout-btn"
                  onClick={() => navigate("/support")}
                  style={{ marginLeft: '10px' }}
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="ape-frame">
          <div className="ape-browser-bar">
            <div className="ape-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="ape-url">edu2job.com/dashboard</div>
          </div>
          <div className="ape-window">
            <div className="auth-page-wrapper">
              <div className="signup-card">
                <h1 className="signup-title">Not Logged In</h1>
                <p className="signup-subtitle">
                  Please log in to view your dashboard.
                </p>
                <button
                  className="signup-submit-btn"
                  onClick={() => navigate("/login")}
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ape-root">
      <div className="ape-frame">
        {/* Browser bar */}
        <div className="ape-browser-bar">
          <div className="ape-dots">
            <span /> {/* red */}
            <span
              onClick={toggleTheme}
              style={{ cursor: "pointer" }}
              title="Toggle theme"
            /> {/* yellow */}
            <span /> {/* green */}
          </div>

          <div className="ape-url">edu2job.com/dashboard</div>
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

        {/* Window */}
        <div className="ape-window">
          {/* Back */}
          <div className="ape-back-btn" onClick={handleBack}>
            <span>← Back</span>
          </div>

          {/* NAVIGATION */}
          <div className="dashboard-navigation">
            <button className="nav-btn active">Home</button>
            <button className="nav-btn" onClick={() => navigate("/profile")}>
              My Profile
            </button>
            <button
              className="nav-btn"
              onClick={() => navigate("/predictions")}
            >
              Job Predictor
            </button>
            <button className="nav-btn" onClick={() => navigate("/support")}>
              Support
              {user?.role === "admin" && openTickets > 0 && (
                <span className="support-badge">New</span>
              )}
            </button>

          </div>

          <div className="dashboard-wrapper">
            {/* HEADER */}
            <div className="dashboard-header">
              <div className="dashboard-user-info">
                <div className="dashboard-user-avatar">
                  <div className="dashboard-avatar-fallback">{userInitial}</div>
                </div>
                <div>
                  {/* In the dashboard header section where user info is shown */}
                  <h1 className="dashboard-title">
                    Welcome,{" "}
                    <span>
                      {user?.name || user?.username || user?.email?.split("@")[0] || "User"}

                      {isAdmin && <span className="admin-tag">(admin)</span>}

                      {/* ⭐ Add this flag indicator next to the username */}
                      {user?.is_flagged && (
                        <span className="flag-tag" title={user.flag_reason || "Account flagged"}>
                          ⚠ Flagged
                        </span>
                      )}
                    </span>
                  </h1>

                  <p className="dashboard-subtitle">
                    {user?.email || "No email"}
                    {dashboardData.lastUpdated && (
                      <>
                        <br />
                        <span className="dashboard-last-updated">
                          Last updated: {dashboardData.lastUpdated}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="dashboard-actions">
                {/* Admin Panel Button - Only visible to admin */}
                {isAdmin && (
                  <button
                    className="dashboard-edit-btn"
                    onClick={handleGoToAdminPanel}
                    style={{ marginRight: '8px' }}
                  >
                    Admin Panel
                  </button>
                )}

                <button
                  className="dashboard-edit-btn"
                  onClick={handleGoToProfile}
                >
                  Go to My Profile
                </button>
                <button
                  className="dashboard-logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>

            {/* CARDS GRID */}
            {isLoadingProfile ? (
              <p>Loading your dashboard…</p>
            ) : (
              <div className="dashboard-cards-grid">
                {/* Academic Profile */}
                <div className="dashboard-card">
                  <div className="dashboard-card-header">
                    <h3 className="dashboard-card-title">Academic Profile</h3>
                  </div>
                  <div className="dashboard-card-content">
                    {hasAcademicData ? (
                      <ul className="dashboard-info-list">
                        {dashboardData.academicProfile.institution && (
                          <li className="dashboard-info-item">
                            <span className="dashboard-info-label">
                              College
                            </span>
                            <span className="dashboard-info-value">
                              {dashboardData.academicProfile.institution}
                            </span>
                          </li>
                        )}
                        {dashboardData.academicProfile.degree && (
                          <li className="dashboard-info-item">
                            <span className="dashboard-info-label">Degree</span>
                            <span className="dashboard-info-value">
                              {dashboardData.academicProfile.degree}
                            </span>
                          </li>
                        )}
                        {(dashboardData.academicProfile.year ||
                          dashboardData.academicProfile.cgpa) && (
                            <li className="dashboard-info-item">
                              <span className="dashboard-info-label">
                                Graduation
                              </span>
                              <span className="dashboard-info-value">
                                {dashboardData.academicProfile.year && (
                                  <>{dashboardData.academicProfile.year}</>
                                )}
                                {dashboardData.academicProfile.year &&
                                  dashboardData.academicProfile.cgpa &&
                                  " · "}
                                {dashboardData.academicProfile.cgpa && (
                                  <>
                                    {dashboardData.academicProfile.cgpa} CGPA
                                  </>
                                )}
                              </span>
                            </li>
                          )}
                      </ul>
                    ) : (
                      <div className="dashboard-empty-state">
                        <p>
                          No academic details yet. Update them from{" "}
                          <strong>My Profile</strong>.
                        </p>
                        <button
                          className="dashboard-edit-btn"
                          onClick={handleGoToProfile}
                        >
                          Go to My Profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certifications */}
                <div className="dashboard-card">
                  <div className="dashboard-card-header">
                    <h3 className="dashboard-card-title">Certifications</h3>
                  </div>
                  <div className="dashboard-card-content">
                    {hasCertifications ? (
                      <ul className="dashboard-cert-list">
                        {dashboardData.certifications.map((cert, idx) => (
                          <li key={idx} className="dashboard-cert-item">
                            <div className="dashboard-cert-name">
                              {cert.name}
                            </div>
                            <div className="dashboard-cert-issuer">
                              {cert.issuer}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="dashboard-empty-state">
                        <p>
                          No certifications added yet. Add them from{" "}
                          <strong>My Profile</strong>.
                        </p>
                        <button
                          className="dashboard-edit-btn"
                          onClick={handleGoToProfile}
                        >
                          Add Certifications
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div className="dashboard-card dashboard-card-full">
                  <div className="dashboard-card-header">
                    <h3 className="dashboard-card-title">Skills</h3>
                  </div>
                  <div className="dashboard-card-content">
                    {hasSkills ? (
                      <div className="dashboard-skill-tags">
                        {dashboardData.skills.map((skill, idx) => (
                          <span key={idx} className="dashboard-skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="dashboard-empty-state">
                        <p>
                          No skills added yet. You can maintain your skill list
                          from <strong>My Profile</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Job Predictions - Fixed syntax */}
                <div className="dashboard-card">
                  <div className="dashboard-card-header">
                    <h3 className="dashboard-card-title">Recent Job Predictions</h3>
                  </div>
                  <div className="dashboard-card-content">
                    {recentPrediction ? (
                      <div>
                        <div className="prediction-roles">
                          {(Array.isArray(recentPrediction.predicted_roles)
                            ? recentPrediction.predicted_roles
                            : recentPrediction.predicted_roles.split(",")
                          ).map((role: string, idx: number) => {
                            const scores = Array.isArray(recentPrediction.confidence_scores)
                              ? recentPrediction.confidence_scores
                              : recentPrediction.confidence_scores.split(",");

                            const score = scores[idx] || scores[0] || "0";

                            return (
                              <div key={idx} className="prediction-row">
                                <span className="role-name">{role.trim()}</span>
                                <span className="role-score">{score}%</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="prediction-footer">
                          <span className="prediction-time">
                            {new Date(recentPrediction.timestamp).toLocaleString()}
                          </span>

                          <button
                            className="view-history-btn"
                            onClick={() => navigate("/predictions")}
                          >
                            View full history →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="dashboard-empty-state">
                        <p>No predictions yet. Try the Job Predictor!</p>
                        <button
                          className="dashboard-edit-btn"
                          onClick={() => navigate("/predictions")}
                        >
                          Go to Predictor
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;