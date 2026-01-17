import React, { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../auth/ToastContext";
import GoogleLoginButton from "./GoogleLoginButton";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  terms?: string;
};

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-focus first input
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  // Real-time email validation
  useEffect(() => {
    if (email && email.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address",
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, email: undefined }));
      }
    }
  }, [email]);

  // Real-time password validation
  useEffect(() => {
    if (password) {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
      if (!passwordRegex.test(password)) {
        setFieldErrors((prev) => ({
          ...prev,
          password:
            "Password must be at least 6 characters with letters and numbers.",
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, password: undefined }));
      }
    }
  }, [password]);

  const getPasswordStrength = (
    pass: string
  ): { score: number; label: string; color: string } => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    const levels = [
      { label: "Weak", color: "#ef4444" },
      { label: "Fair", color: "#f59e0b" },
      { label: "Good", color: "#10b981" },
      { label: "Strong", color: "#22c55e" },
      { label: "Very Strong", color: "#22c55e" },
    ];

    return { score, ...levels[Math.min(score, 4)] };
  };

  const validateFields = (): boolean => {
    const errors: FieldErrors = {};

    if (!name.trim()) {
      errors.name = "Please enter your name.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!password.trim() || !passwordRegex.test(password)) {
      errors.password =
        "Password must be at least 6 characters with letters and numbers.";
    }

    if (!acceptTerms && submitAttempted) {
      errors.terms = "You must accept the terms and conditions.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setGlobalError(null);

    if (!validateFields()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data?.email?.[0] ||
          data?.detail ||
          data?.message ||
          "Something went wrong while creating your account.";
        setGlobalError(msg);
        showToast(msg, "error");
        return;
      }

      // const data = await res.json(); // we don't actually need tokens now
      showToast("Account created successfully! Redirecting to login...", "success");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err: any) {
      const errorMessage =
        err?.message || "Something went wrong while creating your account.";
      setGlobalError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    if (!fieldErrors[field]) return;
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="signup-screen">
      <div className="signup-card">
        {/* Logo */}
        <div className="signup-logo">
          <div className="signup-logo-main" />
          <div className="signup-logo-dot signup-logo-dot-1" />
          <div className="signup-logo-dot signup-logo-dot-2" />
        </div>

        {/* Titles */}
        <h1 className="signup-title">
          Sign up to <span>Edu2Job</span>
        </h1>
        <p className="signup-subtitle">
          Sign up and start your journey towards your dream job.
        </p>

        {/* Form */}
        <form
          className="signup-form"
          onSubmit={handleSubmit}
          aria-label="Registration form"
        >
          {/* Name */}
          <div className="signup-field-wrapper">
            <label htmlFor="name" className="sr-only">
              Your Name
            </label>
            <div
              className={`signup-field ${fieldErrors.name ? "signup-field-has-error" : ""
                }`}
            >
              <input
                ref={nameInputRef}
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError("name");
                }}
                onKeyDown={handleKeyDown}
                className={`signup-input ${fieldErrors.name ? "signup-input-error" : ""
                  }`}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                disabled={loading}
              />
            </div>
            {fieldErrors.name && (
              <div
                id="name-error"
                className="signup-field-error-text"
                role="alert"
              >
                {fieldErrors.name}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="signup-field-wrapper">
            <label htmlFor="email" className="sr-only">
              Email Address
            </label>
            <div
              className={`signup-field ${fieldErrors.email ? "signup-field-has-error" : ""
                }`}
            >
              <input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                onKeyDown={handleKeyDown}
                className={`signup-input ${fieldErrors.email ? "signup-input-error" : ""
                  }`}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                disabled={loading}
              />
            </div>
            {fieldErrors.email && (
              <div
                id="email-error"
                className="signup-field-error-text"
                role="alert"
              >
                {fieldErrors.email}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="signup-field-wrapper">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div
              className={`signup-field signup-password-field ${fieldErrors.password ? "signup-field-has-error" : ""
                }`}
            >
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                onKeyDown={handleKeyDown}
                className={`signup-input ${fieldErrors.password ? "signup-input-error" : ""
                  }`}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
                disabled={loading}
              />
              <button
                type="button"
                className="signup-eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {/* same eye icon as before */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {password && (
              <div className="password-strength-indicator">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${(getPasswordStrength(password).score / 4) * 100
                        }%`,
                      backgroundColor: getPasswordStrength(password).color,
                    }}
                  />
                </div>
                <span
                  style={{
                    color: getPasswordStrength(password).color,
                    fontSize: "12px",
                  }}
                >
                  {getPasswordStrength(password).label}
                </span>
              </div>
            )}
            {fieldErrors.password && (
              <div
                id="password-error"
                className="signup-field-error-text"
                role="alert"
              >
                {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="signup-field-wrapper">
            <div className="terms-checkbox">
              <label className="terms-label">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    clearFieldError("terms");
                  }}
                  disabled={loading}
                  className="terms-input"
                  aria-describedby={
                    fieldErrors.terms ? "terms-error" : undefined
                  }
                />
                <span className="terms-text">
                  I agree to the{" "}
                  <button
                    type="button"
                    className="terms-link"
                    onClick={() => window.open("/terms", "_blank")}
                    disabled={loading}
                  >
                    Terms &amp; Conditions
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="terms-link"
                    onClick={() => window.open("/privacy", "_blank")}
                    disabled={loading}
                  >
                    Privacy Policy
                  </button>
                </span>
              </label>
              {fieldErrors.terms && (
                <div
                  id="terms-error"
                  className="signup-field-error-text"
                  role="alert"
                >
                  {fieldErrors.terms}
                </div>
              )}
            </div>
          </div>

          {/* Global (API) error */}
          {globalError && (
            <div className="signup-error" role="alert">
              {globalError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="signup-submit-btn"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <div >
                <span>Creating account...</span>
              </div>
            ) : (
              "Sign up"
            )}
          </button>

          {/* Google Login */}
          <div className="social-login">
            <p className="social-divider">Or continue with</p>
            <div className="social-buttons">
              <GoogleLoginButton disabled={loading} variant="register" />
            </div>
          </div>
        </form>

        {/* Bottom link */}
        <div className="signup-bottom-text">
          Have an account?
          <button
            type="button"
            className="signup-link"
            onClick={() => navigate("/login")}
            disabled={loading}
          >
            {" "}
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
