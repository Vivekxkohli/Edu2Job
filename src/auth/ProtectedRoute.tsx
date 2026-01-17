import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
