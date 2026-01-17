import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Send } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export default function SupportContact() {
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useAuth();

    const params = new URLSearchParams(location.search);
    const initialType = params.get("type") || "general";

    const [form, setForm] = useState({
        type: initialType,
        subject: "",
        message: "",
    });

    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!token) {
            alert("Please login first to submit a support request");
            navigate("/login");
            return;
        }

        if (!form.subject || !form.message) {
            alert("Please fill subject and message");
            return;
        }

        try {
            setLoading(true);

            await axios.post(
                `${API_BASE}/support/tickets/`,
                {
                    type: form.type,
                    subject: form.subject,
                    message: form.message,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            alert(
                "Support request submitted successfully ✅\n\nYou will see admin reply here once resolved."
            );
            navigate("/support");

        } catch (err) {
            console.error(err);
            alert("Failed to submit support request");
        } finally {
            setLoading(false);
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
                {/* Browser Bar */}
                <div className="ape-browser-bar">
                    <div className="ape-dots">
                        <span />
                        <span />
                        <span />
                    </div>
                    <div className="ape-url">edu2job.com/support</div>
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


                    <div className="support-container">
                        <h2>Contact Support</h2>
                        <p>Please describe your issue clearly</p>

                        <select
                            value={form.type}
                            onChange={(e) =>
                                setForm({ ...form, type: e.target.value })
                            }
                        >
                            <option value="general">General</option>
                            <option value="bug">Bug</option>
                            <option value="feature">Feature Request</option>
                        </select>

                        <input
                            placeholder="Subject"
                            value={form.subject}
                            onChange={(e) =>
                                setForm({ ...form, subject: e.target.value })
                            }
                        />

                        <textarea
                            placeholder="Describe your issue"
                            value={form.message}
                            onChange={(e) =>
                                setForm({ ...form, message: e.target.value })
                            }
                        />

                        <button
                            onClick={submit}
                            disabled={loading}
                            className="support-submit-btn"
                        >
                            <Send size={16} />
                            {loading ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
