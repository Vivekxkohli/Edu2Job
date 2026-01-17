import React, { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../auth/ToastContext";
import GoogleLoginButton from "./GoogleLoginButton";

// No need for API_BASE here anymore - using AuthContext's login function

const LoginForm: React.FC = () => {
  const { login } = useAuth(); // ⭐ This is the NEW login function that returns Promise<boolean>
  const { showToast } = useToast();
  const navigate = useNavigate();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  // Auto-focus first input
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  // Real-time email validation
  useEffect(() => {
    if (email && email.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address",
        }));
      } else {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    }
  }, [email]);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) newErrors.email = "Please enter your email.";
    if (!password.trim()) newErrors.password = "Please enter your password.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast("Please check your credentials", "error");
      return;
    }

    try {
      setLoading(true);

      // ⭐ USE THE NEW LOGIN FUNCTION FROM AUTHCONTEXT
      // This function now properly fetches user data including flags
      const success = await login(email, password, rememberMe);

      if (success) {
        showToast("Login successful! Redirecting...", "success");
        
        // Get the user from localStorage to check role
        const storedUser = rememberMe 
          ? localStorage.getItem("user") 
          : sessionStorage.getItem("user");
        
        let userRole = "student";
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            userRole = parsedUser.role || "student";
          } catch (e) {
            console.error("Error parsing stored user:", e);
          }
        }

        setTimeout(() => {
          if (userRole === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }, 800);
      } else {
        // Error is already handled by the login function
        setErrors({ password: "Invalid email or password" });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ password: "Something went wrong. Please try again." });
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleForgotPassword = () => {
    showToast("Password reset feature coming soon!", "info");
  };

  return (
    <form className="signup-form" onSubmit={handleSubmit} aria-label="Login form">
      {/* EMAIL */}
      <div className="signup-field-wrapper">
        <label htmlFor="login-email" className="sr-only">
          Email Address
        </label>
        <div
          className={`signup-field ${
            errors.email ? "signup-field-has-error" : ""
          }`}
        >
          <input
            ref={emailInputRef}
            id="login-email"
            type="email"
            className={`signup-input ${
              errors.email ? "signup-input-error" : ""
            }`}
            placeholder="Email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            onKeyDown={handleKeyDown}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            disabled={loading}
          />
        </div>
        {errors.email && (
          <div
            id="login-email-error"
            className="signup-field-error-text"
            role="alert"
          >
            {errors.email}
          </div>
        )}
      </div>

      {/* PASSWORD */}
      <div className="signup-field-wrapper">
        <label htmlFor="login-password" className="sr-only">
          Password
        </label>
        <div
          className={`signup-field signup-password-field ${
            errors.password ? "signup-field-has-error" : ""
          }`}
        >
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            className={`signup-input ${
              errors.password ? "signup-input-error" : ""
            }`}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            onKeyDown={handleKeyDown}
            aria-describedby={
              errors.password ? "login-password-error" : undefined
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
        {errors.password && (
          <div
            id="login-password-error"
            className="signup-field-error-text"
            role="alert"
          >
            {errors.password}
          </div>
        )}
      </div>

      {/* Login Options */}
      <div className="login-options">
        <label className="remember-me">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading}
            className="remember-checkbox"
          />
          <span className="remember-text">Remember me</span>
        </label>
        <button
          type="button"
          className="forgot-password"
          onClick={handleForgotPassword}
          disabled={loading}
        >
          Forgot Password?
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="signup-submit-btn"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? (
          <div>
            <span>Logging in...</span>
          </div>
        ) : (
          "Log In"
        )}
      </button>

      {/* Google Login */}
      <div className="social-login">
        <p className="social-divider">Or continue with</p>
        <div className="social-buttons">
          <GoogleLoginButton disabled={loading} variant="login" />
        </div>
      </div>
    </form>
  );
};

export default LoginForm;