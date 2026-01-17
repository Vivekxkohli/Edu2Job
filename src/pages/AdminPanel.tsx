import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../auth/ToastContext";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import "./LandingPage.css";
import "./Dashboard.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

type Tab =
  | "analytics"
  | "users"
  | "model"
  | "logs"
  | "predictions"
  | "support";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444", "#10b981", "#8b5cf6", "#ec4899"];

// Define interfaces for better TypeScript support
interface UniversityData {
  id?: number;
  name: string;
  count: number;
  university_name?: string;
  student_count?: number;
}

interface JobData {
  id?: number;
  job: string;
  count: number;
  job_title?: string;
  prediction_count?: number;
}

interface DailyPrediction {
  day: string;
  date?: string;
  predictions: number;
  count?: number;
}

interface UserGrowth {
  month: string;
  users: number;
  active: number;
  new_users?: number;
  active_users?: number;
}

interface AnalyticsData {
  total_users: number;
  students: number;
  admins?: number;
  total_predictions?: number;
  monthly_predictions?: number;
  avg_confidence?: number;
  accuracy?: number;
  universities: UniversityData[];
  top_jobs: JobData[];
  daily_predictions: DailyPrediction[];
  user_growth: UserGrowth[];
  top_degrees?: Array<{ degree: string, count: number }>;
}
interface AdminUser {
  id: number;
  email: string;
  role: string;

  // optional fields coming from backend
  username?: string;
  name?: string;
  date_joined?: string;

  // flag system
  is_flagged: boolean;
  flag_reason?: string;
}

