import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export default function MySupportTickets() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [tickets, setTickets] = useState<any[]>([]);
  const deleteTicket = async (id: number) => {
    if (!window.confirm("Delete this support ticket?")) return;

    await fetch(
      `${API_BASE}/support/tickets/${id}/delete/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API_BASE}/support/my-tickets/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setTickets(res.data))
      .catch(() => { });
  }, [token]);

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
        {/* DASHBOARD NAV (same CSS) */}
        {/* Browser Bar */}
        <div className="ape-browser-bar">
          <div className="ape-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="ape-url">edu2job.com/support/my-tickets</div>
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
          {/* Back (SAME AS DASHBOARD) */}
          <div className="ape-back-btn" onClick={() => navigate(-1)}>
            <span>← Back</span>
          </div>

          {/* DASHBOARD NAVIGATION (SAME CLASS) */}
          <div className="dashboard-navigation">
            <button className="nav-btn" onClick={() => navigate("/dashboard")}>
              Home
            </button>

            <button className="nav-btn" onClick={() => navigate("/profile")}>
              My Profile
            </button>

            <button className="nav-btn" onClick={() => navigate("/predictions")}>
              Job Predictor
            </button>

            <button className="nav-btn active">
              Support
            </button>
          </div>


          {/* CONTENT */}
          <div className="support-container">
            <h2>My Support Tickets</h2>

            {tickets.length === 0 ? (
              <p>No support tickets found.</p>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="dashboard-card"
                  style={{ marginBottom: 16 }}
                >
                  <h4>{ticket.subject}</h4>
                  <p>{ticket.message}</p>

                  <p style={{ fontSize: 13 }}>
                    Status:{" "}
                    <span
                      style={{
                        color:
                          ticket.status === "resolved"
                            ? "#16a34a"
                            : "#f59e0b",
                        fontWeight: 600,
                      }}
                    >
                      {ticket.status.toUpperCase()}
                    </span>
                  </p>

                  {ticket.admin_reply && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 12,
                        borderRadius: 8,
                        background: "rgba(34,197,94,0.1)",
                      }}
                    >
                      <strong>Admin Reply:</strong>
                      <p>{ticket.admin_reply}</p>
                      <button
                        className="dashboard-delete-btn"
                        style={{ marginTop: 8 }}
                        onClick={() => deleteTicket(ticket.id)}
                      >
                        Delete Ticket
                      </button>

                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
