// src/pages/PredictionPage.tsx
import React, { useEffect, useState } from "react";
import "./LandingPage.css";
import "./Dashboard.css";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../auth/ToastContext";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

interface PredictionHistoryItem {
  id: number;
  predicted_roles: string[];
  confidence_scores: number[];
  timestamp: string;
}

interface SuggestedRole {
  title: string;
  score: number;
  missingSkills?: string[];
}

const PredictionPage: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<SuggestedRole[]>(
    []
  );
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const fetchHistory = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/predictions/history/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load prediction history
  useEffect(() => {
    const loadHistory = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/predictions/history/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        } else {
          showToast("Failed to load prediction history.", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to load prediction history.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [token, showToast]);

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

  const handleLogout = () => {
    logout();
    navigate("/");
  };


  const handleGetPredictions = async () => {
    if (!token) {
      showToast("Please log in again.", "error");
      return;
    }

    try {
      setIsPredicting(true);

      const res = await fetch(`${API_BASE}/predictions/predict/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        showToast("Prediction failed. Please update profile.", "error");
        return;
      }

      const data = await res.json();

      const suggestions = data.predictions.map((p: any) => ({
        title: p.job_role,
        score: p.confidence,
        missingSkills: p.missing_skills || [],
      }));

      setCurrentSuggestions(suggestions);

      // ✅ THIS IS THE KEY
      await fetchHistory();

    } catch (err) {
      showToast("Something went wrong while predicting.", "error");
    } finally {
      setIsPredicting(false);
    }
  };

  const handleRemoveHistoryItem = async (id: number) => {
    if (!token) {
      showToast("Please log in again.", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/predictions/history/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok || res.status === 204) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        showToast("Prediction removed from history.", "success");
      } else {
        showToast("Failed to remove prediction.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to remove prediction.", "error");
    }
  };

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
            <div className="ape-url">edu2job.com/predictions</div>
          </div>
          <div className="ape-window">
            <div className="auth-page-wrapper">
              <div className="signup-card">
                <h1 className="signup-title">Not Logged In</h1>
                <p className="signup-subtitle">
                  Please log in to view job predictions.
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
        {/* Browser bar */}
        <div className="ape-browser-bar">
          <div className="ape-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="ape-url">edu2job.com/predictions</div>
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

        <div className="ape-window">
          <div className="ape-back-btn" onClick={handleBackToDashboard}>
            <span>← Back to Dashboard</span>
          </div>
          {/* Bottom navigation */}
          <div className="dashboard-navigation">
            <button
              className="nav-btn"
              onClick={() => navigate("/dashboard")}
            >
              Home
            </button>
            <button
              className="nav-btn"
              onClick={() => navigate("/profile")}
            >
              My Profile
            </button>
            <button className="nav-btn active">Job Predictor</button>
            <button className="nav-btn" onClick={() => navigate("/support")}>
              Support
            </button>

          </div>

          <div className="dashboard-wrapper">
            {/* Header */}
            <div className="dashboard-header">
              <div className="dashboard-user-info">
                <h1 className="dashboard-title">
                  AI Job <span>Predictions</span>
                </h1>
                <p className="dashboard-subtitle">
                  See roles you’re most likely to match based on your profile.
                </p>
              </div>
              <div className="dashboard-actions">
                <button
                  className="dashboard-edit-btn"
                  onClick={handleGetPredictions}
                  disabled={isPredicting}
                >
                  {isPredicting ? "Analyzing…" : "Get Job Suggestions"}
                </button>
                <button className="dashboard-logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>

            {/* Current suggestions + history */}
            <div className="dashboard-cards-grid">
              {/* Latest suggestions */}
              <div className="dashboard-card dashboard-card-full">
                <div className="dashboard-card-header">
                  <h3 className="dashboard-card-title">Latest Suggestions</h3>
                </div>
                <div className="dashboard-card-content">
                  {currentSuggestions.length === 0 ? (
                    <div className="dashboard-empty-state">
                      <p>
                        Click <strong>Get Job Suggestions</strong> to see
                        recommended roles.
                      </p>
                    </div>
                  ) : (
                    <ul className="prediction-list">
                      {currentSuggestions.map((s, idx) => (
                        <li key={idx} className="prediction-item">
                          <div className="suggestion-item">
                            <div className="suggestion-title">
                              {s.title} <span>{s.score}% match</span>
                            </div>

                            {s.missingSkills && s.missingSkills.length > 0 ? (
                              <div className="missing-skills">
                                <span>Missing skills:</span>
                                {s.missingSkills.map((skill, i) => (
                                  <span key={i} className="skill-chip">{skill}</span>
                                ))}
                              </div>
                            ) : (
                              <div className="missing-skills success">
                                <span>✅ No missing skills</span>
                              </div>
                            )}

                          </div>

                        </li>
                      ))}
                    </ul>
                  )}
                  {currentSuggestions.length > 0 && rating === null && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",   // 👈 centers horizontally
                        marginTop: 20,
                      }}
                    >
                      <p style={{ marginBottom: 8 }}>
                        <strong>Rate this prediction</strong>
                      </p>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center", // 👈 centers stars row
                          gap: 6,
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((v) => {
                          const isFilled =
                            hoverRating !== null ? v <= hoverRating : v <= (rating ?? 0);

                          return (
                            <span
                              key={v}
                              style={{
                                fontSize: 24,
                                cursor: "pointer",
                                color: isFilled ? "#facc15" : "#6b7280",
                              }}
                              onMouseEnter={() => setHoverRating(v)}
                              onMouseLeave={() => setHoverRating(null)}
                              onClick={() => setRating(v)}
                            >
                              ★
                            </span>
                          );
                        })}
                      </div>
                    </div>

                  )}
                  {rating !== null && (
                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center", // 👈 center everything
                        gap: 10,
                      }}
                    >
                      {/* Comment box */}
                      <textarea
                        placeholder="Optional feedback"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        style={{
                          width: "320px",          // 👈 small width
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #374151",
                          background: "#0b1220",
                          color: "#e5e7eb",
                          resize: "none",
                          fontSize: 14,
                        }}
                      />

                      {/* Submit button */}
                      <button
                        className="signup-submit-btn"
                        style={{
                          width: "220px",          // 👈 smaller button
                          padding: "10px",
                          fontSize: 14,
                        }}
                        onClick={async () => {
                          await fetch(`${API_BASE}/predictions/feedback/`, {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${token}`,
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              prediction: history[0]?.id,
                              rating,
                              comment,
                            }),
                          });

                          showToast("Feedback submitted", "success");
                          setRating(null);
                          setComment("");
                        }}
                      >
                        Submit Feedback
                      </button>
                    </div>
                  )}


                </div>
              </div>

              {/* History */}
              <div className="dashboard-card dashboard-card-full">
                <div className="dashboard-card-header">
                  <h3 className="dashboard-card-title">History</h3>
                </div>
                <div className="dashboard-card-content">
                  {isLoading ? (
                    <p>Loading history…</p>
                  ) : history.length === 0 ? (
                    <div className="dashboard-empty-state">
                      <p>No predictions yet.</p>
                    </div>
                  ) : (
                    <ul className="prediction-history-list">
                      {history.map((item) => (
                        <div key={item.id} className="history-card">

                          <div className="history-roles">
                            {item.predicted_roles.map((role: string, i: number) => (
                              <div key={i} className="history-row">
                                <span className="history-role">{role}</span>
                                <span className="history-score">
                                  {item.confidence_scores[i]}%
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="history-footer">
                            <span className="history-time">
                              {new Date(item.timestamp).toLocaleString()}
                            </span>

                            <button
                              className="history-remove"
                              onClick={() => handleRemoveHistoryItem(item.id)}
                            >
                              Remove
                            </button>
                          </div>

                        </div>
                      ))}

                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;