const AdminPanel: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("analytics");
  const [loading, setLoading] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };
  const [showFlagHistory, setShowFlagHistory] = useState(false);
  const { refreshUserData } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  // 🔐 Admin protection
  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // =========================
  // FETCH FUNCTIONS
  // =========================

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/analytics/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch analytics: ${res.status}`);
      }

      const data = await res.json();
      console.log("Analytics API Response:", data);
      setAnalytics(data);

    } catch (error) {
      console.error("Error fetching analytics:", error);
      showToast("Failed to load analytics data", "error");

      // Fallback demo data for testing
      setAnalytics({
        total_users: 156,
        students: 140,
        admins: 16,
        total_predictions: 342,
        monthly_predictions: 45,
        avg_confidence: 78.5,
        accuracy: 82,
        universities: [
          { name: "ABC University", count: 45 },
          { name: "XYZ College", count: 32 },
          { name: "Tech Institute", count: 28 },
          { name: "State University", count: 25 },
          { name: "Global College", count: 20 }
        ],
        top_jobs: [
          { job: "Software Engineer", count: 85 },
          { job: "Data Analyst", count: 60 },
          { job: "ML Engineer", count: 45 },
          { job: "Web Developer", count: 38 },
          { job: "DevOps Engineer", count: 32 }
        ],
        daily_predictions: [
          { day: "Mon", predictions: 12 },
          { day: "Tue", predictions: 19 },
          { day: "Wed", predictions: 15 },
          { day: "Thu", predictions: 22 },
          { day: "Fri", predictions: 18 },
          { day: "Sat", predictions: 10 },
          { day: "Sun", predictions: 8 }
        ],
        user_growth: [
          { month: "Jan", users: 40, active: 35 },
          { month: "Feb", users: 65, active: 55 },
          { month: "Mar", users: 90, active: 75 },
          { month: "Apr", users: 120, active: 100 },
          { month: "May", users: 150, active: 125 },
          { month: "Jun", users: 156, active: 140 }
        ],
        top_degrees: [
          { degree: "Computer Science", count: 45 },
          { degree: "Mechanical Engineering", count: 32 },
          { degree: "Electrical Engineering", count: 28 },
          { degree: "Business Administration", count: 25 },
          { degree: "Civil Engineering", count: 20 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchSupportTickets = async () => {
    try {
      const res = await fetch(`${API}/admin/support/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("Support tickets:", data); // 👈 DEBUG

      setSupportTickets(data);
    } catch (err) {
      console.error("Failed to fetch support tickets", err);
    }
  };



  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/admin/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Failed to load users", "error");
    }
  };

  // const fetchLogs = async () => {
  //   const res = await fetch(`${API}/admin/predictions/`, {
  //     headers: { Authorization: `Bearer ${token}` },
  //   });
  //   if (res.ok) setLogs(await res.json());
  // };


  const fetchPredictions = async () => {
    try {
      const res = await fetch(`${API}/admin/predictions/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPredictions(await res.json());
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
      showToast("Failed to load predictions", "error");
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const res = await fetch(`${API}/admin/logs/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch system logs");
        return;
      }

      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("System logs fetch error", err);
    }
  };

  useEffect(() => {
    if (tab === "analytics") fetchAnalytics();
    if (tab === "users") fetchUsers();
    if (tab === "logs") fetchSystemLogs();   // ✅ THIS LINE
    if (tab === "predictions") fetchPredictions();
  }, [tab]);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch(`${API}/admin/feedback/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFeedbacks(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch feedback");
    }
  };

  // Enhanced flagUser function with confirmation
  const flagUser = async (userId: number) => {
    const reason = prompt("Enter flag reason:");
    if (!reason) return;

    const res = await fetch(`${API}/admin/users/${userId}/flag/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (res.ok) {
      showToast("User flagged successfully", "success");
      fetchUsers();

      // ⭐ REQUIRED
      refreshUserData();
    }
  };

  // Enhanced unflagUser function with confirmation
  const unflagUser = async (userId: number) => {
    const res = await fetch(`${API}/admin/users/${userId}/unflag/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      showToast("User unflagged successfully", "success");
      fetchUsers();

      // ⭐ REQUIRED
      refreshUserData();
    }
  };

  // =========================
  // DATA PROCESSING FUNCTIONS
  // =========================

  // Helper to process university data from API
  const getUniversitiesData = () => {
    if (!analytics?.universities) return [];

    return analytics.universities.map(item => ({
      name: item.university_name || item.name || "Unknown",
      count: item.student_count || item.count || 0
    }));
  };

  // Helper to process job data from API
  const getJobsData = () => {
    if (!analytics?.top_jobs) return [];

    return analytics.top_jobs.map(item => ({
      job: item.job_title || item.job || "Unknown",
      count: item.prediction_count || item.count || 0
    }));
  };

  // Helper to process daily predictions
  const getDailyPredictionsData = () => {
    if (!analytics?.daily_predictions) return [];

    return analytics.daily_predictions.map(item => ({
      day: item.date?.split('-').pop()?.slice(0, 3) || item.day || "Day",
      predictions: item.count || item.predictions || 0
    }));
  };

  // Helper to process user growth
  const getUserGrowthData = () => {
    if (!analytics?.user_growth) return [];

    return analytics.user_growth.map(item => ({
      month: item.month,
      users: item.users,
      active: item.active_users || item.active || 0
    }));
  };

  // =========================
  // ACTIONS
  // =========================

  const updateRole = async (id: number, role: string) => {
    try {
      await fetch(`${API}/admin/users/${id}/role/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });
      showToast("Role updated", "success");
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      showToast("Failed to update role", "error");
    }
  };
  const replyToTicket = async (id: number) => {
    const reply = replies[id];
    if (!reply) return;

    await fetch(`${API}/admin/support/${id}/reply/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reply }),
    });

    setReplies(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    fetchSupportTickets();
  };

  const deleteUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await fetch(`${API}/admin/users/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("User deleted", "success");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast("Failed to delete user", "error");
    }
  };

  // =========================
  // HANDLERS
  // =========================

  const handleBack = () => {
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
  const deleteTicket = async (id: number) => {
    if (!window.confirm("Delete this support ticket?")) return;

    await fetch(`${API}/support/tickets/${id}/delete/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchSupportTickets(); // refresh list
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userInitial = user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "A";

  // =========================
  // RENDER FUNCTIONS
  // =========================

  const renderAnalyticsTab = () => {
    if (loading) {
      return (
        <div className="dashboard-card dashboard-card-full">
          <div className="dashboard-card-content" style={{ textAlign: 'center', padding: '50px' }}>
            <div className="loading-spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        </div>
      );
    }

    if (!analytics) {
      return (
        <div className="dashboard-card dashboard-card-full">
          <div className="dashboard-card-content" style={{ textAlign: 'center', padding: '50px' }}>
            <p>No analytics data available.</p>
            <button className="signup-submit-btn" onClick={fetchAnalytics}>
              Retry
            </button>
          </div>
        </div>
      );
    }

    const universitiesData = getUniversitiesData();
    const jobsData = getJobsData();
    const dailyPredictionsData = getDailyPredictionsData();
    const userGrowthData = getUserGrowthData();


    return (
      <div className="dashboard-cards-grid">
        {/* Summary Cards */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Total Users</h3>
          </div>
          <div className="dashboard-card-content">
            <h1 style={{ fontSize: "2.5rem", margin: 0, color: "#3b82f6" }}>
              {analytics.total_users}
            </h1>
            <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "0.9rem" }}>
              Active: {analytics.students || analytics.total_users}
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Students</h3>
          </div>
          <div className="dashboard-card-content">
            <h1 style={{ fontSize: "2.5rem", margin: 0, color: "#22c55e" }}>
              {analytics.students}
            </h1>
            <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "0.9rem" }}>
              {analytics.admins ? `Admins: ${analytics.admins}` : "Admins: 0"}
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Total Predictions</h3>
          </div>
          <div className="dashboard-card-content">
            <h1 style={{ fontSize: "2.5rem", margin: 0, color: "#f97316" }}>
              {analytics.total_predictions || 0}
            </h1>
            <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "0.9rem" }}>
              This month: {analytics.monthly_predictions || 0}
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Avg. Confidence</h3>
          </div>
          <div className="dashboard-card-content">
            <h1 style={{ fontSize: "2.5rem", margin: 0, color: "#a855f7" }}>
              {analytics.avg_confidence || 0}%
            </h1>
            <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "0.9rem" }}>
              Model Accuracy
            </p>
          </div>
        </div>

        {/* University Distribution Pie Chart */}
        <div className="dashboard-card dashboard-card-full">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">University Distribution</h3>
          </div>
          <div className="dashboard-card-content">
            {universitiesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={universitiesData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, payload }: any) => `${name}: ${payload.count}`}
                  >
                    {universitiesData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <p>No university data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Predicted Jobs - Bar Chart */}
        <div className="dashboard-card dashboard-card-full">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Top Predicted Jobs</h3>
          </div>
          <div className="dashboard-card-content">
            {jobsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={jobsData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="job"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    label={{ value: 'Prediction Count', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip formatter={(value) => [`${value} predictions`, 'Count']} />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="Prediction Count"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <p>No job prediction data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Prediction Trends Over Time - Line Chart */}
        <div className="dashboard-card dashboard-card-full">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Prediction Trends (Last 7 Days)</h3>
          </div>
          <div className="dashboard-card-content">
            {dailyPredictionsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={dailyPredictionsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis label={{ value: 'Predictions', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="predictions"
                    name="Daily Predictions"
                    stroke="#f97316"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <p>No prediction trend data available</p>
              </div>
            )}
          </div>
        </div>

        {/* User Growth - Area Chart */}
        <div className="dashboard-card dashboard-card-full">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">User Growth & Activity</h3>
          </div>
          <div className="dashboard-card-content">
            {userGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={userGrowthData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="Total Users"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="active"
                    name="Active Users"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <p>No user growth data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =========================
  // MAIN RENDER
  // =========================

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
          <div className="ape-url">edu2job.com/admin</div>
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
          {/* Back button */}
          <div className="ape-back-btn" onClick={handleBack}>
            <span>← Back</span>
          </div>

          {/* ADMIN NAVIGATION TABS */}
          <div className="dashboard-navigation">
            <button
              onClick={() => setTab("analytics")}
              className={`nav-btn ${tab === "analytics" ? "active" : ""}`}
            >
              Analytics
            </button>
            <button
              onClick={() => setTab("users")}
              className={`nav-btn ${tab === "users" ? "active" : ""}`}
            >
              User Management
            </button>
            <button
              onClick={() => setTab("model")}
              className={`nav-btn ${tab === "model" ? "active" : ""}`}
            >
              Model Governance
            </button>
            <button
              onClick={() => setTab("logs")}
              className={`nav-btn ${tab === "logs" ? "active" : ""}`}
            >
              System Logs
            </button>
            <button
              onClick={() => setTab("predictions")}
              className={`nav-btn ${tab === "predictions" ? "active" : ""}`}
            >
              Prediction Logs
            </button>
            <button
              onClick={() => {
                setTab("support");
                fetchSupportTickets(); // 🔥 THIS WAS MISSING
              }}
              className={`nav-btn ${tab === "support" ? "active" : ""}`}
            >
              Support Tickets
            </button>


          </div>

          <div className="dashboard-wrapper">
            {/* HEADER SECTION */}
            <div className="dashboard-header">
              <div className="dashboard-user-info">
                <div className="dashboard-user-avatar">
                  <div className="dashboard-avatar-fallback">{userInitial}</div>
                </div>
                <div>
                  <h1 className="dashboard-title">
                    Welcome,{" "}
                    <span>{user.name || user.username || "Admin"}</span>
                  </h1>
                  <p className="dashboard-subtitle">
                    {user.email}
                    <br />
                    <span className="dashboard-last-updated">
                      Admin Panel
                    </span>
                  </p>
                </div>
              </div>

              <div className="dashboard-actions">
                <button
                  className="dashboard-edit-btn"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </button>
                <button
                  className="dashboard-logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>

            {/* TAB CONTENT */}
            {tab === "analytics" && renderAnalyticsTab()}

            {/* ================= USERS ================= */}
            {tab === "users" && (
              <div className="dashboard-card dashboard-card-full">
                <div className="dashboard-card-header">
                  <h3 className="dashboard-card-title">User Management</h3>
                  <button
                    className="dashboard-edit-btn"
                    style={{ padding: "6px 14px", fontSize: 13 }}
                    onClick={() => setShowFlagHistory(prev => !prev)}
                  >
                    {showFlagHistory ? "Hide Flag History" : "View Flag History"}
                  </button>

                </div>
                <div className="dashboard-card-content">
                  {users.length > 0 ? (
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th> {/* ⭐ NEW: Status column */}
                          <th>Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.name || u.username || "N/A"}</td>
                            <td>{u.email}</td>
                            <td>
                              <select
                                value={u.role}
                                onChange={e => updateRole(u.id, e.target.value)}
                                className="dashboard-select"
                              >
                                <option value="admin">Admin</option>
                                <option value="student">Student</option>
                              </select>
                            </td>
                            <td>
                              {/* ⭐ NEW: Status indicator */}
                              {u.is_flagged ? (
                                <span className="status-badge error" title={u.flag_reason || "Flagged"}>
                                  ⚠ Flagged
                                </span>
                              ) : (
                                <span className="status-badge success">Active</span>
                              )}
                            </td>
                            <td>
                              {u.date_joined
                                ? new Date(u.date_joined).toLocaleDateString()
                                : "—"}
                            </td>
                            <td>
                              {/* ⭐ UPDATED: Flag/Unflag logic */}
                              {u.is_flagged ? (
                                <button
                                  className="dashboard-edit-btn unflag-btn"
                                  onClick={() => unflagUser(u.id)}  // This calls unflagUser
                                  title={u.flag_reason ? `Reason: ${u.flag_reason}` : "Remove flag"}
                                >
                                  Unflag User
                                </button>
                              ) : (
                                <button
                                  className="dashboard-edit-btn flag-btn"
                                  onClick={() => flagUser(u.id)}
                                >
                                  Flag User
                                </button>
                              )}

                              <button
                                className="dashboard-delete-btn"
                                onClick={() => deleteUser(u.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                      <p>No user data available</p>
                      <button className="signup-submit-btn" onClick={fetchUsers}>
                        Load Users
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showFlagHistory && (
              <div className="dashboard-card dashboard-card-full">
                <div className="dashboard-card-header">
                  <h3 className="dashboard-card-title">🚩 Flag History</h3>
                </div>

                <div className="dashboard-card-content">
                  {users.filter(u => u.is_flagged).length === 0 ? (
                    <p style={{ color: "#9ca3af" }}>No flagged users found.</p>
                  ) : (
                    users
                      .filter(u => u.is_flagged)
                      .map((u) => (
                        <div
                          key={u.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 0",
                            borderBottom: "1px solid rgba(255,255,255,0.08)"
                          }}
                        >
                          <div>
                            <strong>{u.email}</strong>
                            <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                              Reason: {u.flag_reason || "No reason provided"}
                            </p>
                          </div>

                          <button
                            className="dashboard-remove-btn"
                            onClick={() => unflagUser(u.id)}
                          >
                            Remove Flag
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* ================= MODEL ================= */}
            {tab === "model" && (
              <div className="dashboard-card dashboard-card-full">
                <div className="dashboard-card-header">
                  <h3 className="dashboard-card-title">Model Governance</h3>
                </div>
                <div className="dashboard-card-content">
                  <div style={{ padding: '20px' }}>
                    <h4>Model Performance</h4>
                    <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
                      <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>
                          {analytics?.accuracy || 82}%
                        </div>
                        <div style={{ color: '#666' }}>Accuracy</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                          {analytics?.avg_confidence || 78.5}%
                        </div>
                        <div style={{ color: '#666' }}>Avg Confidence</div>
                      </div>
                    </div>
                    <div style={{ marginTop: "20px" }}>
                      <div className="file-upload">
                        <input
                          type="file"
                          id="modelFile"
                          className="file-input"
                          accept=".csv"
                          onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        />

                        <label htmlFor="modelFile" className="file-label">
                          Choose CSV
                        </label>

                        <span className="file-name">
                          {csvFile ? csvFile.name : "No file chosen"}
                        </span>
                      </div>


                      <br />

                      <button
                        className="signup-submit-btn"
                        onClick={async () => {
                          if (!csvFile) {
                            showToast("Please upload a CSV file", "error");
                            return;
                          }

                          const formData = new FormData();
                          formData.append("file", csvFile);

                          try {
                            const res = await fetch(`${API}/admin/model/retrain/`, {
                              method: "POST",
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                              body: formData,
                            });

                            if (res.ok) {
                              showToast("Model retrained successfully", "success");
                            } else {
                              const err = await res.json();
                              showToast(err.error || "Retraining failed", "error");
                            }
                          } catch (e) {
                            showToast("Server error during retraining", "error");
                          }
                        }}
                      >
                        Retrain Model
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* ================= LOGS ================= */}
            {tab === "logs" && (
              <div className="dashboard-card dashboard-card-full">
                <div className="dashboard-card-header">
                  <h3 className="dashboard-card-title">System Logs</h3>
                </div>
                <div className="dashboard-card-content">
                  {logs.length > 0 ? (
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Admin</th>
                          <th>Action</th>
                          <th>Target</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: "center" }}>
                              No system logs found.
                            </td>
                          </tr>
                        ) : (
                          logs.map((log, i) => (
                            <tr key={i}>
                              <td>{log.time ? new Date(log.time).toLocaleString() : "—"}</td>
                              <td>{log.admin || "—"}</td>
                              <td>{log.action || "—"}</td>
                              <td>{log.target || "System"}</td>
                              <td>{log.details || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>

                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                      <p>No system logs available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= PREDICTIONS ================= */}
            {tab === "predictions" && (
              <div className="dashboard-card dashboard-card-full">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <h3 className="dashboard-card-title">Prediction Logs</h3>

                  <button
                    className="dashboard-edit-btn"
                    style={{ padding: "6px 14px", fontSize: 13 }}
                    onClick={() => {
                      if (!showFeedback) fetchFeedbacks();
                      setShowFeedback(!showFeedback);
                    }}
                  >
                    {showFeedback ? "Hide Feedback" : "View Feedback"}
                  </button>
                </div>

                <div className="dashboard-card-content">
                  {predictions.length > 0 ? (
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Predicted Job</th>
                          <th>Confidence</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictions.map(p => (
                          <tr key={p.id}>
                            <td>{p.user || p.user_email || "N/A"}</td>
                            <td>{p.predicted_job || "-"}</td>
                            {/* <td>{Array.isArray(p.predicted_roles) ? p.predicted_roles.join(", ") : "-"}</td> */}
                            <td>
                              <span style={{
                                color: p.confidence > 80 ? '#22c55e' : p.confidence > 60 ? '#f97316' : '#ef4444',
                                fontWeight: 'bold'
                              }}>
                                {p.confidence}%
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${p.status === 'success' ? 'success' : p.status === 'pending' ? 'pending' : 'error'}`}>
                                {p.status || 'completed'}
                              </span>
                            </td>
                            <td>{p.timestamp ? new Date(p.timestamp).toLocaleDateString() : "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                      <p>No prediction logs available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* ================= SUPPORT ================= */}
            {tab === "support" && (
              <div className="dashboard-card dashboard-card-full">
                <div className="dashboard-card-header">
                  <h3 className="dashboard-card-title">Support Tickets</h3>
                </div>

                <div className="dashboard-card-content">
                  {supportTickets.length === 0 ? (
                    <p style={{ color: "#777" }}>No support tickets found.</p>
                  ) : (
                    supportTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="dashboard-card"
                        style={{ marginBottom: 16 }}
                      >
                        <h4>{ticket.subject}</h4>
                        <p>{ticket.message}</p>

                        <p style={{ fontSize: 13 }}>
                          Type: {ticket.type} •{" "}
                          <span
                            style={{
                              color: ticket.status === "resolved" ? "#16a34a" : "#f59e0b",
                              fontWeight: 600,
                            }}
                          >
                            {ticket.status.toUpperCase()}
                          </span>
                        </p>

                        {ticket.status !== "resolved" && (
                          <>
                            <div className="support-reply-row">
                              <textarea
                                className="support-reply-input"
                                placeholder="Write admin reply..."
                                value={replies[ticket.id] || ""}
                                onChange={(e) =>
                                  setReplies({ ...replies, [ticket.id]: e.target.value })
                                }
                              />


                              <button
                                className="dashboard-edit-btn support-reply-btn"
                                onClick={() => replyToTicket(ticket.id)}
                              >
                                Reply & Resolve
                              </button>
                              <button
                                className="dashboard-delete-btn"
                                style={{ marginLeft: 8 }}
                                onClick={() => deleteTicket(ticket.id)}
                              >
                                Delete
                              </button>

                            </div>

                          </>
                        )}

                        {ticket.admin_reply && (
                          <div style={{ marginTop: 10, color: "#16a34a" }}>
                            <strong>Admin Reply:</strong>
                            <p>{ticket.admin_reply}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {
              showFeedback && (
                <div className="dashboard-card dashboard-card-full" style={{ marginTop: 20 }}>
                  <div className="dashboard-card-header">
                    <h3 className="dashboard-card-title">Feedback History</h3>
                  </div>

                  <div className="dashboard-card-content">
                    {feedbacks.length === 0 ? (
                      <p>No feedback submitted yet.</p>
                    ) : (
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Rating</th>
                            <th>Comment</th>
                            <th>Predicted Roles</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {feedbacks.map((f, i) => (
                            <tr key={i}>
                              <td>{f.user}</td>
                              <td>{f.rating} ⭐</td>
                              <td>{f.comment || "-"}</td>
                              <td>{f.predicted_roles.join(", ")}</td>
                              <td>{new Date(f.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;