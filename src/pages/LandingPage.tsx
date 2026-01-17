import React, { useEffect, useState, useCallback } from "react";
import "./LandingPage.css";
import { useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Counter for "Students Trained"
  const [studentsCount, setStudentsCount] = useState(0);
  const targetStudents = 120000;

  // Parallax state for job category images
  const [parallax, setParallax] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Theme state: "dark" | "light"
  const [theme] = useState<"dark" | "light">("dark");

  // Hover states for buttons
  const [hoverStates, setHoverStates] = useState({
    login: false,
    signup: false,
    getStarted: false,
    exploreJobs: false,
    theme: false
  });

  // animate students counter
  useEffect(() => {
    const duration = 1500; // ms
    const start = performance.now();

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.floor(progress * targetStudents);
      setStudentsCount(value);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  // apply theme to <html data-theme="...">
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Handle mouse move over the job section for parallax effect
  const handleParallaxMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width; // 0..1
    const relY = (e.clientY - rect.top) / rect.height; // 0..1

    // convert to -1 .. 1 range
    const x = (relX - 0.5) * 2;
    const y = (relY - 0.5) * 2;

    setParallax({ x, y });
  };

  const handleParallaxLeave = () => {
    setParallax({ x: 0, y: 0 });
  };

  // style for parallax photos using CSS vars
  const getPhotoStyle = (multX: number, multY: number): React.CSSProperties => {
    return {
      // CSS custom props for transform
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      "--tx": `${parallax.x * multX}px`,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      "--ty": `${parallax.y * multY}px`,
    };
  };

  const navigateWithAnimation = (path: string) => {
    const frame = document.querySelector<HTMLElement>(".ape-frame");
    if (frame) {
      frame.classList.add("ape-frame-slide-right");
      setTimeout(() => {
        navigate(path);
        frame.classList.remove("ape-frame-slide-right");
      }, 220);
    } else {
      navigate(path);
    }
  };

  // Handle hover state changes
  const handleHover = useCallback((button: keyof typeof hoverStates, isHovered: boolean) => {
    setHoverStates(prev => ({ ...prev, [button]: isHovered }));
  }, []);

  // Keyboard navigation for theme toggle
  // const handleThemeKeyDown = (e: React.KeyboardEvent) => {
  //   if (e.key === 'Enter' || e.key === ' ') {
  //     e.preventDefault();
  //     setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  //   }
  // };
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
          <div className="ape-url">edu2job.com</div>
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
          {/* NAVBAR */}
          <header className="ape-nav">
            <div className="ape-logo">
              <div className="ape-logo-mark" />
              <div className="ape-logo-text">
                <span className="ape-logo-main">Edu2Job</span>
                <span className="ape-logo-sub">AI Career Bridge</span>
              </div>
            </div>

            <div className="ape-nav-auth">
              {/* <button
                className="ape-theme-toggle"
                onClick={() =>
                  setTheme((prev) => (prev === "dark" ? "light" : "dark"))
                }
                onMouseEnter={() => handleHover("theme", true)}
                onMouseLeave={() => handleHover("theme", false)}
                onKeyDown={handleThemeKeyDown}
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                tabIndex={0}
                style={{
                  transform: hoverStates.theme ? "translateY(-2px) scale(1.05)" : "none",
                  boxShadow: hoverStates.theme ? "0 0 20px rgba(34, 197, 94, 0.5)" : "none",
                }}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button> */}

              <button
                className="ape-login-btn"
                onClick={() => navigateWithAnimation("/login")}
                onMouseEnter={() => handleHover("login", true)}
                onMouseLeave={() => handleHover("login", false)}
                style={{
                  transform: hoverStates.login ? "translateY(-2px)" : "none",
                  boxShadow: hoverStates.login ? "0 0 20px rgba(34, 197, 94, 0.7)" : "none"
                }}
              >
                Login
              </button>

              <button
                className="ape-signup-btn"
                onClick={() => navigateWithAnimation("/register")}
                onMouseEnter={() => handleHover("signup", true)}
                onMouseLeave={() => handleHover("signup", false)}
                style={{
                  transform: hoverStates.signup ? "translateY(-2px)" : "none",
                  boxShadow: hoverStates.signup ? "0 0 20px rgba(34, 197, 94, 0.7)" : "none"
                }}
              >
                Sign Up
              </button>
            </div>
          </header>

          {/* HERO SECTION */}
          <main className="ape-hero">
            <div className="ape-hero-inner">
              <h1 className="ape-hero-title">
                <span>Shape Your Education</span>
                <span className="ape-hero-highlight">
                  into a Powerful Career Path
                </span>
              </h1>

              <p className="ape-hero-subtitle">
                Analyze your academic history, get AI-powered job predictions,
                and connect with a community of achievers.
              </p>

              <div className="ape-hero-cta">
                <button
                  className="ape-hero-big-btn"
                  onClick={() => navigateWithAnimation("/register")}
                  onMouseEnter={() => handleHover("getStarted", true)}
                  onMouseLeave={() => handleHover("getStarted", false)}
                  style={{
                    transform: hoverStates.getStarted ? "translateY(-4px)" : "none",
                    boxShadow: hoverStates.getStarted ? "0 25px 60px rgba(34, 197, 94, 0.5)" : "0 20px 40px rgba(34, 197, 94, 0.35)"
                  }}
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* STATS SECTION */}
            <section className="ape-stats">
              {/* CARD 1 – Placement Success */}
              <article className="ape-stat-card ape-stat-card-roi">
                <div className="ape-roi-inner">
                  <div className="ape-roi-label-top">PLACEMENT SUCCESS</div>
                  <div className="ape-roi-value">95%</div>
                  <div className="ape-roi-caption">
                    average placement rate for Edu2Job students
                  </div>
                </div>
              </article>

              {/* CARD 2 – Students Trained */}
              <article className="ape-stat-card ape-stat-card-students">
                <div className="ape-card-header">
                  <div className="ape-card-value">
                    {studentsCount.toLocaleString()}+
                  </div>
                  <div className="ape-card-label">Students Trained</div>
                </div>

                <div className="ape-stock-container">
                  <div className="ape-stock-grid" />
                  <div className="ape-stock-area" />
                  <div className="ape-stock-line" />
                </div>
              </article>

              {/* CARD 3 – AI Success Stories (Trophy Animated) */}
              <article className="ape-stat-card ape-stat-card-achievers ape-achievers-card">
                <div className="ape-achievers-bg"></div>

                <div className="ape-stat-content">
                  <div className="ape-stat-title">
                    AI-POWERED SUCCESS STORIES
                  </div>
                  <div className="ape-stat-value">2,000+</div>
                  <div className="ape-stat-label">
                    students landed dream jobs using Edu2Job intelligence &
                    insights
                  </div>
                </div>
              </article>
            </section>

            {/* === JOB CATEGORIES SECTION === */}
            <section
              className="ape-job-categories"
              onMouseMove={handleParallaxMove}
              onMouseLeave={handleParallaxLeave}
            >
              <div className="ape-job-inner">
                <h2 className="ape-job-title">
                  Predict Jobs That Match Your Skills
                </h2>

                <div className="ape-job-panel">
                  <ul className="ape-job-list">
                    <li className="active">
                      Data &amp; AI <span>(9,821+)</span>
                    </li>
                    <li>
                      Software Development <span>(12,540+)</span>
                    </li>
                    <li>
                      Business &amp; Management <span>(8,200+)</span>
                    </li>
                    <li>
                      UI/UX &amp; Product Design <span>(3,915+)</span>
                    </li>
                    <li>
                      Cybersecurity <span>(2,630+)</span>
                    </li>
                  </ul>

                  <button
                    className="ape-job-btn"
                    onClick={() => navigateWithAnimation("/register")}
                    onMouseEnter={() => handleHover("exploreJobs", true)}
                    onMouseLeave={() => handleHover("exploreJobs", false)}
                    style={{
                      transform: hoverStates.exploreJobs ? "translateY(-4px)" : "none",
                      boxShadow: hoverStates.exploreJobs ? "0 25px 50px rgba(34, 197, 94, 0.5)" : "0 16px 40px rgba(34, 197, 94, 0.3)"
                    }}
                  >
                    Explore Job Roles
                  </button>
                </div>
              </div>

              {/* floating photos with parallax */}
              <img
                className="ape-job-photo ape-job-photo--tl"
                src="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&dpr=2&w=400"
                alt="Mentor helping student"
                style={getPhotoStyle(-18, -10)}
              />
              <img
                className="ape-job-photo ape-job-photo--tr"
                src="https://images.pexels.com/photos/4065876/pexels-photo-4065876.jpeg?auto=compress&dpr=2&w=400"
                alt="Student learning online"
                style={getPhotoStyle(18, -8)}
              />
              <img
                className="ape-job-photo ape-job-photo--bl"
                src="https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&dpr=2&w=400"
                alt="Woman studying with laptop"
                style={getPhotoStyle(-14, 10)}
              />
              <img
                className="ape-job-photo ape-job-photo--br"
                src="https://images.pexels.com/photos/3760853/pexels-photo-3760853.jpeg?auto=compress&dpr=2&w=400"
                alt="Student working on project"
                style={getPhotoStyle(16, 12)}
              />
            </section>
          </main>

          {/* ====== FOOTER ====== */}
          <footer className="ape-footer">
            <div className="ape-footer-top">
              {/* Brand + text */}
              <div className="ape-footer-col">
                <h3 className="ape-footer-logo">Edu2Job</h3>
                <p className="ape-footer-text">
                  Empowering students and graduates to discover career paths
                  that align with their capabilities. Our AI engine evaluates
                  your academic progress, skills, and interests to help you
                  choose the right job role with clarity and confidence.
                </p>

                <div className="ape-footer-social">
                  {/* Facebook */}
                  <a href="#" aria-label="Facebook">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-3h2.5V9.5c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.3.2 2.3.2v2.6h-1.3c-1.3 0-1.7.8-1.7 1.6V12H18l-.4 3h-2.9v7A10 10 0 0 0 22 12z" />
                    </svg>
                  </a>

                  {/* LinkedIn */}
                  <a href="#" aria-label="LinkedIn">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm.02 4.9H2V21h3V8.4zM14.5 8c-2.33 0-3.5 1.27-3.5 3.6V21h3v-8.1c0-1.2.6-1.9 1.7-1.9 1.02 0 1.8.8 1.8 2.1V21h3v-8.4c0-3.1-1.7-4.6-4-4.6z" />
                    </svg>
                  </a>

                  {/* Instagram */}
                  <a href="#" aria-label="Instagram">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 2 .3 2.4.5.6.2 1 .5 1.5 1 .4.4.7.9 1 1.5.2.4.4 1.2.5 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 2-.5 2.4-.3.6-.6 1.1-1 1.5-.4.4-.9.7-1.5 1-.4.2-1.2.4-2.4.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-2-.3-2.4-.5-.6-.3-1.1-.6-1.5-1-.4-.4-.7-.9-1-1.5-.2-.4-.4-1.2-.5-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-2 .5-2.4.3-.6.6-1.1 1-1.5.4-.4.9-.7 1.5-1 .4-.2 1.2-.4 2.4-.5C8.4 2.2 8.8 2.2 12 2.2zm0 3.4a6.4 6.4 0 1 0 0 12.8A6.4 6.4 0 0 0 12 5.6zm6.8-1.4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                    </svg>
                  </a>

                  {/* YouTube */}
                  <a href="#" aria-label="YouTube">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C16 4 12 4 12 4h0s-4 0-6.7.2c-.4 0-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2 9 2 10.7v1.6C2 14 2.2 15.5 2.2 15.5s.2 1.5.8 2.1c.8.8 1.9.8 2.4.9 1.7.2 6.6.2 6.6.2s4 0 6.7-.2c.4 0 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.5.2-3.2v-1.6c0-1.7-.2-3.2-.2-3.2zM10 14.7V8.9l4.9 2.9z" />
                    </svg>
                  </a>

                  {/* GitHub */}
                  <a href="#" aria-label="GitHub">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.4-3.4-1.4-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.7-1.3-2.2-.3-4.5-1.1-4.5-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.8 1a9.3 9.3 0 0 1 5.1 0c2-1.3 2.8-1 2.8-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.6 1 2.7 0 3.8-2.3 4.6-4.6 4.9.4.3.8 1 .8 2v3c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
                    </svg>
                  </a>
                </div>

              </div>

              {/* Quick Links */}
              <div className="ape-footer-col">
                <h4 className="ape-footer-heading">Quick Links</h4>
                <ul>
                  <li>Home</li>
                  <li>Community</li>
                  <li>Dashboard</li>
                  <li>Login</li>
                </ul>
              </div>

              {/* Resources */}
              <div className="ape-footer-col">
                <h4 className="ape-footer-heading">Resources</h4>
                <ul>
                  <li>Career Roadmaps</li>
                  <li>Interview Preparation</li>
                  <li>Tech Skill Guides</li>
                  <li>Placement Insights</li>
                </ul>
              </div>

              {/* Newsletter */}
              <div className="ape-footer-col ape-footer-news">
                <h4 className="ape-footer-heading">Stay Ahead</h4>
                <p className="ape-footer-text">
                  Be the first to know about career trends, hiring patterns, and
                  emerging roles in the industry. Join our newsletter to level
                  up your journey.
                </p>

                <form
                  className="ape-footer-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.querySelector('input');
                    if (input?.value) {
                      alert(`Thank you for subscribing with: ${input.value}`);
                      input.value = '';
                    }
                  }}
                >
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="ape-footer-input"
                    required
                  />
                  <button type="submit" className="ape-footer-btn">
                    JOIN NOW
                  </button>
                </form>
              </div>
            </div>

            <div className="ape-footer-bottom">
              <span>
                © 2025 Edu2Job. Designed for the next generation of talent.
              </span>
              <div className="ape-footer-bottom-links">
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
                <span>Cookie Policy</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;