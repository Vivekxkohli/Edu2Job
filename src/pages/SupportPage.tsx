import { useNavigate } from "react-router-dom";
import {
    LifeBuoy,
    Bug,
    Sparkles,
    // BookOpen,
    // ArrowLeft,
    MessageSquareText
} from "lucide-react";
import { useEffect } from "react";

export default function SupportPage() {
    const navigate = useNavigate();

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
                        <h1>Support</h1>
                        <p>How can we help you today?</p>

                        <div className="support-grid">
                            {/* <div
                                className="support-card"
                                onClick={() => navigate("/docs")}
                            >
                                <BookOpen className="support-icon" />
                                <h3>Documentation</h3>
                                <p>Guides, FAQs & help articles</p>
                            </div> */}

                            <div
                                className="support-card"
                                onClick={() => navigate("/support/contact")}
                            >
                                <LifeBuoy className="support-icon" />
                                <h3>Contact Support</h3>
                                <p>Reach out to our support team</p>
                            </div>

                            <div
                                className="support-card"
                                onClick={() =>
                                    navigate("/support/contact?type=bug")
                                }
                            >
                                <Bug className="support-icon" />
                                <h3>Report a Bug</h3>
                                <p>Something isn’t working?</p>
                            </div>

                            <div
                                className="support-card"
                                onClick={() =>
                                    navigate("/support/contact?type=feature")
                                }
                            >
                                <Sparkles className="support-icon" />
                                <h3>Feature Request</h3>
                                <p>Suggest improvements or ideas</p>
                            </div>
                            <div
                                className="support-card"
                                onClick={() => navigate("/support/my-tickets")}
                            >
                                <MessageSquareText className="support-icon" />
                                <h3>View Feedback</h3>
                                <p>See admin replies & ticket status</p>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
