// src/auth/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "./ToastContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

type User = {
  id?: number;
  email: string;
  name: string;
  role: "admin" | "student";
  username?: string;
  token: string;
  provider?: "email" | "google";
  picture?: string;
  is_admin?: boolean;

  // ⭐ CRITICAL: Add these flag fields
  is_flagged?: boolean;
  flag_reason?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  loginWithGoogle: (accessToken: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  refreshUserData: () => Promise<void>; // ⭐ NEW: Function to refresh user data
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        setIsLoading(true);
        const rememberMe = localStorage.getItem("rememberMe") === "true";

        const storedToken = rememberMe
          ? localStorage.getItem("token")
          : sessionStorage.getItem("token");

        const storedUser = rememberMe
          ? localStorage.getItem("user")
          : sessionStorage.getItem("user");

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);

          // ⭐ Ensure stored user has flag fields (for backward compatibility)
          const userWithFlags: User = {
            ...parsedUser,
            is_flagged: parsedUser.is_flagged || false,
            flag_reason: parsedUser.flag_reason || "",
          };

          console.log("DEBUG LoadAuth - User loaded from storage:", userWithFlags);
          console.log("DEBUG LoadAuth - is_flagged:", userWithFlags.is_flagged);
          console.log("DEBUG LoadAuth - flag_reason:", userWithFlags.flag_reason);

          setToken(storedToken);
          setUser(userWithFlags);
        }
      } catch (error) {
        console.error("Error loading auth data:", error);
        showToast("Failed to load session", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, [showToast]);

  // ⭐ UPDATED: Normal login with backend JWT
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      setIsLoading(true);

      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        showToast(errorData.detail || "Invalid email or password", "error");
        return false;
      }

      const data = await res.json();

      // ⭐ CRITICAL: Make sure backend returns ALL user fields including flags
      const backendUser = data.user;
      const jwtToken = data.tokens.access;

      // Debug logging
      console.log("DEBUG Login - Full backend response:", data);
      console.log("DEBUG Login - Backend user object:", backendUser);
      console.log("DEBUG Login - is_flagged:", backendUser?.is_flagged);
      console.log("DEBUG Login - flag_reason:", backendUser?.flag_reason);

      if (!backendUser) {
        showToast("Login failed: No user data received", "error");
        return false;
      }

      // ⭐ Create complete user object with ALL fields from backend
      const userForContext: User = {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.name || backendUser.email.split("@")[0],
        role: backendUser.role || "student",
        token: jwtToken,
        provider: "email",
        is_flagged: backendUser.is_flagged || false,
        flag_reason: backendUser.flag_reason || "",
      };

      console.log("DEBUG Login - Final user object:", userForContext);

      // Clear old storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      if (rememberMe) {
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("user", JSON.stringify(userForContext));
        localStorage.setItem("rememberMe", "true");
      } else {
        sessionStorage.setItem("token", jwtToken);
        sessionStorage.setItem("user", JSON.stringify(userForContext));
        localStorage.setItem("rememberMe", "false");
      }

      setUser(userForContext);
      setToken(jwtToken);

      showToast("Login successful", "success");
      return true;

    } catch (error) {
      console.error("Login error:", error);
      showToast("Login failed. Please try again.", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ⭐ UPDATED: Google login
  const loginWithGoogle = async (accessToken: string): Promise<User> => {
    try {
      setIsLoading(true);

      const res = await fetch(`${API_BASE}/auth/google/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (!res.ok) {
        console.error("Backend Google login failed with status:", res.status);
        showToast("Google login failed. Please try again.", "error");
        throw new Error("Google login failed");
      }

      const data = await res.json();
      const backendUser = data.user;
      const jwtToken: string = data.tokens.access;

      console.log("DEBUG Google Login - Backend user:", backendUser);

      // ⭐ Create complete user object with flag fields
      const userForContext: User = {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.name || backendUser.email.split("@")[0],
        role: (backendUser.role as "admin" | "student") || "student",
        token: jwtToken,
        provider: "google",
        is_flagged: backendUser.is_flagged || false,
        flag_reason: backendUser.flag_reason || "",
      };

      console.log("DEBUG Google Login - Final user object:", userForContext);

      // Remember Google users by default
      const rememberMe = true;

      // Clear old storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      if (rememberMe) {
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("user", JSON.stringify(userForContext));
        localStorage.setItem("rememberMe", "true");
      } else {
        sessionStorage.setItem("token", jwtToken);
        sessionStorage.setItem("user", JSON.stringify(userForContext));
        localStorage.setItem("rememberMe", "false");
      }

      setUser(userForContext);
      setToken(jwtToken);

      showToast("Google login successful", "success");
      return userForContext;
    } catch (error) {
      console.error("Google login error:", error);
      showToast("Google login failed", "error");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ⭐ NEW: Function to refresh user data from backend
  const refreshUserData = async (): Promise<void> => {
    try {
      const currentToken = token || localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!currentToken || !user) return;

      console.log("DEBUG Refresh - Refreshing user data...");

      const res = await fetch(`${API_BASE}/profile/`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const backendUser = data.user;

        if (backendUser) {
          // Update user with latest data including flags
          const updatedUser: User = {
            ...user,
            ...backendUser, // Merge all backend fields
            token: user.token, // Keep existing token
            is_flagged: backendUser.is_flagged || false,
            flag_reason: backendUser.flag_reason || "",
          };

          console.log("DEBUG Refresh - Updated user:", updatedUser);
          console.log("DEBUG Refresh - is_flagged:", updatedUser.is_flagged);

          // Update state
          setUser(updatedUser);

          // Update storage
          const rememberMe = localStorage.getItem("rememberMe") === "true";
          if (rememberMe) {
            localStorage.setItem("user", JSON.stringify(updatedUser));
          } else {
            sessionStorage.setItem("user", JSON.stringify(updatedUser));
          }

          console.log("DEBUG Refresh - User data refreshed successfully");
        }
      } else {
        console.warn("DEBUG Refresh - Failed to refresh user data, status:", res.status);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
    sessionStorage.clear();
    showToast("Logged out successfully", "info");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        loginWithGoogle,
        logout,
        isLoading,
        refreshUserData // ⭐ Add refresh function to context
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};