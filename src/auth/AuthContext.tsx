// src/auth/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "./ToastContext";

const API_BASE = "http://127.0.0.1:8000/api";

type User = {
  id?: number;
  email: string;
  name: string;                 // ✅ ADD
  role: "admin" | "student";    // ✅ ADD
  username?: string;
  token: string;
  provider?: "email" | "google";
  picture?: string;
  is_admin?: boolean;        // for backward compatibility
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (user: User, token: string, rememberMe?: boolean) => void;
  loginWithGoogle: (accessToken: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
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
        // const storedToken = localStorage.getItem("token");
        // const storedUser = localStorage.getItem("user");
        const rememberMe = localStorage.getItem("rememberMe") === "true";
        
        const storedToken = rememberMe
          ? localStorage.getItem("token")
          : sessionStorage.getItem("token");

        const storedUser = rememberMe
          ? localStorage.getItem("user")
          : sessionStorage.getItem("user");

        if (storedToken && storedUser && rememberMe) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

        } else if (!rememberMe) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
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

  // NORMAL login with backend JWT
  const login = (user: User, token: string, rememberMe: boolean = false) => {
  setUser(user);
  setToken(token);

  // clear old storage
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  if (rememberMe) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("rememberMe", "true");
  } else {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("rememberMe", "false");
  }
};

  // GOOGLE login: send access_token to backend and receive our own JWT
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

      const backendUser = data.user as {
        email: string;
        name?: string;
        role?: string;
      };
      const jwtToken: string = data.tokens.access;

      const userForContext: User = {
        email: backendUser.email,
        name: backendUser.name ?? backendUser.email.split("@")[0],
        role: (backendUser.role as "admin" | "student") ?? "student",
        token: jwtToken,
        provider: "google",
    };
      // Remember Google users by default
      login(userForContext, jwtToken, true);
      return userForContext;
    } catch (error) {
      console.error("Google login error:", error);
      // toast already shown above
      throw error;
    } finally {
      setIsLoading(false);
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
      value={{ user, token, login, loginWithGoogle, logout, isLoading }}
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
